import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { FormStrategy, FormStrategyVerifyParams } from "../src";

describe(FormStrategy, () => {
  let verify = jest.fn();
  // You will probably need a sessionStorage to test the strategy.
  let sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should have the name of the strategy", () => {
    let strategy = new FormStrategy(verify);
    expect(strategy.name).toBe("form");
  });

  test("should pass to the verify callback a FormData object", async () => {
    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("", { body, method: "POST" });

    let strategy = new FormStrategy(verify);

    await strategy.authenticate(request, sessionStorage, {
      sessionKey: "user",
    });

    expect(verify).toBeCalledWith({ form: body });
  });

  test("should return what the verify callback returned", async () => {
    verify.mockImplementationOnce(
      async ({ form }: FormStrategyVerifyParams) => {
        return form.get("email");
      }
    );

    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("", { body, method: "POST" });

    let strategy = new FormStrategy<string>(verify);

    let user = await strategy.authenticate(request, sessionStorage, {
      sessionKey: "user",
    });

    expect(user).toBe("test@example.com");
  });

  test("should pass the context to the verify callback", async () => {
    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("", { body, method: "POST" });

    let context = { test: "it works!" };

    let strategy = new FormStrategy(verify);

    await strategy.authenticate(request, sessionStorage, {
      sessionKey: "user",
      context,
    });

    expect(verify).toBeCalledWith({ form: body, context });
  });
});
