import Chance from "chance";
import * as github from "@actions/github";
import {
  createInputs,
  fakeGitHubContext,
  mockServiceNowClient,
  mockOctokit,
} from "./util.js";
import { approveNormalChangeRequest } from "../../actions/approve.js";

jest.mock("../../snow.js");
jest.mock("@actions/core");

describe("approve", () => {
  const chance = new Chance();
  let expectedInputs, githubContext, expectedCommentId, octokit, snowClient;

  beforeEach(() => {
    expectedInputs = createInputs("approve");
    octokit = mockOctokit();

    expectedCommentId = chance.integer();
    const comments = chance.n(
      () => ({
        body: chance.word(),
        id: chance.integer(),
      }),
      chance.d4() + 1
    );
    comments.push({
      body: `
Approval: \`requested\`
<!--sysid: ${expectedInputs.requestSysId}-->            
            `,
      id: expectedCommentId,
    });
    octokit.rest.issues.listComments.mockResolvedValue({
      data: chance.shuffle(comments),
    });

    githubContext = fakeGitHubContext();
    jest
      .spyOn(github.context, "issue", "get")
      .mockReturnValue(githubContext.issue);
    snowClient = mockServiceNowClient();
    snowClient.patch.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should approve the change request -- once for the assignment group and once for the CAB", async () => {
    await approveNormalChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(snowClient.patch).toHaveBeenCalledTimes(2);
    expect(snowClient.patch).toHaveBeenCalledWith({
      path: `/api/sn_chg_rest/change/${expectedInputs.requestSysId}/approvals`,
      body: {
        state: "approved",
      },
    });
  });

  it("should find and update the pull request comment", async () => {
    await approveNormalChangeRequest({
      snow: snowClient,
      octokit,
      inputs: expectedInputs,
    });

    expect(octokit.rest.issues.listComments).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.listComments).toHaveBeenCalledWith({
      owner: githubContext.issue.owner,
      repo: githubContext.issue.repo,
      issue_number: githubContext.issue.number,
      per_page: 100,
    });

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: githubContext.issue.owner,
      repo: githubContext.issue.repo,
      comment_id: expectedCommentId,
      body: expect.any(String),
    });
  });

  describe("there is no pull request comment containing a sysid", () => {
    beforeEach(() => {
      octokit.rest.issues.listComments.mockResolvedValue({
        data: [],
      });
    });

    it("should not try to update a comment", async () => {
      await approveNormalChangeRequest({
        snow: snowClient,
        octokit,
        inputs: expectedInputs,
      });

      expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
    });
  });
});
