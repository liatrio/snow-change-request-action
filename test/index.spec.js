import * as github from "@actions/github";
import * as core from "@actions/core";
import Chance from "chance";
import { newClient } from "../snow.js";
import {
  createInputs,
  mockServiceNowClient,
  mockOctokit,
} from "./actions/util.js";
import { getInputs } from "../inputs.js";
import actions from "../actions/index.js";

jest.mock("@actions/core");
jest.mock("@actions/github");
jest.mock("../actions/index.js");

jest.mock("../snow.js");
jest.mock("../inputs.js");

describe("index", () => {
  const chance = new Chance();
  let expectedInputs, snowClient, octokit;

  beforeEach(() => {
    expectedInputs = createInputs("create");
    getInputs.mockReturnValue(expectedInputs);

    snowClient = mockServiceNowClient();
    newClient.mockReturnValue(snowClient);

    octokit = mockOctokit();
    github.getOctokit.mockReturnValue(octokit);

    process.exit = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should instantiate the ServiceNow client", () => {
    expect.assertions(2);

    jest.isolateModules(() => {
      require("../index");

      expect(newClient).toHaveBeenCalledTimes(1);
      expect(newClient).toHaveBeenCalledWith(expectedInputs);
    });
  });

  it("should instantiate an octokit client", () => {
    expect.assertions(2);

    jest.isolateModules(() => {
      require("../index");

      expect(github.getOctokit).toHaveBeenCalledTimes(1);
      expect(github.getOctokit).toHaveBeenCalledWith(
        expectedInputs.githubToken
      );
    });
  });

  it("should call the action", async () => {
    expect.assertions(2);

    jest.isolateModules(() => {
      require("../index");

      expect(actions["create"]).toHaveBeenCalledTimes(1);
      expect(actions["create"]).toHaveBeenCalledWith({
        inputs: expectedInputs,
        octokit,
        snow: snowClient,
      });
    });
  });

  describe("unknown action", () => {
    it("should fail the step", () => {
      expect.assertions(3);

      jest.isolateModules(() => {
        expectedInputs.action = chance.word();

        require("../index");

        expect(core.setFailed).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });

  describe("action failed", () => {
    it("should fail the step", () => {
      expect.assertions(3);

      jest.isolateModules(() => {
        actions["create"].mockImplementation(() => {
          throw new Error(chance.word());
        });

        require("../index");

        expect(core.setFailed).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
