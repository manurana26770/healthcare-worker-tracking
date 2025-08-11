import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(authToken, secret);
    
    const userId = payload.userId as string;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
