import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { validationExceptionFactory } from "./common/validation/validation-exception.factory";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = new Logger("Bootstrap");
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3333);
  await app.listen(port);

  logger.log(`Backend listening on http://localhost:${port}/api/health`);
}

bootstrap().catch((error: unknown) => {
  // Keep a direct console output so startup failures are visible in all terminal integrations.
  // eslint-disable-next-line no-console
  console.error("Bootstrap failure:", error);
  const logger = new Logger("Bootstrap");
  logger.error("Failed to start backend", error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
