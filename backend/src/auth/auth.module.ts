import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./controllers/auth.controller";
import { LogoutController } from "./controllers/logout.controller";
import { Auth0Service } from "./services/auth0.service";
import { AuthUserService } from "./services/auth-user.service";
import { SessionService } from "./services/session.service";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, LogoutController],
  providers: [Auth0Service, AuthUserService, SessionService, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, SessionService],
})
export class AuthModule {}
