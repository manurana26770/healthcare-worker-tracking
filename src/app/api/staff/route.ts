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

// GET staff members for a location
export const GET = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only managers and admins can view staff
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    let staffMembers;
    
    if (user.role === 'ADMIN') {
      // Admin can see all staff members
      staffMembers = await prisma.user.findMany({
        where: {
          role: 'CARE_WORKER',
          locationId: {
            not: null
          }
        },
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
              address: true
            }
          },
          shifts: {
            where: {
              timeEntries: {
                some: {
                  clockOutTime: null
                }
              }
            },
            select: {
              id: true,
              timeEntries: {
                where: {
                  clockOutTime: null
                },
                select: {
                  id: true,
                  clockInTime: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      // Managers can only see staff from their assigned location
      if (!user.locationId) {
        return NextResponse.json({
          staffMembers: [],
          message: 'No location assigned to user'
        });
      }
      
      staffMembers = await prisma.user.findMany({
        where: {
          role: 'CARE_WORKER',
          locationId: user.locationId
        },
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
              address: true
            }
          },
          shifts: {
            where: {
              timeEntries: {
                some: {
                  clockOutTime: null
                }
              }
            },
            select: {
              id: true,
              timeEntries: {
                where: {
                  clockOutTime: null
                },
                select: {
                  id: true,
                  clockInTime: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    }

    // Transform the data to include clock-in status
    const transformedStaff = staffMembers.map(staff => {
      const isClockedIn = staff.shifts.length > 0;
      const currentShift = staff.shifts[0];
      const lastClockIn = currentShift?.timeEntries[0]?.clockInTime;

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        locationId: staff.locationId,
        location: staff.location,
        isClockedIn,
        lastClockIn: lastClockIn ? lastClockIn.toISOString() : null,
        currentShiftId: currentShift?.id || null
      };
    });

    return NextResponse.json({
      staffMembers: transformedStaff,
      message: 'Staff members retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching staff members:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};
