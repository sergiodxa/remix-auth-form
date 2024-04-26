import { createCookieSessionStorage } from "@remix-run/node";
import { AuthenticateOptions, AuthorizationError } from "remix-auth";
import { FormStrategy, FormStrategyVerifyParams } from "../src";

const BASE_OPTIONS: AuthenticateOptions = {
  name: "form",
  sessionKey: "user",
  sessionErrorKey: "error",
  sessionStrategyKey: "strategy",
};

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

    let request = new Request("http://.../test", { body, method: "POST" });

    let strategy = new FormStrategy(verify);

    await strategy.authenticate(request, sessionStorage, BASE_OPTIONS);

    expect(verify).toBeCalledWith({ form: body, request });
  });

  test("should return what the verify callback returned", async () => {
    verify.mockImplementationOnce(
      async ({ form }: FormStrategyVerifyParams) => {
        return form.get("email");
      },
    );

    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let strategy = new FormStrategy<string>(verify);

    let user = await strategy.authenticate(
      request,
      sessionStorage,
      BASE_OPTIONS,
    );

    expect(user).toBe("test@example.com");
  });

  test("should pass the context to the verify callback", async () => {
    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let context = { test: "it works!" };

    let strategy = new FormStrategy(verify);

    await strategy.authenticate(request, sessionStorage, {
      ...BASE_OPTIONS,
      context,
    });

    expect(verify).toBeCalledWith({ form: body, context, request });
  });

  test("should prefer context.formData over request.formData()", async () => {
    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let context = { formData: body };

    let strategy = new FormStrategy<string>(async ({ form }) => {
      return form.get("email") as string;
    });

    expect(
      strategy.authenticate(request, sessionStorage, {
        ...BASE_OPTIONS,
        context,
      }),
    ).resolves.toBe("test@example.com");
  });

  test("ignore context.formData if it's not an FormData object", async () => {
    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let context = { formData: { email: "fake@example.com" } };

    let strategy = new FormStrategy<string>(async ({ form }) => {
      return form.get("email") as string;
    });

    expect(
      strategy.authenticate(request, sessionStorage, {
        ...BASE_OPTIONS,
        context,
      }),
    ).resolves.toBe("test@example.com");
  });

  test("should pass error as cause on failure", async () => {
    verify.mockImplementationOnce(() => {
      throw new TypeError("Invalid email address");
    });

    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let strategy = new FormStrategy(verify);

    let result = await strategy
      .authenticate(request, sessionStorage, {
        ...BASE_OPTIONS,
        throwOnError: true,
      })
      .catch((error) => error);

    expect(result).toEqual(new AuthorizationError("Invalid email address"));
    expect((result as AuthorizationError).cause).toEqual(
      new TypeError("Invalid email address"),
    );
  });

  test("should pass generate error from string on failure", async () => {
    verify.mockImplementationOnce(() => {
      throw "Invalid email address";
    });

    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let strategy = new FormStrategy(verify);

    let result = await strategy
      .authenticate(request, sessionStorage, {
        ...BASE_OPTIONS,
        throwOnError: true,
      })
      .catch((error) => error);

    expect(result).toEqual(new AuthorizationError("Invalid email address"));
    expect((result as AuthorizationError).cause).toEqual(
      new TypeError("Invalid email address"),
    );
  });

  test("should create Unknown error if thrown value is not Error or string", async () => {
    verify.mockImplementationOnce(() => {
      throw { message: "Invalid email address" };
    });

    let body = new FormData();
    body.set("email", "test@example.com");

    let request = new Request("http://.../test", { body, method: "POST" });

    let strategy = new FormStrategy(verify);

    let result = await strategy
      .authenticate(request, sessionStorage, {
        ...BASE_OPTIONS,
        throwOnError: true,
      })
      .catch((error) => error);

    expect(result).toEqual(new AuthorizationError("Unknown error"));
    expect((result as AuthorizationError).cause).toEqual(
      new Error(JSON.stringify({ message: "Invalid email address" }, null, 2)),
    );
  });
});
