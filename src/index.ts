import { Strategy } from "remix-auth/strategy";

export interface FormStrategyVerifyParams {
	/**
	 * A FormData object with the content of the form used to trigger the
	 * authentication.
	 *
	 * Here you can read any input value using the FormData API.
	 */
	form: FormData;
	/**
	 * The request that triggered the authentication.
	 */
	request: Request;
}

export class FormStrategy<User> extends Strategy<
	User,
	FormStrategyVerifyParams
> {
	name = "form";

	async authenticate(request: Request): Promise<User> {
		try {
			if (request.bodyUsed) throw new BodyUsedError();
			let form = await request.clone().formData();
			return this.verify({ form, request });
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(error.message, {
					cause: error,
				});
			}

			if (typeof error === "string") {
				throw new Error(error, { cause: new Error(error) });
			}

			throw new Error("Unknown error", {
				cause: new Error(JSON.stringify(error, null, 2)),
			});
		}
	}
}

/**
 * Whenever you try to call `authenticator.authenticate("form", request)` and
 * the request's body was already read before, the FormStrategy will throw this
 * error.
 *
 * To fix it, ensure that you either move the logic that depends on the body to
 * inside the strategy's `verify` callback, or clone the request before reading.
 *
 * @example
 * let formData = await request.clone().formData()
 * // do something with formData
 * let user = await authenticator.authenticate("form", request);
 *
 * @example
 * authenticator.use(
 *   new FormStrategy(async ({ form }) => {
 *     // do something with form here
 *   }),
 *   "login",
 * );
 */
export class BodyUsedError extends Error {
	name = "BodyUsedError";

	constructor() {
		super(
			"Your request.body was already used. This means you called `request.formData()` or another way to read the body before using the Remix Auth's FormStrategy. Because FormStrategy needs to read the body, ensure that you either don't read it yourself by moving your logic to the strategy callback or clone the request before reading the body with `request.clone().formData()`.",
		);
	}
}
