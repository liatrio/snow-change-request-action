import Chance from "chance";
import dayjs from "../../dayjs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { createChangeRequest } from "../../actions/create.js";
import {
  createSysId,
  createInputs,
  fakeGitHubContext,
  mockServiceNowClient,
  mockOctokit,
} from "./util.js";

jest.mock("@actions/core");

describe("create", () => {
  const chance = new Chance();
  let expectedInputs,
    expectedChangeRequestNumber,
    expectedChangeRequestSysId,
    currentTime,
    groupSysId,
    githubContext,
    octokit,
    snowClient;

  beforeEach(() => {
    expectedInputs = createInputs("create");
    snowClient = mockServiceNowClient();

    groupSysId = createSysId();
    snowClient.get.mockResolvedValue({
      result: [
        {
          sys_id: groupSysId,
        },
      ],
    });

    expectedChangeRequestNumber = chance.word();
    expectedChangeRequestSysId = createSysId();
    snowClient.post.mockResolvedValue({
      result: {
        number: {
          value: expectedChangeRequestNumber,
        },
        sys_id: {
          value: expectedChangeRequestSysId,
        },
      },
    });

    octokit = mockOctokit();
    octokit.rest.issues.createComment.mockResolvedValue({
      data: {
        html_url: chance.url(),
      },
    });
    githubContext = fakeGitHubContext();
    jest
      .spyOn(github.context, "issue", "get")
      .mockReturnValue(githubContext.issue);

    currentTime = chance.date();
    jest.useFakeTimers();
    jest.setSystemTime(currentTime);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should lookup the assignment group sysid", async () => {
    await createChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(snowClient.get).toHaveBeenCalledTimes(1);
    expect(snowClient.get).toHaveBeenCalledWith({
      path: "/api/now/table/sys_user_group",
      params: {
        name: expectedInputs.approvalAssignmentGroup,
      },
    });
  });

  it("should create a normal change request and move it to assess", async () => {
    const expectedStart = dayjs.utc(currentTime).format("YYYY-MM-DD HH:mm:ss");
    const expectedEnd = dayjs
      .utc(currentTime)
      .add(1, "hour")
      .format("YYYY-MM-DD HH:mm:ss");

    await createChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(snowClient.post).toHaveBeenCalledTimes(1);
    expect(snowClient.post).toHaveBeenCalledWith({
      path: "/api/sn_chg_rest/change/normal",
      body: {
        assignment_group: groupSysId,
        description: expectedInputs.changeRequestMessage,
        short_description: "Automated change request",
        state: "assess",
        start_date: expectedStart,
        end_date: expectedEnd,
      },
    });
  });

  it("should output the sysid and change request number", async () => {
    await createChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith(
      "sysId",
      expectedChangeRequestSysId
    );
    expect(core.setOutput).toHaveBeenCalledWith(
      "number",
      expectedChangeRequestNumber
    );
  });

  it("should post a comment on the pull request", async () => {
    await createChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1);
    const args = octokit.rest.issues.createComment.mock.calls[0][0];
    expect(args.owner).toEqual(githubContext.issue.owner);
    expect(args.repo).toEqual(githubContext.issue.repo);
    expect(args.issue_number).toEqual(githubContext.issue.number);
    expect(args.body).toContain(expectedChangeRequestSysId);
  });

  describe("the action is not run in the context of a pull request", () => {
    beforeEach(() => {
      delete githubContext.issue.number;
    });

    it("should not post a comment", async () => {
      await createChangeRequest({
        snow: snowClient,
        octokit,
        inputs: expectedInputs,
      });

      expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
  });
});
