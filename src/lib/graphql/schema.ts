import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum UserRole {
    CARE_WORKER
    MANAGER
    ADMIN
  }

  type User {
    id: ID!
    auth0Id: String!
    email: String!
    name: String!
    role: UserRole!
    createdAt: String!
    updatedAt: String!
    shifts: [Shift!]!
    notes: [Note!]!
  }

  type Location {
    id: ID!
    name: String!
    address: String!
    latitude: Float!
    longitude: Float!
    radius: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    shifts: [Shift!]!
  }

  type Shift {
    id: ID!
    userId: String!
    locationId: String!
    createdAt: String!
    updatedAt: String!
    user: User!
    location: Location!
    notes: [Note!]!
    timeEntries: [TimeEntry!]!
  }

  type Note {
    id: ID!
    shiftId: String!
    userId: String!
    content: String!
    type: String!
    createdAt: String!
    shift: Shift!
    user: User!
  }

  type TimeEntry {
    id: ID!
    shiftId: String!
    clockInTime: String!
    clockOutTime: String
    clockInLatitude: Float!
    clockInLongitude: Float!
    clockOutLatitude: Float
    clockOutLongitude: Float
    createdAt: String!
    updatedAt: String!
    shift: Shift!
  }

  type ClockInResponse {
    success: Boolean!
    message: String!
    timeEntry: TimeEntry
    shift: Shift
  }

  type ClockOutResponse {
    success: Boolean!
    message: String!
    timeEntry: TimeEntry
    note: Note
  }

  input ClockInInput {
    locationId: String!
    latitude: Float!
    longitude: Float!
  }

  input ClockOutInput {
    timeEntryId: String!
    latitude: Float!
    longitude: Float!
    note: String
  }

  input CreateLocationInput {
    name: String!
    address: String!
    latitude: Float!
    longitude: Float!
    radius: Int
  }

  input UpdateLocationInput {
    id: String!
    name: String
    address: String
    latitude: Float
    longitude: Float
    radius: Int
    isActive: Boolean
  }

  type Query {
    # User queries
    users: [User!]!
    user(id: String!): User
    currentUser: User

    # Location queries
    locations: [Location!]!
    location(id: String!): Location
    activeLocations: [Location!]!

    # Shift queries
    shifts: [Shift!]!
    shift(id: String!): Shift
    userShifts(userId: String!): [Shift!]!
    getUserShifts(userId: String!): [Shift!]! # Alias for userShifts
    currentUserShifts: [Shift!]!
    getCurrentShift: Shift # Get current active shift for authenticated user
    activeShifts: [Shift!]!

    # TimeEntry queries
    timeEntries: [TimeEntry!]!
    timeEntry(id: String!): TimeEntry
    userTimeEntries(userId: String!): [TimeEntry!]!
    currentUserTimeEntries: [TimeEntry!]!
    activeTimeEntries: [TimeEntry!]!

    # Note queries
    notes: [Note!]!
    note(id: String!): Note
    shiftNotes(shiftId: String!): [Note!]!

    # Dashboard queries
    dashboardStats: DashboardStats!
    staffStatus: [StaffStatus!]!
  }

  type DashboardStats {
    totalUsers: Int!
    activeShifts: Int!
    totalTimeEntries: Int!
    averageShiftDuration: Float!
  }

  type StaffStatus {
    user: User!
    isClockedIn: Boolean!
    currentShift: Shift
    currentTimeEntry: TimeEntry
    lastClockIn: String
  }

  type Mutation {
    # Clock in/out mutations
    clockIn(input: ClockInInput!): ClockInResponse!
    clockOut(input: ClockOutInput!): ClockOutResponse!

    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: String!, input: UpdateUserInput!): User!
    deleteUser(id: String!): Boolean!

    # Location mutations
    createLocation(input: CreateLocationInput!): Location!
    updateLocation(input: UpdateLocationInput!): Location!
    deleteLocation(id: String!): Boolean!

    # Note mutations
    createNote(input: CreateNoteInput!): Note!
    updateNote(id: String!, input: UpdateNoteInput!): Note!
    deleteNote(id: String!): Boolean!
  }

  input CreateUserInput {
    auth0Id: String!
    email: String!
    name: String!
    role: UserRole
  }

  input UpdateUserInput {
    email: String
    name: String
    role: UserRole
  }

  input CreateNoteInput {
    shiftId: String!
    content: String!
    type: String
  }

  input UpdateNoteInput {
    content: String!
    type: String
  }
`; 