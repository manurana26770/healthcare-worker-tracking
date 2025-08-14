# Healthcare Worker Time Tracking System - Codebase Explanation

## Overview
This is a comprehensive web application for healthcare organizations to manage employee clock-in and clock-out with location-based verification. The system uses Next.js 15 with TypeScript, PostgreSQL database with Prisma ORM, Auth0 for authentication, and supports both REST API and GraphQL endpoints.

## Technology Stack
- **Frontend**: Next.js 15 with TypeScript
- **UI Framework**: Grommet Design System
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **API**: REST API with Next.js API Routes + GraphQL with Apollo Server
- **Styling**: Tailwind CSS
- **Location Services**: Browser Geolocation API

## Project Structure

```
healthcare-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── worker/            # Worker Dashboard
│   │   ├── manager/           # Manager Dashboard
│   │   ├── onboarding/        # User Onboarding
│   │   └── layout.tsx         # Root Layout
│   ├── components/            # Reusable Components
│   ├── context/               # React Context Providers
│   ├── hooks/                 # Custom React Hooks
│   ├── lib/                   # Utility Libraries
│   └── generated/             # Generated Files
├── prisma/                    # Database Schema & Migrations
├── public/                    # Static Assets
└── package.json              # Dependencies & Scripts
```

## Database Schema

### Core Models

#### User
- **Purpose**: Base user with authentication and role management
- **Key Fields**: `id`, `auth0Id`, `email`, `name`, `role`, `locationId`
- **Relations**: `location`, `shifts`, `notes`

#### Location
- **Purpose**: Facility locations with GPS coordinates and perimeter radius
- **Key Fields**: `id`, `name`, `address`, `latitude`, `longitude`, `radius`, `isActive`
- **Relations**: `users`, `shifts`

#### Shift
- **Purpose**: Work shifts with start and end times
- **Key Fields**: `id`, `userId`, `locationId`, `startTime`, `endTime`
- **Relations**: `user`, `location`, `notes`, `timeEntries`

#### TimeEntry
- **Purpose**: Clock-in/out records with location and timestamp data
- **Key Fields**: `id`, `shiftId`, `clockInTime`, `clockOutTime`, `note`, `clockInLatitude`, `clockInLongitude`
- **Relations**: `shift`

#### Note
- **Purpose**: Additional notes for clock-in/out events
- **Key Fields**: `id`, `shiftId`, `userId`, `content`, `type`
- **Relations**: `shift`, `user`

### User Roles
- **ADMIN**: Full system access
- **MANAGER**: Location management and staff monitoring
- **CARE_WORKER**: Clock-in/out functionality

## API Routes Structure

### Authentication Routes (`/api/auth/`)
- **`/api/auth/session`** - Get current user session
- **`/api/auth/login`** - Auth0 login endpoint
- **`/api/auth/callback`** - Auth0 callback handler
- **`/api/auth/signup`** - User registration
- **`/api/auth/logout`** - User logout

### Time Tracking Routes (`/api/time-entries/`)
- **`/api/time-entries/clock-in`** - Clock in endpoint
  - **Method**: POST
  - **Body**: `{ userId, latitude, longitude, note? }`
  - **Functionality**: Creates time entry and shift if needed
- **`/api/time-entries/clock-out`** - Clock out endpoint
  - **Method**: POST
  - **Body**: `{ userId, note? }`
  - **Functionality**: Updates time entry and ends shift
- **`/api/time-entries/`** - Main time entries endpoint
  - **Method**: GET - Fetch user time entries
  - **Method**: POST - Clock in (alternative)
  - **Method**: PUT - Clock out (alternative)

### Shift Management Routes (`/api/shifts/`)
- **`/api/shifts/current`** - Get current active shift
  - **Method**: GET
  - **Query**: `userId`
  - **Functionality**: Returns active shift with time entries

### Location Management Routes (`/api/locations/`)
- **`/api/locations/`** - Location CRUD operations
- **`/api/locations/available`** - Get available locations
- **`/api/locations/[id]`** - Specific location operations

### Staff Management Routes (`/api/staff/`)
- **`/api/staff/`** - Staff management operations
- **`/api/staff/time-entries`** - Staff time entries

### Analytics Routes (`/api/analytics/`)
- **`/api/analytics/daily-stats`** - Daily statistics

## Frontend Pages

### Worker Dashboard (`/worker`)
- **Purpose**: Main interface for healthcare workers
- **Features**:
  - Location-based clock-in/out
  - Real-time location verification
  - Current shift status
  - Optional notes for time entries
