import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const resolvers = {
  Query: {
    // User queries
    users: async () => {
      return await prisma.user.findMany({
        include: {
          shifts: true,
          notes: true,
        },
      });
    },

    user: async (_: any, { id }: { id: string }) => {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          shifts: true,
          notes: true,
        },
      });
    },

    currentUser: async (_: any, __: any, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');
      
      return await prisma.user.findUnique({
        where: { auth0Id: user.sub },
        include: {
          shifts: true,
          notes: true,
        },
      });
    },

    // Location queries
    locations: async () => {
      return await prisma.location.findMany({
        include: {
          shifts: true,
        },
      });
    },

    location: async (_: any, { id }: { id: string }) => {
      return await prisma.location.findUnique({
        where: { id },
        include: {
          shifts: true,
        },
      });
    },

    activeLocations: async () => {
      return await prisma.location.findMany({
        where: { isActive: true },
        include: {
          shifts: true,
        },
      });
    },

    // Shift queries
    shifts: async () => {
      return await prisma.shift.findMany({
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
      });
    },

    shift: async (_: any, { id }: { id: string }) => {
      return await prisma.shift.findUnique({
        where: { id },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
      });
    },

    userShifts: async (_: any, { userId }: { userId: string }) => {
      return await prisma.shift.findMany({
        where: { userId },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    currentUserShifts: async (_: any, __: any, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');
      
      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      return await prisma.shift.findMany({
        where: { userId: dbUser.id },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    getUserShifts: async (_: any, { userId }: { userId: string }) => {
      return await prisma.shift.findMany({
        where: { userId },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    getCurrentShift: async (_: any, __: any, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');
      
      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      // Find the current active shift (has time entries without clock out)
      const currentShift = await prisma.shift.findFirst({
        where: {
          userId: dbUser.id,
          timeEntries: {
            some: {
              clockOutTime: null,
            },
          },
        },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: {
            where: {
              clockOutTime: null,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      return currentShift;
    },

    activeShifts: async () => {
      return await prisma.shift.findMany({
        where: {
          timeEntries: {
            some: {
              clockOutTime: null,
            },
          },
        },
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
      });
    },

    // TimeEntry queries
    timeEntries: async () => {
      return await prisma.timeEntry.findMany({
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    timeEntry: async (_: any, { id }: { id: string }) => {
      return await prisma.timeEntry.findUnique({
        where: { id },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
      });
    },

    userTimeEntries: async (_: any, { userId }: { userId: string }) => {
      return await prisma.timeEntry.findMany({
        where: {
          shift: { userId },
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    currentUserTimeEntries: async (_: any, __: any, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');
      
      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      return await prisma.timeEntry.findMany({
        where: {
          shift: { userId: dbUser.id },
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    activeTimeEntries: async () => {
      return await prisma.timeEntry.findMany({
        where: {
          clockOutTime: null,
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
      });
    },

    // Note queries
    notes: async () => {
      return await prisma.note.findMany({
        include: {
          shift: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    note: async (_: any, { id }: { id: string }) => {
      return await prisma.note.findUnique({
        where: { id },
        include: {
          shift: true,
          user: true,
        },
      });
    },

    shiftNotes: async (_: any, { shiftId }: { shiftId: string }) => {
      return await prisma.note.findMany({
        where: { shiftId },
        include: {
          shift: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Dashboard queries
    dashboardStats: async () => {
      const totalUsers = await prisma.user.count();
      const activeShifts = await prisma.shift.count({
        where: {
          timeEntries: {
            some: {
              clockOutTime: null,
            },
          },
        },
      });
      const totalTimeEntries = await prisma.timeEntry.count();
      
      // Calculate average shift duration
      const completedTimeEntries = await prisma.timeEntry.findMany({
        where: {
          clockOutTime: { not: null },
        },
      });

      let totalDuration = 0;
      completedTimeEntries.forEach(entry => {
        const duration = new Date(entry.clockOutTime!).getTime() - new Date(entry.clockInTime).getTime();
        totalDuration += duration;
      });

      const averageShiftDuration = completedTimeEntries.length > 0 
        ? totalDuration / completedTimeEntries.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      return {
        totalUsers,
        activeShifts,
        totalTimeEntries,
        averageShiftDuration,
      };
    },

    staffStatus: async () => {
      const users = await prisma.user.findMany({
        include: {
          shifts: {
            include: {
              timeEntries: {
                where: {
                  clockOutTime: null,
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      return users.map(user => {
        const currentShift = user.shifts[0];
        const currentTimeEntry = currentShift?.timeEntries[0];
        const isClockedIn = !!currentTimeEntry;

        return {
          user,
          isClockedIn,
          currentShift: isClockedIn ? currentShift : null,
          currentTimeEntry: isClockedIn ? currentTimeEntry : null,
          lastClockIn: currentTimeEntry ? currentTimeEntry.clockInTime.toISOString() : null,
        };
      });
    },
  },

  Mutation: {
    // Clock in/out mutations
    clockIn: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');

      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      // Check if user is already clocked in
      const activeTimeEntry = await prisma.timeEntry.findFirst({
        where: {
          shift: { userId: dbUser.id },
          clockOutTime: null,
        },
      });

      if (activeTimeEntry) {
        throw new GraphQLError('User is already clocked in');
      }

      // Verify location and check if user is within radius
      const location = await prisma.location.findUnique({
        where: { id: input.locationId },
      });

      if (!location) {
        throw new GraphQLError('Location not found');
      }

      if (!location.isActive) {
        throw new GraphQLError('Location is not active');
      }

      const distance = calculateDistance(
        input.latitude,
        input.longitude,
        location.latitude,
        location.longitude
      );

      if (distance > location.radius) {
        throw new GraphQLError('You must be within the facility perimeter to clock in');
      }

      // Create or find existing shift for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let shift = await prisma.shift.findFirst({
        where: {
          userId: dbUser.id,
          locationId: input.locationId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (!shift) {
        shift = await prisma.shift.create({
          data: {
            userId: dbUser.id,
            locationId: input.locationId,
          },
        });
      }

      // Create time entry
      const timeEntry = await prisma.timeEntry.create({
        data: {
          shiftId: shift.id,
          clockInTime: new Date(),
          clockInLatitude: input.latitude,
          clockInLongitude: input.longitude,
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Successfully clocked in',
        timeEntry,
        shift,
      };
    },

    clockOut: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');

      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      // Find the active time entry
      const timeEntry = await prisma.timeEntry.findFirst({
        where: {
          id: input.timeEntryId,
          shift: { userId: dbUser.id },
          clockOutTime: null,
        },
        include: {
          shift: {
            include: {
              location: true,
            },
          },
        },
      });

      if (!timeEntry) {
        throw new GraphQLError('No active time entry found');
      }

      // Update time entry with clock out
      const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id: timeEntry.id },
        data: {
          clockOutTime: new Date(),
          clockOutLatitude: input.latitude,
          clockOutLongitude: input.longitude,
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
      });

      // Create note if provided
      let note = null;
      if (input.note) {
        note = await prisma.note.create({
          data: {
            shiftId: timeEntry.shift.id,
            userId: dbUser.id,
            content: input.note,
            type: 'CLOCK_OUT',
          },
          include: {
            shift: true,
            user: true,
          },
        });
      }

      return {
        success: true,
        message: 'Successfully clocked out',
        timeEntry: updatedTimeEntry,
        note,
      };
    },

    // User mutations
    createUser: async (_: any, { input }: { input: any }) => {
      return await prisma.user.create({
        data: input,
        include: {
          shifts: true,
          notes: true,
        },
      });
    },

    updateUser: async (_: any, { id, input }: { id: string; input: any }) => {
      return await prisma.user.update({
        where: { id },
        data: input,
        include: {
          shifts: true,
          notes: true,
        },
      });
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      await prisma.user.delete({ where: { id } });
      return true;
    },

    // Location mutations
    createLocation: async (_: any, { input }: { input: any }) => {
      return await prisma.location.create({
        data: input,
        include: {
          shifts: true,
        },
      });
    },

    updateLocation: async (_: any, { input }: { input: any }) => {
      const { id, ...data } = input;
      return await prisma.location.update({
        where: { id },
        data,
        include: {
          shifts: true,
        },
      });
    },

    deleteLocation: async (_: any, { id }: { id: string }) => {
      await prisma.location.delete({ where: { id } });
      return true;
    },

    // Note mutations
    createNote: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');

      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      return await prisma.note.create({
        data: {
          ...input,
          userId: dbUser.id,
        },
        include: {
          shift: true,
          user: true,
        },
      });
    },

    updateNote: async (_: any, { id, input }: { id: string; input: any }, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');

      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      // Check if user owns the note
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note || note.userId !== dbUser.id) {
        throw new GraphQLError('Not authorized to update this note');
      }

      return await prisma.note.update({
        where: { id },
        data: input,
        include: {
          shift: true,
          user: true,
        },
      });
    },

    deleteNote: async (_: any, { id }: { id: string }, { user }: { user: any }) => {
      if (!user) throw new GraphQLError('Not authenticated');

      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: user.sub },
      });
      
      if (!dbUser) throw new GraphQLError('User not found');

      // Check if user owns the note
      const note = await prisma.note.findUnique({
        where: { id },
      });

      if (!note || note.userId !== dbUser.id) {
        throw new GraphQLError('Not authorized to delete this note');
      }

      await prisma.note.delete({ where: { id } });
      return true;
    },
  },
}; 