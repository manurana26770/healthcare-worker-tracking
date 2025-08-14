import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('=== FETCHING STAFF TIME ENTRIES ===');
    
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
    
    // Build location filter
    const locationFilter = userLocationId ? { locationId: userLocationId } : {};
    
    // Get time entries for the last 7 days with detailed information
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        clockInTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        shift: {
          ...locationFilter,
          user: {
            role: 'CARE_WORKER' // Only show care workers
          }
        }
      },
      include: {
        shift: {
          include: {
            user: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: {
        clockInTime: 'desc'
      }
    });
    
    // Group time entries by staff member
    const staffTimeEntries = new Map<string, {
      id: string;
      name: string;
      email: string;
      role: string;
      location: any;
      timeEntries: any[];
      totalHours: number;
      isCurrentlyClockedIn: boolean;
    }>();
    
    timeEntries.forEach(entry => {
      const staffId = entry.shift.userId;
      const staffName = entry.shift.user.name;
      const staffEmail = entry.shift.user.email;
      const staffRole = entry.shift.user.role;
      const staffLocation = entry.shift.user.location;
      
      if (!staffTimeEntries.has(staffId)) {
        staffTimeEntries.set(staffId, {
          id: staffId,
          name: staffName,
          email: staffEmail,
          role: staffRole,
          location: staffLocation,
          timeEntries: [],
          totalHours: 0,
          isCurrentlyClockedIn: false
        });
      }
      
      const staff = staffTimeEntries.get(staffId)!;
      staff.timeEntries.push({
        id: entry.id,
        clockInTime: entry.clockInTime,
        clockOutTime: entry.clockOutTime,
        clockInLatitude: entry.clockInLatitude,
        clockInLongitude: entry.clockInLongitude,
        clockOutLatitude: entry.clockOutLatitude,
        clockOutLongitude: entry.clockOutLongitude,
        note: entry.note,
        duration: entry.clockOutTime ? 
          (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60) : null,
        isActive: !entry.clockOutTime
      });
      
      // Calculate total hours
      if (entry.clockOutTime) {
        const hours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
        staff.totalHours += hours;
      }
      
      // Check if currently clocked in
      if (!entry.clockOutTime) {
        staff.isCurrentlyClockedIn = true;
      }
    });
    
    // Convert to array and sort by name
    const staffList = Array.from(staffTimeEntries.values())
      .map(staff => ({
        ...staff,
        totalHours: Math.round(staff.totalHours * 100) / 100,
        timeEntries: staff.timeEntries.sort((a, b) => 
          new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()
        )
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('Found staff time entries:', staffList.length);

    return NextResponse.json({
      staffTimeEntries: staffList
    });

  } catch (error) {
    console.error('Failed to fetch staff time entries:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch staff time entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
