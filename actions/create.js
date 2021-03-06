import * as core from "@actions/core";
import * as github from "@actions/github";
import dayjs from "../dayjs.js";

export const createChangeRequest = async ({ snow, octokit, inputs }) => {
  core.info("Finding approval groups");
  const userGroups = await snow.get({
    path: "/api/now/table/sys_user_group",
    params: {
      name: inputs.approvalAssignmentGroup,
    },
  });
  const approvalGroupId = userGroups.result[0].sys_id;
  core.info(
    `Using approval group ${inputs.approvalAssignmentGroup} with sysid: ${approvalGroupId}`
  );

  const now = dayjs.utc();
  const changeStart = now.format("YYYY-MM-DD HH:mm:ss");
  const changeEnd = now.add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

  core.info("Creating change request");
  const changeRequest = await snow.post({
    path: "/api/sn_chg_rest/change/normal",
    body: {
      assignment_group: approvalGroupId,
      description: inputs.changeRequestMessage,
      short_description: "Automated change request",
      state: "assess",
      start_date: changeStart,
      end_date: changeEnd,
    },
  });
  const requestNumber = changeRequest?.result?.number?.value;
  const sysId = changeRequest?.result?.sys_id?.value;

  const link = `${inputs.serviceNowUrl}/nav_to.do?uri=${encodeURIComponent(
    `/change_request.do?sys_id=${sysId}`
  )}`;
  core.info("Successfully created change request");
  core.info(`View the change request: ${link}`);

  core.setOutput("sysId", sysId);
  core.setOutput("number", requestNumber);

  const comment = `
# ServiceNow Change Request

[\`${requestNumber}\`](${link})

Approval: \`requested\`

<!---sysid: ${sysId}--->
`;
  const { owner, repo, number: issue_number } = github.context.issue;

  if (issue_number) {
    core.info(`Commenting on pull request ${owner}/${repo}#${issue_number}`);

    const response = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: comment,
    });

    core.info(response.data.html_url);
  }
};
