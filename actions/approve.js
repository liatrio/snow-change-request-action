import * as core from "@actions/core";
import * as github from "@actions/github";

export const approveNormalChangeRequest = async ({ snow, octokit, inputs }) => {
  const approvalOptions = {
    path: `/api/sn_chg_rest/change/${inputs.requestSysId}/approvals`,
    body: {
      state: "approved",
    },
  };
  core.info("Approving change request (assignment group)");
  await snow.patch(approvalOptions);

  core.info("Approving change request (CAB Approval)");
  await snow.patch(approvalOptions);

  const { owner, repo, number: issue_number } = github.context.issue;
  const response = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number,
    per_page: 100,
  });
  const matchComment = new RegExp(
    `^<!-{2,}\\s*sysid:\\s*${inputs.requestSysId}\\s*-{2,}>\\s*$`,
    "m"
  );
  const comment = response.data.find((comment) =>
    matchComment.test(comment.body)
  );

  if (!comment) {
    core.warning("Unable to find change request comment");
    return;
  }

  core.info(`Updating comment ${comment.id}`);
  const updatedComment = comment.body.replace(
    "Approval: `requested`",
    "Approval: `approved`"
  );

  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: comment.id,
    body: updatedComment,
  });
};
