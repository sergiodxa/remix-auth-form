import { beforeEach, expect, mock, test } from "bun:test";
import { FormStrategy } from ".";

let verify = mock();

beforeEach(() => {
	verify.mockReset();
});

test("has the name of the strategy", () => {
	let strategy = new FormStrategy(verify);
	expect(strategy.name).toBe("form");
});

test("pass to the verify function a FormData object", async () => {
	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy(verify);

	await strategy.authenticate(request);

	expect(verify).toBeCalledWith({ form: body, request });
});

test("returns what the verify function returned", async () => {
	verify.mockImplementationOnce(
		async ({ form }: FormStrategy.VerifyOptions) => {
			return form.get("email");
		},
	);

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy<string>(verify);

	let user = await strategy.authenticate(request);

	expect(user).toBe("test@example.com");
});

test("thrown error passthrough the strategy", async () => {
	verify.mockImplementationOnce(() => {
		throw new TypeError("Invalid email address");
	});

	let body = new FormData();
	body.set("email", "test@example.com");

	let request = new Request("http://.../test", { body, method: "POST" });

	let strategy = new FormStrategy(verify);

	expect(strategy.authenticate(request)).rejects.toThrow(
		new TypeError("Invalid email address"),
	);
});
