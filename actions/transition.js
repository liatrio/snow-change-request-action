import * as core from "@actions/core";

export const transitionState = async ({ snow, inputs }) => {
  const states = inputs.transition.split("|");

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    core.info(`Transitioning to state '${state}'`);

    const updates = {
      state,
    };

    if (state === "closed") {
      updates.close_code = "successful";
      updates.close_notes =
        "Automatically closed by snow-change-request action";
    }

    await snow.patch({
      path: `/api/sn_chg_rest/change/${inputs.requestSysId}`,
      body: updates,
    });
  }
};
