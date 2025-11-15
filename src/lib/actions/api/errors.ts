export class ServiceError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    code: string,
    message: string,
    status: number = 400,
    details?: unknown
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function assert(
  condition: any,
  code: string,
  message: string,
  status = 400
) {
  if (!condition) {
    throw new ServiceError(code, message, status);
  }
}
