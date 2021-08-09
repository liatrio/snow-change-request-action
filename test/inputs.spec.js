import Chance from "chance";
import * as core from "@actions/core";
import { getInputs } from "../inputs.js";

jest.mock("@actions/core");

describe("inputs", () => {
  const chance = new Chance();

  let inputs;

  beforeEach(() => {
    inputs = {
      action: "approve",
      githubToken: chance.word(),
      requestSysId: chance.guid(),
      serviceNowUrl: chance.url(),
      serviceNowUsername: chance.word(),
      serviceNowPassword: chance.word(),
    };

    core.getInput.mockImplementation((inputName) => inputs[inputName]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should validate successfully", () => {
    const actualInputs = getInputs();

    expect(actualInputs.action).toEqual("approve");
    expect(actualInputs.githubToken).toEqual(inputs.githubToken);
    expect(actualInputs.requestSysId).toEqual(inputs.requestSysId);
    expect(actualInputs.serviceNowUrl).toEqual(inputs.serviceNowUrl);
    expect(actualInputs.serviceNowUsername).toEqual(inputs.serviceNowUsername);
    expect(actualInputs.serviceNowPassword).toEqual(inputs.serviceNowPassword);
  });

  it.each([
    "githubToken",
    "serviceNowUrl",
    "serviceNowUsername",
    "serviceNowPassword",
  ])("should require missing field %s", (field) => {
    inputs[field] = "";

    expect(getInputs).toThrow(`"${field}" is not allowed to be empty`);
  });

  it("should not allow unknown actions", () => {
    inputs.action = chance.word();

    expect(getInputs).toThrow(`"action" must be one of`);
  });

  describe("attach-file inputs", () => {
    let expectedAttachmentFilePath;

    beforeEach(() => {
      expectedAttachmentFilePath = chance.word();

      inputs.action = "attach-file";
      inputs.attachmentFilePath = expectedAttachmentFilePath;
    });

    it("should validate successfully and apply defaults", () => {
      const actualInputs = getInputs();

      expect(actualInputs.action).toEqual("attach-file");
      expect(actualInputs.attachmentFilePath).toEqual(
        expectedAttachmentFilePath
      );
      expect(actualInputs.attachmentFileName).toBeUndefined();
      expect(actualInputs.attachmentFileContentType).toEqual(
        "application/text"
      );
    });

    it("should allow a file name to be set", () => {
      const expectedFileName = chance.word();
      inputs.attachmentFileName = expectedFileName;

      const actualInputs = getInputs();

      expect(actualInputs.attachmentFileName).toEqual(expectedFileName);
    });

    it("should allow a content type to override the default", () => {
      const expectedContentType = chance.word();
      inputs.attachmentFileContentType = expectedContentType;

      const actualInputs = getInputs();

      expect(actualInputs.attachmentFileContentType).toEqual(
        expectedContentType
      );
    });

    it.each(["attachmentFilePath", "requestSysId"])(
      "should require missing field %s",
      (field) => {
        inputs[field] = "";

        expect(getInputs).toThrow(`"${field}" is not allowed to be empty`);
      }
    );
  });

  describe("create inputs", () => {
    let expectedAssignmentGroup, expectedChangeRequestMessage;

    beforeEach(() => {
      expectedAssignmentGroup = chance.word();
      expectedChangeRequestMessage = chance.word();

      inputs.action = "create";
      inputs.approvalAssignmentGroup = expectedAssignmentGroup;
      inputs.changeRequestMessage = expectedChangeRequestMessage;
    });

    it("should validate successfully", () => {
      const actualInputs = getInputs();

      expect(actualInputs.action).toEqual("create");
      expect(actualInputs.approvalAssignmentGroup).toEqual(
        expectedAssignmentGroup
      );
      expect(actualInputs.changeRequestMessage).toEqual(
        expectedChangeRequestMessage
      );
    });

    it.each(["approvalAssignmentGroup", "changeRequestMessage"])(
      "should require missing field %s",
      (field) => {
        inputs[field] = "";

        expect(getInputs).toThrow(`"${field}" is not allowed to be empty`);
      }
    );
  });

  describe("lookup-change-request inputs", () => {
    beforeEach(() => {
      inputs.action = "lookup-change-request";
    });

    it("should validate successfully", () => {
      expect(getInputs).not.toThrow();
    });
  });

  describe("require-approval inputs", () => {
    beforeEach(() => {
      inputs.action = "require-approval";
    });

    it("should validate successfully", () => {
      expect(getInputs).not.toThrow();
    });
  });

  describe("transition inputs", () => {
    beforeEach(() => {
      inputs.action = "transition";
    });

    it.each(["implement", "review", "closed"])(
      "should allow a transition to %s",
      (field) => {
        inputs.transition = field;

        expect(getInputs).not.toThrow();
      }
    );

    it('should allow multiple states', () => {
      inputs.transition = 'implement|review|closed';

      expect(getInputs).not.toThrow();
    })

    it("should not allow an invalid transition", () => {
      inputs.transition = chance.word();

      expect(getInputs).toThrow('fails to match the required pattern');
    });

    it("should not allow an empty value", () => {
      inputs.transition = "";

      expect(getInputs).toThrow();
    });
  });
});
