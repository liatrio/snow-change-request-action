import Chance from "chance";
import { createInputs, mockServiceNowClient } from "./util.js";
import { attachFile } from "../../actions/attach-file.js";
import path from "path";
import fs from "fs/promises";

jest.mock("fs/promises");
jest.mock("@actions/core");
describe("attach-file", () => {
  const chance = new Chance();
  let expectedInputs, fileContents, snowClient;

  beforeEach(() => {
    expectedInputs = createInputs("attach-file");
    snowClient = mockServiceNowClient();

    fileContents = chance.string();
    fs.readFile.mockResolvedValue(fileContents);

    snowClient.post.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should make a POST request to attach the file", async () => {
    await attachFile({ snow: snowClient, inputs: expectedInputs });

    expect(snowClient.post).toHaveBeenCalledTimes(1);
    expect(snowClient.post).toHaveBeenCalledWith({
      path: "/api/now/attachment/file",
      params: {
        table_name: "change_request",
        table_sys_id: expectedInputs.requestSysId,
        file_name: expectedInputs.attachmentFileName,
      },
      headers: {
        "Content-Type": expectedInputs.attachmentFileContentType,
      },
      body: fileContents,
    });
  });

  describe("an attachment file name is not specified", () => {
    let expectedFileName;
    beforeEach(() => {
      delete expectedInputs.attachmentFileName;

      expectedFileName = chance.word();
      expectedInputs.attachmentFilePath = path.join(
        chance.word(),
        chance.word(),
        expectedFileName
      );
    });

    it("should use the file name as the name", async () => {
      await attachFile({ snow: snowClient, inputs: expectedInputs });

      expect(snowClient.post).toHaveBeenCalledTimes(1);
      expect(snowClient.post).toHaveBeenCalledWith({
        path: "/api/now/attachment/file",
        params: {
          table_name: "change_request",
          table_sys_id: expectedInputs.requestSysId,
          file_name: expectedFileName,
        },
        headers: {
          "Content-Type": expectedInputs.attachmentFileContentType,
        },
        body: fileContents,
      });
    });
  });
});
