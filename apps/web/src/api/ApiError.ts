// every failure from the api arrives in this envelope, so one class covers all of
// them and a component can branch on `code` instead of matching message text
interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

// status 0 means the request never got an answer: offline, dns, cors.
export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;

  const { error } = value as { error: unknown };
  return typeof error === 'object' && error !== null && 'message' in error;
}

export async function errorFromResponse(response: Response): Promise<ApiError> {
  // a 502 from a proxy, or a crash before the error handler, answers in html. the
  // parse has to be allowed to fail or the real status gets lost behind a SyntaxError.
  const body: unknown = await response.json().catch(() => null);

  if (!isEnvelope(body)) {
    return new ApiError(
      response.status,
      'UNEXPECTED_RESPONSE',
      response.statusText || 'Request failed',
    );
  }

  const { code, message, details, requestId } = body.error;
  return new ApiError(response.status, code, message, details, requestId);
}
