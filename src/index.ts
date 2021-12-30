import { AppLoadContext, SessionStorage } from "@remix-run/server-runtime";
import { CookieSerializeOptions } from 'remix";
import { AuthenticateOptions, Strategy } from "remix-auth";

export interface FormAuthenticateOptions extends AuthenticateOptions {
  /**
   * The "Remember me" checkbox field name
   *
   * If set and the field is unchecked, the user session
   * will not persist
   */
  rememberField?: string 
}

export interface FormStrategyVerifyParams {
  /**
   * A FormData object with the content of the form used to trigger the
   * authentication.
   *
   * Here you can read any input value using the FormData API.
   */
  form: FormData;
  /**
   * An object of arbitrary for route loaders and actions provided by the
   * server's `getLoadContext()` function.
   */
  context?: AppLoadContext;
}

export class FormStrategy<User> extends Strategy<
  User,
  FormStrategyVerifyParams
> {
  name = "form";

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: FormAuthenticateOptions
  ): Promise<User> {
    let form = await request.formData();

    let user: User;
    try {
      user = await this.verify({ form, context: options.context });
    } catch (error) {
      let message = (error as Error).message;
      return await this.failure(message, request, sessionStorage, options);
    }

    return this.success(user, request, sessionStorage, options);
  }
  
  /**
   * Returns the user data or throw a redirect to the successRedirect.
   * @param user The user data to set in the session.
   * @param session The session object to set the user in.
   * @param options The form strategy options.
   * @returns {Promise<User>} The user data.
   * @throws {Response} If the successRedirect is set, it will redirect to it.
   */
  protected async success(
    user: User,
    request: Request,
    sessionStorage: SessionStorage,
    options: FormAuthenticateOptions
  ): Promise<User> {
    // if a successRedirect is not set, we return the user
    if (!options.successRedirect) return user;

    let session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
      
    let cookieOptions: CookieSerializeOptions = {}
      
    if(!!options.rememberField && !(await request.formData()).get(options.rememberField)) {
      cookieOptions.expiry = new Date(Date.now());
      cookieOptions.maxAge = 0;
    }

    // if we do have a successRedirect, we redirect to it and set the user
    // in the session sessionKey
    session.set(options.sessionKey, user);
    throw redirect(options.successRedirect, {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session, cookieOptions) },
    });
  }
}
