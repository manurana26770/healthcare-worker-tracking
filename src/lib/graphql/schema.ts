import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    auth0Id: String
    email: String!
    name: String!
    role: UserRole!
    locationId: String
    createdAt: String!
    updatedAt: String!
    location: Location
    shifts: [Shift!]!
    notes: [Note!]!
  }

  enum UserRole {
    CARE_WORKER
    MANAGER
    ADMIN
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
    users: [User!]!
    shifts: [Shift!]!
  }

  type Shift {
    id: ID!
    userId: String!
    locationId: String!
    startTime: String!
    endTime: String
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
    note: String
    clockInLatitude: Float!
    clockInLongitude: Float!
    clockOutLatitude: Float
    clockOutLongitude: Float
    createdAt: String!
    updatedAt: String!
    shift: Shift!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    locations: [Location!]!
    location(id: ID!): Location
    shifts: [Shift!]!
    shift(id: ID!): Shift
    timeEntries: [TimeEntry!]!
    timeEntry(id: ID!): TimeEntry
    currentShift(userId: ID!): Shift
    userTimeEntries(userId: ID!): [TimeEntry!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    createLocation(input: CreateLocationInput!): Location!
    updateLocation(id: ID!, input: UpdateLocationInput!): Location!
    deleteLocation(id: ID!): Boolean!
    
    createShift(input: CreateShiftInput!): Shift!
    updateShift(id: ID!, input: UpdateShiftInput!): Shift!
    deleteShift(id: ID!): Boolean!
    
    createTimeEntry(input: CreateTimeEntryInput!): TimeEntry!
    updateTimeEntry(id: ID!, input: UpdateTimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): Boolean!
    
    clockIn(userId: ID!, latitude: Float!, longitude: Float!): TimeEntry!
    clockOut(userId: ID!, note: String): TimeEntry!
  }

  input CreateUserInput {
    auth0Id: String
    email: String!
    name: String!
    role: UserRole!
    locationId: String
  }

  input UpdateUserInput {
    email: String
    name: String
    role: UserRole
    locationId: String
  }

  input CreateLocationInput {
    name: String!
    address: String!
    latitude: Float!
    longitude: Float!
    radius: Int!
    isActive: Boolean
  }

  input UpdateLocationInput {
    name: String
    address: String
    latitude: Float
    longitude: Float
    radius: Int
    isActive: Boolean
  }

  input CreateShiftInput {
    userId: String!
    locationId: String!
    startTime: String
  }

  input UpdateShiftInput {
    endTime: String
  }

  input CreateTimeEntryInput {
    shiftId: String!
    clockInTime: String
    clockInLatitude: Float!
    clockInLongitude: Float!
  }

  input UpdateTimeEntryInput {
    clockOutTime: String
    clockOutLatitude: Float
    clockOutLongitude: Float
    note: String
  }
`;
