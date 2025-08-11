/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { userId?: string };
    console.log('Session API - Token verified, userId:', decoded?.userId);
    
    if (!decoded || !decoded.userId) {
      console.log('Session API - Invalid token payload');
      return NextResponse.json({ user: null });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        }
      }
    });

    if (!user) {
      console.log("user not found");
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ user });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}; 