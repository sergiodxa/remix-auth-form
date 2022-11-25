import { AppLoadContext, SessionStorage } from "@remix-run/server-runtime";
import { AuthenticateOptions, Strategy } from "remix-auth";

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
    options: AuthenticateOptions
  ): Promise<User> {
    let form = await this.readFormData(request, options);

    try {
      let user = await this.verify({ form, context: options.context });
      return this.success(user, request, sessionStorage, options);
    } catch (error) {
      if (error instanceof Error) {
        return await this.failure(
          error.message,
          request,
          sessionStorage,
          options,
          error
        );
      }

      if (typeof error === "string") {
        return await this.failure(
          error,
          request,
          sessionStorage,
          options,
          new Error(error)
        );
      }

      return await this.failure(
        "Unknown error",
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error, null, 2))
      );
    }
  }

  private async readFormData(request: Request, options: AuthenticateOptions) {
    if (options.context?.formData instanceof FormData) {
      return options.context.formData;
    }

    return await request.formData();
  }
}
