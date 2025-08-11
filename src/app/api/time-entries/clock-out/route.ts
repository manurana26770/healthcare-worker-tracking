import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as any;
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// POST clock out
export const POST = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only care workers can clock out
    if (user.role !== 'CARE_WORKER') {
      return NextResponse.json(
        { message: 'Only care workers can clock out' },
        { status: 403 }
      );
    }

    const { note } = await request.json();

    // Find the active time entry for the user
    const activeTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        shift: {
          userId: user.id
        },
        clockOutTime: null
      },
      include: {
        shift: true
      }
    });

    if (!activeTimeEntry) {
      return NextResponse.json(
        { message: 'You are not currently clocked in' },
        { status: 400 }
      );
    }

    // Update the time entry with clock out time and note
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: {
        id: activeTimeEntry.id
      },
      data: {
        clockOutTime: new Date(),
        note: note || activeTimeEntry.note // Keep existing note if no new note provided
      }
    });

    // Check if this was the last time entry for the shift
    const remainingActiveEntries = await prisma.timeEntry.count({
      where: {
        shiftId: activeTimeEntry.shiftId,
        clockOutTime: null
      }
    });

    // If no more active entries, end the shift
    if (remainingActiveEntries === 0) {
      await prisma.shift.update({
        where: {
          id: activeTimeEntry.shiftId
        },
        data: {
          endTime: new Date()
        }
      });
    }

    return NextResponse.json({
      timeEntry: updatedTimeEntry,
      message: 'Successfully clocked out'
    });

  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};
