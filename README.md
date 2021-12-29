# FormStrategy

A Remix Auth strategy to work with any form.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## How to use

This Strategy gives you back on the verify callback the FormData instance of the request. This let you use any field from that form with the names you want, so you are not limited to only a username+password or email+password, if you need a third field you can use it.

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
  new FormStrategy(async ({ form }) => {
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
  })
);
```

In order to authenticate a user, you can use the following inside of an ActionFunction:

```ts
export const action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate("form", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
```