import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserRole } from "../../../../src/generated/prisma/client";

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateUser(auth0User: Record<string, unknown>) {
    const auth0Id = String(auth0User.sub ?? "");
    const email = String(auth0User.email ?? "");
    const name = String(auth0User.name ?? auth0User.email ?? "");

    let dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ auth0Id }, { email }],
      },
      include: {
        careWorker: true,
        manager: true,
      },
    });

    let isNewUser = false;

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          auth0Id,
          email,
          name,
        },
        include: {
          careWorker: true,
          manager: true,
        },
      });
      isNewUser = true;
    } else if (!dbUser.auth0Id) {
      dbUser = await this.prisma.user.update({
        where: { id: dbUser.id },
        data: { auth0Id },
        include: {
          careWorker: true,
          manager: true,
        },
      });
    }

    const enhancedUser = {
      ...auth0User,
      id: dbUser.id,
      role: dbUser.role,
      locationId: null,
      location: null,
      auth0Id: dbUser.auth0Id,
    };

    return {
      dbUser,
      enhancedUser,
      isNewUser,
    };
  }

  getRedirectUrl(baseUrl: string, isNewUser: boolean, role: UserRole): string {
    if (isNewUser || !role) {
      return `${baseUrl}/onboarding`;
    }

    if (role === "CARE_WORKER") {
      return `${baseUrl}/worker`;
    }

    if (role === "MANAGER" || role === "ADMIN") {
      return `${baseUrl}/manager`;
    }

    return `${baseUrl}/onboarding`;
  }
}
