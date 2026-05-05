const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  410: 'Gone',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
}

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
    this.name = STATUS_NAMES[statusCode] ?? 'Error'
  }
}
