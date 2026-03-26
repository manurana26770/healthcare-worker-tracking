import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  details?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.buildPayload(exception, status, request.url);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${payload.error}`);
    }

    response.status(status).json(payload);
  }

  private buildPayload(exception: unknown, statusCode: number, path: string): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        return {
          statusCode,
          error: exceptionResponse,
          timestamp: new Date().toISOString(),
          path,
        };
      }

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const message = this.extractMessage(responseObj.message);

        return {
          statusCode,
          error: this.extractMessage(responseObj.error) ?? message ?? exception.name,
          details: message,
          timestamp: new Date().toISOString(),
          path,
        };
      }
    }

    if (exception instanceof Error) {
      return {
        statusCode,
        error: "Internal server error",
        details: exception.message,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      statusCode,
      error: "Internal server error",
      details: "Unexpected error",
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private extractMessage(value: unknown): string | undefined {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return value.map((entry) => String(entry)).join(", ");
    }

    return undefined;
  }
}
