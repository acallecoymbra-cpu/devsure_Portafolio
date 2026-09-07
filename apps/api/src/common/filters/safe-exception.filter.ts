import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
}

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = request.header('x-request-id') || randomUUID();
    const statusCode = this.getStatusCode(exception);

    response.header('x-request-id', requestId);
    const body = this.buildError(statusCode, requestId, request);
    const detail = exception instanceof HttpException ? exception.getResponse() : undefined;
    if (statusCode === 403 && typeof detail === 'object' && detail !== null && 'code' in detail && detail.code === 'PASSWORD_CHANGE_REQUIRED') {
      body.code = 'PASSWORD_CHANGE_REQUIRED';
    }
    response.status(statusCode).json(body);
  }

  private buildError(statusCode: number, requestId: string, request: Request): ErrorResponse {
    const message =
      statusCode >= 500 ? 'Internal server error' : this.httpStatusMessage(statusCode);

    return {
      statusCode,
      code: `HTTP_${statusCode}`,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof exception.status === 'number' &&
      exception.status >= 400 &&
      exception.status < 600
    ) {
      return exception.status;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private httpStatusMessage(statusCode: number): string {
    const statusName = HttpStatus[statusCode];
    if (!statusName) {
      return 'Request failed';
    }

    return statusName
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
