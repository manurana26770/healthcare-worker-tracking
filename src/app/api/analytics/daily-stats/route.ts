import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    return payload as { userId: string; role: string; locationId?: string };
  } catch (error) {
    return null;
  }
}

export const GET = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Get date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Build where clause based on user role
    const whereClause: any = {
      startTime: {
        gte: startDate,
        lte: endDate
      }
    };

    // If manager, only show data for their location
    if (user.role === 'MANAGER' && user.locationId) {
      whereClause.locationId = user.locationId;
    }

    // Get all shifts in the date range
    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        timeEntries: {
          where: {
            clockOutTime: {
              not: null
            }
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Calculate daily statistics
    const dailyStats: { [date: string]: any } = {};
    const staffHours: { [staffId: string]: number } = {};

    shifts.forEach(shift => {
      const dateKey = shift.startTime.toISOString().split('T')[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          totalHours: 0,
          totalShifts: 0,
          uniqueStaff: new Set(),
          staffHours: {}
        };
      }

      // Calculate total hours for this shift
      let shiftHours = 0;
      shift.timeEntries.forEach(entry => {
        if (entry.clockOutTime) {
          const duration = new Date(entry.clockOutTime).getTime() - new Date(entry.clockInTime).getTime();
          shiftHours += duration / (1000 * 60 * 60); // Convert to hours
        }
      });

      dailyStats[dateKey].totalHours += shiftHours;
      dailyStats[dateKey].totalShifts += 1;
      dailyStats[dateKey].uniqueStaff.add(shift.userId);
      
      // Track staff hours
      if (!staffHours[shift.userId]) {
        staffHours[shift.userId] = 0;
      }
      staffHours[shift.userId] += shiftHours;

      if (!dailyStats[dateKey].staffHours[shift.userId]) {
        dailyStats[dateKey].staffHours[shift.userId] = 0;
      }
      dailyStats[dateKey].staffHours[shift.userId] += shiftHours;
    });

    // Convert to array and calculate averages
    const dailyStatsArray = Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      totalHours: Math.round(day.totalHours * 100) / 100,
      totalShifts: day.totalShifts,
      uniqueStaffCount: day.uniqueStaff.size,
      avgHoursPerShift: day.totalShifts > 0 ? Math.round((day.totalHours / day.totalShifts) * 100) / 100 : 0,
      avgHoursPerStaff: day.uniqueStaff.size > 0 ? Math.round((day.totalHours / day.uniqueStaff.size) * 100) / 100 : 0
    }));

    // Get staff details for the hours breakdown
    const staffDetails = await prisma.user.findMany({
      where: {
        id: {
          in: Object.keys(staffHours)
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const staffHoursBreakdown = staffDetails.map(staff => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      totalHours: Math.round(staffHours[staff.id] * 100) / 100
    }));

    // Calculate overall averages
    const totalDays = dailyStatsArray.length;
    const totalHours = dailyStatsArray.reduce((sum, day) => sum + day.totalHours, 0);
    const totalShifts = dailyStatsArray.reduce((sum, day) => sum + day.totalShifts, 0);
    const totalUniqueStaff = dailyStatsArray.reduce((sum, day) => sum + day.uniqueStaffCount, 0);

    const overallStats = {
      avgHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
      avgPeoplePerDay: totalDays > 0 ? Math.round((totalUniqueStaff / totalDays) * 100) / 100 : 0,
      totalHoursLastWeek: Math.round(totalHours * 100) / 100,
      totalShiftsLastWeek: totalShifts,
      totalUniqueStaffLastWeek: totalUniqueStaff
    };

    return NextResponse.json({
      dailyStats: dailyStatsArray,
      staffHoursBreakdown,
      overallStats
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};
