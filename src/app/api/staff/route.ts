import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('=== FETCHING STAFF MEMBERS ===');
    
    // Get the user's location from the session
    const sessionCookie = request.cookies.get('auth0_session');
    let userLocationId: string | null = null;
    
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.user?.locationId) {
          userLocationId = session.user.locationId;
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    
    // Build the where clause based on user role and location
    const whereClause: any = {
      role: 'CARE_WORKER' // Only show care workers, not managers
    };
    
    // If user has a location assigned, filter by that location
    if (userLocationId) {
      whereClause.locationId = userLocationId;
    }
    
    // Get all users with their location info and detailed time entries
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        location: true,
        shifts: {
          where: {
            endTime: null // Only active shifts
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 1,
          include: {
            timeEntries: {
              orderBy: {
                clockInTime: 'desc'
              },
              take: 10 // Get last 10 time entries for detailed view
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform users to staff members with detailed clock status and time entries
    const staffMembers = users.map(user => {
      const activeShift = user.shifts[0];
      const isClockedIn = activeShift && activeShift.timeEntries.length > 0 && 
                         !activeShift.timeEntries[0].clockOutTime;
      const currentTimeEntry = isClockedIn ? activeShift.timeEntries[0] : null;
      
      // Get detailed time entries for the last 7 days
      const recentTimeEntries = activeShift?.timeEntries.slice(0, 10) || [];
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        isClockedIn,
        lastClockIn: currentTimeEntry?.clockInTime || null,
        currentShiftId: activeShift?.id || null,
        recentTimeEntries: recentTimeEntries.map(entry => ({
          id: entry.id,
          clockInTime: entry.clockInTime,
          clockOutTime: entry.clockOutTime,
          clockInLatitude: entry.clockInLatitude,
          clockInLongitude: entry.clockInLongitude,
          clockOutLatitude: entry.clockOutLatitude,
          clockOutLongitude: entry.clockOutLongitude,
          note: entry.note,
          duration: entry.clockOutTime ? 
            (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60) : null
        }))
      };
    });

    console.log('Found staff members:', staffMembers.length);

    return NextResponse.json({
      staffMembers: staffMembers
    });

  } catch (error) {
    console.error('Failed to fetch staff members:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch staff members',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
