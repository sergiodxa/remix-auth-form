import { beforeEach, expect, mock, test } from "bun:test";
import { FormStrategy, FormStrategyVerifyParams } from ".";

let verify = mock();

beforeEach(() => {
	verify.mockReset();
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

	await strategy.authenticate(request);

	expect(verify).toBeCalledWith({ form: body, request });
});

test("should return what the verify callback returned", async () => {
	verify.mockImplementationOnce(async ({ form }: FormStrategyVerifyParams) => {
		return form.get("email");
	});

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy<string>(verify);

	let user = await strategy.authenticate(request);

	expect(user).toBe("test@example.com");
});

test("should pass error as cause on failure", async () => {
	verify.mockImplementationOnce(() => {
		throw new TypeError("Invalid email address");
	});

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy(verify);

	let result = await strategy.authenticate(request).catch((error) => error);

	expect(result).toEqual(new Error("Invalid email address"));
	expect((result as Error).cause).toEqual(
		new TypeError("Invalid email address"),
	);
});

test("should pass generate error from string on failure", async () => {
	verify.mockImplementationOnce(() => {
		throw "Invalid email address";
	});

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://example.com/test", {
		body,
		method: "POST",
	});

	let strategy = new FormStrategy(verify);

	let result = await strategy.authenticate(request).catch((error) => error);

	expect(result).toEqual(new Error("Invalid email address"));
	expect((result as Error).cause).toEqual(new Error("Invalid email address"));
});

test("should create Unknown error if thrown value is not Error or string", async () => {
	verify.mockImplementationOnce(() => {
		throw { message: "Invalid email address" };
	});

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy(verify);

	let result = await strategy.authenticate(request).catch((error) => error);

	expect(result).toEqual(new Error("Unknown error"));
	expect((result as Error).cause).toEqual(
		new Error(JSON.stringify({ message: "Invalid email address" }, null, 2)),
	);
});
