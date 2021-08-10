import dayjs from "../dayjs";

describe("dayjs", () => {
  it("should register the utc plugin", () => {
    expect(dayjs.utc).toBeDefined();
  });

  it("should register the comparision plugins", () => {
    const instance = dayjs.utc();

    expect(instance.isSameOrBefore).toBeDefined();
    expect(instance.isSameOrAfter).toBeDefined();
  });
});
