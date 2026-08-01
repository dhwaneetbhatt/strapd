export type PipeRepositoryErrorCode =
  | "read-failed"
  | "write-failed"
  | "corrupt-storage"
  | "not-found"
  | "invalid-pipe"
  | "invalid-import"
  | "unsupported-version"
  | "import-too-large"
  | "import-conflict";

export class PipeRepositoryError extends Error {
  readonly code: PipeRepositoryErrorCode;
  readonly cause?: unknown;

  constructor(
    code: PipeRepositoryErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message);
    this.name = "PipeRepositoryError";
    this.code = code;
    this.cause = options.cause;
  }
}

export const isPipeRepositoryError = (
  error: unknown,
): error is PipeRepositoryError => error instanceof PipeRepositoryError;
