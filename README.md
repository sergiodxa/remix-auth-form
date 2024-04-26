# FormStrategy

A Remix Auth strategy to work with any form.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## How to use

This Strategy gives you back on the verify callback the FormData instance of the request and the context from the action if it was defined.

This let you use any field from that form with the names you want, so you are not limited to only a username+password or email+password, if you need a third field you can use it.

First, install the strategy and Remix Auth.

```bash
$ npm install remix-auth remix-auth-form
```

Then, create an Authenticator instance.

```ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { User, findOrCreateUser } from "~/models/user";

export let authenticator = new Authenticator<User>(sessionStorage);
```

And you can tell the authenticator to use the FormStrategy.

```ts
import { FormStrategy } from "remix-auth-form";

// The rest of the code above here...

authenticator.use(
	new FormStrategy(async ({ form, context }) => {
		// Here you can use `form` to access and input values from the form.
		// and also use `context` to access more things from the server
		let username = form.get("username"); // or email... etc
		let password = form.get("password");

		// You can validate the inputs however you want
		invariant(typeof username === "string", "username must be a string");
		invariant(username.length > 0, "username must not be empty");

		invariant(typeof password === "string", "password must be a string");
		invariant(password.length > 0, "password must not be empty");

		// And if you have a password you should hash it
		let hashedPassword = await hash(password);

		// And finally, you can find, or create, the user
		let user = await findOrCreateUser(username, hashedPassword);

		// And return the user as the Authenticator expects it
		return user;
	}),
);
```

In order to authenticate a user, you can use the following inside of an `action` function:

```ts
export async function action({ context, request }: ActionArgs) {
	return await authenticator.authenticate("form", request, {
		successRedirect: "/",
		failureRedirect: "/login",
		context, // optional
	});
}
```

## Passing a pre-read FormData object

Because you may want to do validations or read values from the FormData before calling `authenticate`, the FormStrategy allows you to pass a FormData object as part of the optional context.

```ts
export async function action({ context, request }: ActionArgs) {
	let formData = await request.formData();
	return await authenticator.authenticate("form", request, {
		// use formData here
		successRedirect: formData.get("redirectTo"),
		failureRedirect: "/login",
		context: { formData }, // pass pre-read formData here
	});
}
```

This way, you don't need to clone the request yourself.
