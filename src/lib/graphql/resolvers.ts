import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



export const resolvers = {
  Query: {
    users: async (_: any) => {
      return await prisma.user.findMany({
        include: {
          location: true,
          shifts: true,
          notes: true,
        },
      });
    },

    user: async (_: any, { id }: { id: string }) => {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          location: true,
          shifts: true,
          notes: true,
        },
      });
    },

    locations: async (_: any) => {
      return await prisma.location.findMany({
        include: {
          users: true,
          shifts: true,
        },
      });
    },

    location: async (_: any, { id }: { id: string }) => {
      return await prisma.location.findUnique({
        where: { id },
        include: {
          users: true,
          shifts: true,
        },
      });
    },

    shifts: async (_: any) => {
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

    timeEntries: async (_: any) => {
      return await prisma.timeEntry.findMany({
        include: {
          shift: true,
        },
      });
    },

    timeEntry: async (_: any, { id }: { id: string }) => {
      return await prisma.timeEntry.findUnique({
        where: { id },
        include: {
          shift: true,
        },
      });
    },

    currentShift: async (_: any, { userId }: { userId: string }) => {
      return await prisma.shift.findFirst({
        where: {
          userId: userId,
          endTime: null,
        },
        include: {
          location: true,
          timeEntries: {
            where: {
              clockOutTime: null,
            },
            orderBy: {
              clockInTime: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      });
    },

    userTimeEntries: async (_: any, { userId }: { userId: string }) => {
      return await prisma.timeEntry.findMany({
        where: {
          shift: {
            userId: userId,
          },
        },
        include: {
          shift: {
            include: {
              user: true,
              location: true,
            },
          },
        },
        orderBy: {
          clockInTime: 'desc',
        },
        take: 50,
      });
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: { input: any }) => {
      return await prisma.user.create({
        data: input,
        include: {
          location: true,
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
          location: true,
          shifts: true,
          notes: true,
        },
      });
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    },

    createLocation: async (_: any, { input }: { input: any }) => {
      return await prisma.location.create({
        data: input,
        include: {
          users: true,
          shifts: true,
        },
      });
    },

    updateLocation: async (_: any, { id, input }: { id: string; input: any }) => {
      return await prisma.location.update({
        where: { id },
        data: input,
        include: {
          users: true,
          shifts: true,
        },
      });
    },

    deleteLocation: async (_: any, { id }: { id: string }) => {
      await prisma.location.delete({
        where: { id },
      });
      return true;
    },

    createShift: async (_: any, { input }: { input: any }) => {
      return await prisma.shift.create({
        data: input,
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
      });
    },

    updateShift: async (_: any, { id, input }: { id: string; input: any }) => {
      return await prisma.shift.update({
        where: { id },
        data: input,
        include: {
          user: true,
          location: true,
          notes: true,
          timeEntries: true,
        },
      });
    },

    deleteShift: async (_: any, { id }: { id: string }) => {
      await prisma.shift.delete({
        where: { id },
      });
      return true;
    },

    createTimeEntry: async (_: any, { input }: { input: any }) => {
      return await prisma.timeEntry.create({
        data: input,
        include: {
          shift: true,
        },
      });
    },

    updateTimeEntry: async (_: any, { id, input }: { id: string; input: any }) => {
      return await prisma.timeEntry.update({
        where: { id },
        data: input,
        include: {
          shift: true,
        },
      });
    },

    deleteTimeEntry: async (_: any, { id }: { id: string }) => {
      await prisma.timeEntry.delete({
        where: { id },
      });
      return true;
    },

    clockIn: async (_: any, { userId, latitude, longitude }: { userId: string; latitude: number; longitude: number }) => {
      // Get user to find their location
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { location: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.locationId) {
        throw new Error('User has no assigned location');
      }

      // Check if user has an active shift
      let activeShift = await prisma.shift.findFirst({
        where: {
          userId: userId,
          endTime: null,
        },
      });

      // If no active shift, create one
      if (!activeShift) {
        activeShift = await prisma.shift.create({
          data: {
            userId: userId,
            locationId: user.locationId,
            startTime: new Date(),
          },
        });
      }

      // Check if user is already clocked in
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          shiftId: activeShift.id,
          clockOutTime: null,
        },
      });

      if (activeEntry) {
        throw new Error('User is already clocked in');
      }

      // Create new time entry
      return await prisma.timeEntry.create({
        data: {
          shiftId: activeShift.id,
          clockInTime: new Date(),
          clockInLatitude: latitude,
          clockInLongitude: longitude,
        },
        include: {
          shift: true,
        },
      });
    },

    clockOut: async (_: any, { userId, note }: { userId: string; note?: string }) => {
      // Find active shift
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: userId,
          endTime: null,
        },
      });

      if (!activeShift) {
        throw new Error('No active shift found');
      }

      // Find active time entry
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          shiftId: activeShift.id,
          clockOutTime: null,
        },
      });

      if (!activeEntry) {
        throw new Error('No active time entry found');
      }

      // Update time entry with clock out
      const updatedEntry = await prisma.timeEntry.update({
        where: {
          id: activeEntry.id,
        },
        data: {
          clockOutTime: new Date(),
          note: note || null,
        },
        include: {
          shift: true,
        },
      });

      // End the shift
      await prisma.shift.update({
        where: {
          id: activeShift.id,
        },
        data: {
          endTime: new Date(),
        },
      });

      return updatedEntry;
    },
  },
};
