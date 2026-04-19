export class AppError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const httpError = (status: number, message: string, details?: unknown) =>
  new AppError(status, message, details);









