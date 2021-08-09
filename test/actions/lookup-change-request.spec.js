import Chance from "chance";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { lookupChangeRequest } from "../../actions/lookup-change-request.js";
import {
  createSysId,
  createInputs,
  fakeGitHubContext,
  mockOctokit,
} from "./util.js";

jest.mock("@actions/core");

describe("lookup-change-request", () => {
  const chance = new Chance();

  let githubContext,
    expectedInputs,
    expectedSysId,
    pullRequests,
    expectedPrNumber,
    octokit;

  beforeEach(() => {
    expectedInputs = createInputs("lookup-change-request");
    octokit = mockOctokit();

    expectedSysId = createSysId();

    pullRequests = chance.n(
      () => ({ number: chance.integer() }),
      chance.d4() + 1
    );
    expectedPrNumber = chance.pickone(pullRequests).number;
    octokit.rest.repos.listPullRequestsAssociatedWithCommit.mockResolvedValue({
      data: pullRequests,
    });
    octokit.rest.issues.listComments.mockImplementation(({ issue_number }) => {
      const comments = chance.n(
        () => ({ body: chance.string() }),
        chance.d4() + 1
      );

      if (issue_number === expectedPrNumber) {
        comments.push({
          body: `
${chance.word()}
<!--sysid: ${expectedSysId}-->`,
        });
      }

      return Promise.resolve({
        data: chance.shuffle(comments),
      });
    });

    githubContext = fakeGitHubContext();
    jest
      .spyOn(github.context, "repo", "get")
      .mockReturnValue(githubContext.repo);
    github.context.sha = githubContext.sha;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should list pull requests associated with the commit", async () => {
    await lookupChangeRequest({ octokit, inputs: expectedInputs });

    expect(
      octokit.rest.repos.listPullRequestsAssociatedWithCommit
    ).toHaveBeenCalledTimes(1);
    expect(
      octokit.rest.repos.listPullRequestsAssociatedWithCommit
    ).toHaveBeenCalledWith({
      owner: githubContext.repo.owner,
      repo: githubContext.repo.repo,
      commit_sha: githubContext.sha,
    });
  });

  it("should list comments for the associated PR", async () => {
    await lookupChangeRequest({ octokit, inputs: expectedInputs });

    expect(octokit.rest.issues.listComments).toHaveBeenCalledWith({
      owner: githubContext.repo.owner,
      repo: githubContext.repo.repo,
      issue_number: expectedPrNumber,
      per_page: 100,
    });
  });

  it("should output the discovered sysid", async () => {
    await lookupChangeRequest({ octokit, inputs: expectedInputs });

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith("sysId", expectedSysId);
  });

  describe("there are no associated pull requests", () => {
    beforeEach(async () => {
      octokit.rest.repos.listPullRequestsAssociatedWithCommit.mockResolvedValue(
        {
          data: [],
        }
      );

      await lookupChangeRequest({ octokit, inputs: expectedInputs });
    });

    it("should fail the action", () => {
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });

    it("should not try to list comments", () => {
      expect(octokit.rest.issues.listComments).not.toHaveBeenCalled();
    });
  });

  describe("none of the comments contain a sysid", () => {
    beforeEach(async () => {
      octokit.rest.issues.listComments.mockResolvedValue({
        data: [],
      });

      await lookupChangeRequest({ octokit, inputs: expectedInputs });
    });

    it("should fail the action", () => {
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });
  });
});
