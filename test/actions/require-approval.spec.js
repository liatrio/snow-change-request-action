import Chance from "chance";
import * as core from "@actions/core";
import dayjs from "../../dayjs";
import { requireChangeRequestApproval } from "../../actions/require-approval.js";
import { createInputs, mockServiceNowClient } from "./util.js";

jest.mock("@actions/core");

describe("require-approval", () => {
  const chance = new Chance();

  let expectedInputs, snowClient, changeRequest, currentTime;

  beforeEach(() => {
    expectedInputs = createInputs("require-approval");
    snowClient = mockServiceNowClient();

    currentTime = chance.date();
    changeRequest = {
      result: {
        approval: {
          value: "approved",
        },
        start_date: {
          value: currentTime,
        },
        end_date: {
          value: dayjs.utc(currentTime).add(1, "hour"),
        },
      },
    };
    snowClient.get.mockResolvedValue(changeRequest);

    jest.useFakeTimers();
    jest.setSystemTime(currentTime);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should fetch the change request", async () => {
    await requireChangeRequestApproval({
      snow: snowClient,
      inputs: expectedInputs,
    });

    expect(snowClient.get).toHaveBeenCalledTimes(1);
    expect(snowClient.get).toHaveBeenCalledWith({
      path: `/api/sn_chg_rest/change/${expectedInputs.requestSysId}`,
    });
  });

  it("should allow the request", async () => {
    await requireChangeRequestApproval({
      snow: snowClient,
      inputs: expectedInputs,
    });

    expect(core.setFailed).not.toHaveBeenCalledTimes(1);
  });

  describe("the change request is not approved", () => {
    it("should fail the action", async () => {
      changeRequest.result.approval = "requested";

      await requireChangeRequestApproval({
        snow: snowClient,
        inputs: expectedInputs,
      });

      expect(core.setFailed).toHaveBeenCalledTimes(1);
      expect(core.setFailed).toHaveBeenCalledWith(
        "Change request has not been approved"
      );
    });
  });

  describe("the current time is before the window", () => {
    it("should fail the action", async () => {
      jest.setSystemTime(dayjs.utc(currentTime).subtract(1, "hour").toDate());

      await requireChangeRequestApproval({
        snow: snowClient,
        inputs: expectedInputs,
      });

      expect(core.setFailed).toHaveBeenCalledTimes(1);
      expect(core.setFailed).toHaveBeenCalledWith(
        "The current time is not in the change window"
      );
    });
  });

  describe("the current time is after the window", () => {
    it("should fail the action", async () => {
      jest.setSystemTime(dayjs.utc(currentTime).add(2, "hour").toDate());

      await requireChangeRequestApproval({
        snow: snowClient,
        inputs: expectedInputs,
      });

      expect(core.setFailed).toHaveBeenCalledTimes(1);
      expect(core.setFailed).toHaveBeenCalledWith(
        "The current time is not in the change window"
      );
    });
  });

  describe("the change request does not specify a window", () => {
    it("should fail the change request", async () => {
      delete changeRequest.result.start_date;
      delete changeRequest.result.end_date;

      await requireChangeRequestApproval({
        snow: snowClient,
        inputs: expectedInputs,
      });

      expect(core.setFailed).toHaveBeenCalledTimes(1);
      expect(core.setFailed).toHaveBeenCalledWith(
        "Change request does not have a change window, cannot proceed"
      );
    });
  });
});
