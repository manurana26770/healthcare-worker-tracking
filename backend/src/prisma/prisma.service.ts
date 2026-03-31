import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../../../src/generated/prisma/client";

const PRISMA_CONNECT_TIMEOUT_MS = 2000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      this.logger.debug("Skipping Prisma connection in test mode");
      return;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Prisma connect timeout after ${PRISMA_CONNECT_TIMEOUT_MS}ms`));
      }, PRISMA_CONNECT_TIMEOUT_MS);
    });

    const connectPromise = this.$connect();

    try {
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log("Prisma connection established");
    } catch (error) {
      this.logger.warn(
        `Prisma connection unavailable during startup: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Prevent unhandled promise rejections if the delayed connect promise fails later.
      connectPromise.catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    (this as unknown as { $on: (event: string, callback: () => Promise<void>) => void }).$on(
      "beforeExit",
      async () => {
      await app.close();
      },
    );
  }
}
