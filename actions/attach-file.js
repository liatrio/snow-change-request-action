import * as core from "@actions/core";
import path from "path";
import * as fs from "fs/promises";

export const attachFile = async ({ snow, inputs }) => {
  const fileName =
    inputs.attachmentFileName || path.basename(inputs.attachmentFilePath);
  const rawFile = await fs.readFile(inputs.attachmentFilePath, 'utf8');

  core.info("Attaching file to change request");
  await snow.post({
    path: "/api/now/attachment/file",
    params: {
      table_name: "change_request",
      table_sys_id: inputs.requestSysId,
      file_name: fileName,
    },
    headers: {
      "Content-Type": inputs.attachmentFileContentType,
    },
    body: rawFile,
  });
  core.info("Successfully attached file");
};
