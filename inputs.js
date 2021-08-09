import * as core from "@actions/core";
import actions from "./actions/index.js";
import joi from "joi";

const inputsSchema = {
  action: joi
    .string()
    .valid(...Object.keys(actions))
    .required(),
  approvalAssignmentGroup: joi.string().when("action", {
    is: joi.equal("create"),
    then: joi.required(),
    otherwise: joi.allow(""),
  }),
  attachmentFilePath: joi.string().when("action", {
    is: joi.equal("attach-file"),
    then: joi.required(),
    otherwise: joi.allow(""),
  }),
  attachmentFileName: joi.string().allow(""),
  attachmentFileContentType: joi
    .string()
    .allow("")
    .empty("")
    .default("application/text"),
  changeRequestMessage: joi.when("action", {
    is: joi.equal("create"),
    then: joi.string().required(),
    otherwise: joi.string().allow(""),
  }),
  githubToken: joi.string().required(),
  transition: joi.string().when("action", {
    is: joi.equal("transition"),
    then: joi.valid("implement", "review", "closed"),
    otherwise: joi.allow(""),
  }),
  requestSysId: joi.string().when("action", {
    is: joi.valid("approve", "attach-file", "require-approval", "transition"),
    then: joi.required(),
    otherwise: joi.allow(""),
  }),
  serviceNowUrl: joi.string().required(),
  serviceNowUsername: joi.string().required(),
  serviceNowPassword: joi.string().required(),
};

export const getInputs = () => {
  const inputs = {};
  Object.keys(inputsSchema).forEach((inputName) => {
    inputs[inputName] = core.getInput(inputName);
  });

  return joi.attempt(inputs, joi.object(inputsSchema));
};
