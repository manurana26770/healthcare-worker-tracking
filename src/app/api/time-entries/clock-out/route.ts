import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, note } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Find active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: userId,
        endTime: null
      }
    });
    
    if (!activeShift) {
      return NextResponse.json({ error: 'No active shift found' }, { status: 400 });
    }
    
    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        shiftId: activeShift.id,
        clockOutTime: null
      }
    });
    
    if (!activeEntry) {
      return NextResponse.json({ error: 'No active time entry found' }, { status: 400 });
    }
    
    // Update time entry with clock out
    const updatedEntry = await prisma.timeEntry.update({
      where: {
        id: activeEntry.id
      },
      data: {
        clockOutTime: new Date(),
        note: note || null
      }
    });
    
    // End the shift
    await prisma.shift.update({
      where: {
        id: activeShift.id
      },
      data: {
        endTime: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry
    });
    
  } catch (error) {
    console.error('Clock out failed:', error);
    return NextResponse.json({ 
      error: 'Clock out failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
