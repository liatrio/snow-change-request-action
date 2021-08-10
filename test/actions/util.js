import Chance from "chance";

const chance = new Chance();

export const mockServiceNowClient = () => ({
  patch: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
});

export const mockOctokit = () => ({
  rest: {
    issues: {
      createComment: jest.fn(),
      listComments: jest.fn(),
      updateComment: jest.fn(),
    },
    repos: {
      listPullRequestsAssociatedWithCommit: jest.fn(),
    },
  },
});

export const fakeGitHubContext = () => ({
  issue: {
    number: chance.integer({ min: 1, max: 100 }),
    owner: chance.word(),
    repo: chance.word(),
  },
  repo: {
    owner: chance.word(),
    repo: chance.word(),
  },
  sha: chance.word(),
});

export const createInputs = (action) => ({
  action,
  approvalAssignmentGroup: chance.word(),
  attachmentFilePath: chance.word(),
  attachmentFileName: chance.word(),
  attachmentFileContentType: chance.word(),
  changeRequestMessage: chance.sentence(),
  githubToken: chance.word(),
  transition: chance.pickone(["implement", "review", "closed"]),
  requestSysId: createSysId(),
  serviceNowUrl: chance.url(),
  serviceNowUsername: chance.word(),
  serviceNowPassword: chance.word(),
});

export const createSysId = () => chance.guid().replace(/-/g, "");