- **Key Components**:
  - User info card
  - Location status with perimeter checking
  - Time tracking interface
  - Clock-in/out forms

### Manager Dashboard (`/manager`)
- **Purpose**: Management interface for supervisors
- **Features**:
  - Staff monitoring
  - Location management
  - Time tracking analytics
  - Reports generation

### Onboarding (`/onboarding`)
- **Purpose**: New user setup process
- **Features**:
  - Role assignment
  - Location assignment
  - Profile completion

## Key Components

### Context Providers
- **`Auth0Context`** - Auth0 authentication state management
- **`AppContext`** - Global application state
- **`ThemeProvider`** - UI theme management
- **`ApolloProvider`** - GraphQL client provider

### Custom Hooks
- **`useAuth`** - Authentication utilities
- **`useGeolocation`** - Location services

### UI Components
- **`LoginForm`** - Authentication form
- **`SignupForm`** - Registration form
- **`ProtectedRoute`** - Route protection wrapper

## Authentication Flow

1. **User visits application** → Redirected to Auth0 login
2. **Auth0 authentication** → User logs in with Google/email
3. **Callback handling** → User data stored in session
4. **Role-based routing** → Redirected to appropriate dashboard
5. **Session validation** → Protected routes check authentication

## Location-Based Clock-In/Out Process

1. **User requests clock-in** → System gets current GPS location
2. **Perimeter verification** → Checks if user is within facility radius
3. **Shift creation** → Creates new shift if none exists
4. **Time entry creation** → Records clock-in with location data
5. **Clock-out process** → Updates time entry and ends shift

## Database Operations

### Clock-In Process
```sql
-- Check for active shift
SELECT * FROM shifts WHERE userId = ? AND endTime IS NULL

-- Create shift if none exists
INSERT INTO shifts (userId, locationId, startTime) VALUES (?, ?, NOW())

-- Check for active time entry
SELECT * FROM time_entries WHERE shiftId = ? AND clockOutTime IS NULL

-- Create time entry
INSERT INTO time_entries (shiftId, clockInTime, clockInLatitude, clockInLongitude) 
VALUES (?, NOW(), ?, ?)
```

### Clock-Out Process
```sql
-- Find active shift
SELECT * FROM shifts WHERE userId = ? AND endTime IS NULL

-- Find active time entry
SELECT * FROM time_entries WHERE shiftId = ? AND clockOutTime IS NULL

-- Update time entry
UPDATE time_entries SET clockOutTime = NOW(), note = ? WHERE id = ?

-- End shift
UPDATE shifts SET endTime = NOW() WHERE id = ?
```

## Security Features

1. **Auth0 Integration** - Enterprise-grade authentication
2. **Role-based Access Control** - Different interfaces per user role
3. **Location Verification** - GPS-based perimeter checking
4. **Session Management** - Secure session handling
5. **Input Validation** - Server-side data validation

## Error Handling

- **API Routes**: Consistent error responses with status codes
- **Frontend**: User-friendly error messages and notifications
- **Database**: Prisma error handling with proper fallbacks
- **Location Services**: Graceful handling of GPS failures

## Performance Optimizations

1. **Database Indexing** - Optimized queries for time entries and shifts
2. **Caching** - Apollo Client caching for GraphQL queries
3. **Lazy Loading** - Component and route-based code splitting
4. **Image Optimization** - Next.js built-in image optimization

## Development vs Production

### Development Features
- Hot reloading with Turbopack
- Detailed error messages
- Development-only API endpoints
- Local database connections

### Production Features
- Optimized builds
- Error logging
- Environment-specific configurations
- Security headers

## Deployment Considerations

1. **Environment Variables** - Secure configuration management
2. **Database Migrations** - Prisma migration system
3. **Static Assets** - Optimized for CDN delivery
4. **API Rate Limiting** - Protection against abuse
5. **Monitoring** - Error tracking and performance monitoring

## Testing Strategy

- **Unit Tests** - Component and utility testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - User workflow testing
- **Database Tests** - Prisma model testing

## Future Enhancements

1. **Mobile App** - React Native implementation
2. **Real-time Updates** - WebSocket integration
3. **Advanced Analytics** - Detailed reporting dashboard
4. **Multi-location Support** - Enhanced location management
5. **API Documentation** - OpenAPI/Swagger documentation

## Code Quality Standards

- **TypeScript** - Strict type checking
- **ESLint** - Code linting and formatting
- **Prettier** - Consistent code formatting
- **Git Hooks** - Pre-commit validation
- **Code Reviews** - Peer review process

This codebase is designed to be scalable, maintainable, and production-ready with comprehensive documentation and clear separation of concerns.
