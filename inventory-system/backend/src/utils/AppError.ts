// Erro previsto/tratado da aplicacao (regra de negocio, validacao, permissao).
// Erros que NAO forem AppError sao tratados como falha inesperada e nunca
// tem seu detalhe interno exposto ao cliente (ver middleware/errorHandler.ts).
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static notFound(message = "Recurso nao encontrado") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static unauthorized(message = "Nao autenticado") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Voce nao tem permissao para realizar esta acao") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(message: string, details?: unknown) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }
}
