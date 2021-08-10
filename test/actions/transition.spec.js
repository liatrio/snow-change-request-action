import Chance from "chance";
import { transitionState } from "../../actions/transition.js";

import { createInputs, mockServiceNowClient } from "./util.js";

jest.mock("@actions/core");

describe("transition", () => {
  const chance = new Chance();

  let expectedInputs, serviceNowClient;

  beforeEach(() => {
    expectedInputs = createInputs("transition");
    expectedInputs.transition = chance.word();
    serviceNowClient = mockServiceNowClient();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should update the change request's state", async () => {
    await transitionState({ snow: serviceNowClient, inputs: expectedInputs });

    expect(serviceNowClient.patch).toHaveBeenCalledTimes(1);
    expect(serviceNowClient.patch).toHaveBeenCalledWith({
      path: `/api/sn_chg_rest/change/${expectedInputs.requestSysId}`,
      body: {
        state: expectedInputs.transition,
      },
    });
  });

  describe("the transitions state is closed", () => {
    it("should add the close code and notes to the update", async () => {
      expectedInputs.transition = "closed";

      await transitionState({ snow: serviceNowClient, inputs: expectedInputs });

      expect(serviceNowClient.patch).toHaveBeenCalledWith({
        path: `/api/sn_chg_rest/change/${expectedInputs.requestSysId}`,
        body: {
          state: expectedInputs.transition,
          close_code: "successful",
          close_notes: "Automatically closed by snow-change-request action",
        },
      });
    });
  });

  describe("there are multiple states", () => {
    it("should move between them", async () => {
      const states = chance.n(chance.word, chance.d4() + 1);
      expectedInputs.transition = states.join("|");

      await transitionState({ snow: serviceNowClient, inputs: expectedInputs });

      expect(serviceNowClient.patch).toHaveBeenCalledTimes(states.length);
      states.forEach((state) => {
        expect(serviceNowClient.patch).toHaveBeenCalledWith({
          path: `/api/sn_chg_rest/change/${expectedInputs.requestSysId}`,
          body: {
            state: state,
          },
        });
      });
    });
  });
});
