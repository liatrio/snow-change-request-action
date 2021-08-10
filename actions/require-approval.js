import * as core from "@actions/core";
import dayjs from "../dayjs.js";

export const requireChangeRequestApproval = async ({ snow, inputs }) => {
  const response = await snow.get({
    path: `/api/sn_chg_rest/change/${inputs.requestSysId}`,
  });

  const approvalStatus = response.result?.approval?.value;
  const changeStartDate = response.result?.start_date?.value;
  const changeEndDate = response.result?.end_date?.value;

  core.info(
    `Change request ${
      inputs.requestSysId
    } has approval status '${approvalStatus}' and a change window between ${
      changeStartDate || "unknown"
    } and ${changeEndDate || "unknown"}`
  );
  if (approvalStatus !== "approved") {
    core.setFailed("Change request has not been approved");
    return;
  }

  if (!(changeStartDate && changeEndDate)) {
    core.setFailed(
      "Change request does not have a change window, cannot proceed"
    );
    return;
  }

  const windowStart = dayjs.utc(changeStartDate);
  const windowEnd = dayjs.utc(changeEndDate);
  const now = dayjs.utc();

  const inWindow =
    now.isSameOrAfter(windowStart) && now.isSameOrBefore(windowEnd);
  if (!inWindow) {
    core.setFailed("The current time is not in the change window");
  }
};
