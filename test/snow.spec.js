import Chance from "chance";
import * as core from "@actions/core";
import fetch from "node-fetch";
import { newClient } from "../snow";

jest.mock("@actions/core");
jest.mock("node-fetch");

describe("snow", () => {
  const chance = new Chance();

  let client,
    basicAuth,
    response,
    responsePayload,
    path,
    expectedUrl,
    serviceNowUsername,
    serviceNowPassword,
    serviceNowUrl;

  beforeEach(() => {
    serviceNowUsername = chance.word();
    serviceNowPassword = chance.word();
    serviceNowUrl = chance.url();
    basicAuth = Buffer.from(
      `${serviceNowUsername}:${serviceNowPassword}`
    ).toString("base64");

    path = `/${chance.word()}`;
    expectedUrl = `${serviceNowUrl}${path}`;

    client = newClient({
      serviceNowUsername,
      serviceNowPassword,
      serviceNowUrl,
    });
    responsePayload = {
      [chance.word()]: chance.word(),
    };
    response = {
      ok: true,
      text: jest.fn(),
      json: jest.fn().mockResolvedValue(responsePayload),
    };
    fetch.mockResolvedValue(response);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("newClient", () => {
    it("should mask the password", () => {
      expect(core.setSecret).toHaveBeenCalledWith(serviceNowPassword);
    });

    it("should mask the basic authentication value", () => {
      expect(core.setSecret).toHaveBeenCalledWith(basicAuth);
    });
  });

  describe("get", () => {
    it("should make a GET request to the ServiceNow url", async () => {
      const actualResponse = await client.get({ path });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expectedUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        method: "GET",
      });
      expect(actualResponse).toEqual(responsePayload);
    });

    describe("query parameters", () => {
      it("should pass any params", async () => {
        const paramName = chance.word();
        const paramValue = [chance.word(), chance.word()];
        const expectedUrlWithParams = `${expectedUrl}?${paramName}=${paramValue.join(
          "+"
        )}`;

        await client.get({
          path,
          params: {
            [paramName]: paramValue.join(" "),
          },
        });

        expect(fetch).toHaveBeenCalledWith(
          expectedUrlWithParams,
          expect.any(Object)
        );
      });
    });

    describe("response is not ok", () => {
      beforeEach(() => {
        response.ok = false;
      });

      it("should throw an error", async () => {
        await expect(client.get({ path })).rejects.toThrow(
          "Non-2xx response code from ServiceNow"
        );
      });
    });
  });

  describe("patch", () => {
    it("should make a PATCH request to ServiceNow", async () => {
      const body = {
        [chance.word()]: chance.word(),
      };
      const actualResponse = await client.patch({ body, path });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expectedUrl, {
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      expect(actualResponse).toEqual(responsePayload);
    });
  });

  describe("post", () => {
    it("should make a POST request to ServiceNow", async () => {
      const body = {
        [chance.word()]: chance.word(),
      };
      const actualResponse = await client.post({ body, path });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expectedUrl, {
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      expect(actualResponse).toEqual(responsePayload);
    });

    describe("body is not an object", () => {
      it("should not serialize the body", async () => {
        const body = chance.word();
        const headers = {
          "Content-Type": "application/text",
        };

        await client.post({ body, headers, path });

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expectedUrl, {
          body,
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/text",
          },
          method: "POST",
        });
      });
    });
  });
});
