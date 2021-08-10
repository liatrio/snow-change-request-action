import * as core from "@actions/core";
import * as github from "@actions/github";
import actions from "./actions/index.js";
import { getInputs } from "./inputs.js";
import * as serviceNow from "./snow.js";

const fail = (message) => {
  core.setFailed(message);
  process.exit(1);
};

(async () => {
  try {
    const inputs = getInputs();
    const action = actions[inputs.action];
    if (!action) {
      fail(`Unsupported action value: ${action}`);
    }

    const snow = serviceNow.newClient(inputs);
    const octokit = github.getOctokit(inputs.githubToken);

    await action({
      snow,
      octokit,
      inputs,
    });
  } catch (error) {
    fail(`Error performing action on change request: ${error.stack}`);
  }
})();
