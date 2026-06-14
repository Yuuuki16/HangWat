export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly responseBody?: unknown;

  constructor(input: {
    message: string;
    status: number;
    code?: string;
    responseBody?: unknown;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.responseBody = input.responseBody;
  }
}

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
  code?: string;
  message?: string;
};

type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown>;
};

const buildApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
};

const readJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as unknown;
};

const getErrorMessage = (body: unknown, fallback: string) => {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const errorBody = body as ApiErrorBody;

  return errorBody.error?.message ?? errorBody.message ?? fallback;
};

const getErrorCode = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const errorBody = body as ApiErrorBody;

  return errorBody.error?.code ?? errorBody.code;
};

const isJsonBody = (body: unknown): body is Record<string, unknown> =>
  Object.prototype.toString.call(body) === "[object Object]";

export async function apiClient<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (isJsonBody(options.body)) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    body = JSON.stringify(options.body);
  } else {
    body = options.body;
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    body,
    credentials: "include",
  });
  const responseBody = await readJsonResponse(response);

  if (!response.ok) {
    throw new ApiError({
      message: getErrorMessage(responseBody, "API request failed"),
      status: response.status,
      code: getErrorCode(responseBody),
      responseBody,
    });
  }

  return responseBody as TResponse;
}
