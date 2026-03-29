import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { appConfig } from "./config/app.config";
import { validateEnv } from "./config/env.validation";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env", ".env.local", "../.env", "../.env.local"],
      load: [appConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
