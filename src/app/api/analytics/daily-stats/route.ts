import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('=== FETCHING ANALYTICS DATA ===');
    
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
    
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Build location filter
    const locationFilter = userLocationId ? { locationId: userLocationId } : {};
    
    // Get time entries for the last 7 days
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        clockInTime: {
          gte: startOfWeek,
          lt: endOfWeek
        },
        shift: {
          ...locationFilter,
          user: {
            role: 'CARE_WORKER' // Only include care workers in analytics
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
    
    // Group entries by date
    const entriesByDate = new Map<string, typeof timeEntries>();
    const staffHoursByDate = new Map<string, Map<string, number>>();
    
    timeEntries.forEach(entry => {
      const dateKey = entry.clockInTime.toISOString().split('T')[0];
      
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
        staffHoursByDate.set(dateKey, new Map());
      }
      
      entriesByDate.get(dateKey)!.push(entry);
      
      // Calculate hours for this entry
      if (entry.clockOutTime) {
        const hours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
        const staffId = entry.shift.userId;
        const currentHours = staffHoursByDate.get(dateKey)!.get(staffId) || 0;
        staffHoursByDate.get(dateKey)!.set(staffId, currentHours + hours);
      }
    });
    
    // Calculate daily statistics
    const dailyStats = Array.from(entriesByDate.entries()).map(([date, entries]) => {
      const uniqueStaff = new Set(entries.map(e => e.shift.userId));
      const totalHours = entries.reduce((total, entry) => {
        if (entry.clockOutTime) {
          return total + (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
        }
        return total;
      }, 0);
      
      const avgHoursPerStaff = uniqueStaff.size > 0 ? totalHours / uniqueStaff.size : 0;
      
      return {
        date,
        totalHours: Math.round(totalHours * 100) / 100,
        totalShifts: entries.length,
        uniqueStaffCount: uniqueStaff.size,
        avgHoursPerShift: entries.length > 0 ? totalHours / entries.length : 0,
        avgHoursPerStaff: Math.round(avgHoursPerStaff * 100) / 100
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate staff hours breakdown for the last week
    const staffHoursMap = new Map<string, { id: string; name: string; email: string; totalHours: number }>();
    
    timeEntries.forEach(entry => {
      if (entry.clockOutTime) {
        const hours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
        const staffId = entry.shift.userId;
        const staffName = entry.shift.user.name;
        const staffEmail = entry.shift.user.email;
        
        if (staffHoursMap.has(staffId)) {
          staffHoursMap.get(staffId)!.totalHours += hours;
        } else {
          staffHoursMap.set(staffId, {
            id: staffId,
            name: staffName,
            email: staffEmail,
            totalHours: hours
          });
        }
      }
    });
    
    const staffHoursBreakdown = Array.from(staffHoursMap.values())
      .map(staff => ({
        ...staff,
        totalHours: Math.round(staff.totalHours * 100) / 100
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
    
    // Calculate overall statistics
    const totalHoursLastWeek = dailyStats.reduce((total, day) => total + day.totalHours, 0);
    const totalShiftsLastWeek = dailyStats.reduce((total, day) => total + day.totalShifts, 0);
    const totalUniqueStaffLastWeek = new Set(timeEntries.map(e => e.shift.userId)).size;
    
    const avgHoursPerDay = dailyStats.length > 0 ? totalHoursLastWeek / dailyStats.length : 0;
    const avgPeoplePerDay = dailyStats.length > 0 ? 
      dailyStats.reduce((total, day) => total + day.uniqueStaffCount, 0) / dailyStats.length : 0;
    
    const overallStats = {
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      avgPeoplePerDay: Math.round(avgPeoplePerDay * 100) / 100,
      totalHoursLastWeek: Math.round(totalHoursLastWeek * 100) / 100,
      totalShiftsLastWeek,
      totalUniqueStaffLastWeek
    };
    
    console.log('Analytics calculated:', {
      dailyStats: dailyStats.length,
      staffHoursBreakdown: staffHoursBreakdown.length,
      overallStats
    });

    return NextResponse.json({
      dailyStats,
      staffHoursBreakdown,
      overallStats
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
