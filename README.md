# Healthcare Worker Time Tracking System

A comprehensive web application for healthcare organizations to manage employee clock-in and clock-out with location-based verification.

## Features

### For Healthcare Workers
- **Location-Based Clock-In/Out**: Clock in and out only when within designated facility perimeters
- **Optional Notes**: Add notes when clocking in or out
- **Real-Time Location Detection**: Automatic GPS location verification
- **Time Entry History**: View your past clock-in/out records
- **Mobile-Friendly**: Responsive design works on both desktop and mobile devices

### For Managers
- **Location Management**: Set up facility perimeters with customizable radius
- **Staff Monitoring**: Real-time view of all clocked-in staff
- **Time Tracking Analytics**: 
  - Average hours per day
  - Number of people clocking in daily
  - Total hours per staff over the last week
- **Comprehensive Reports**: Detailed time entry history for all staff

### Authentication
- **Auth0 Integration**: Secure authentication with Google and email login options
- **Role-Based Access**: Different interfaces for managers and care workers
- **Session Management**: Secure session handling with automatic logout

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Framework**: Grommet Design System
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **API**: GraphQL with Apollo Server
- **Styling**: Tailwind CSS
- **Location Services**: Browser Geolocation API

## Database Schema

### Core Models
- **User**: Base user with authentication and role management
- **CareWorker**: Healthcare worker profiles with employee details
- **Manager**: Manager profiles with location management permissions
- **Location**: Facility locations with GPS coordinates and perimeter radius
- **TimeEntry**: Clock-in/out records with location and timestamp data

### User Roles
- **ADMIN**: Full system access
- **MANAGER**: Location management and staff monitoring
- **CARE_WORKER**: Clock-in/out functionality

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Auth0 account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_tracking"
   AUTH0_SECRET="your-auth0-secret"
   AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
   AUTH0_BASE_URL="http://localhost:3000"
   AUTH0_CLIENT_ID="your-auth0-client-id"
   AUTH0_CLIENT_SECRET="your-auth0-client-secret"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Healthcare Workers

1. **Sign In**: Use Auth0 to authenticate with your credentials
2. **View Dashboard**: See your current status and available locations
3. **Clock In**: 
   - Ensure you're within a facility perimeter
   - Click "Clock In" button
   - Add optional notes
   - Confirm your location
4. **Clock Out**: 
   - Click "Clock Out" when your shift ends
   - Add optional notes
   - Confirm your location
5. **View History**: Check your recent time entries

### For Managers

1. **Sign In**: Use Auth0 to authenticate with manager credentials
2. **Dashboard Overview**: View staff status and analytics
3. **Manage Locations**:
   - Add new facility locations
   - Set GPS coordinates and perimeter radius
   - Edit or delete existing locations
4. **Monitor Staff**: 
   - View real-time clock-in status
   - Check time entry history
   - Review analytics and reports

## Location-Based Features

### Perimeter Management
- Each facility has a defined GPS location and radius
- Default radius is 2km (2000 meters)
- Managers can customize radius per location
- Locations can be activated/deactivated

### GPS Verification
- Uses browser's Geolocation API
- Calculates distance using Haversine formula
- Real-time location checking
- Fallback handling for location errors

## API Endpoints

### GraphQL Queries
- `me`: Get current user information
- `careWorkers`: List all healthcare workers
- `locations`: Get all facility locations
- `timeEntries`: Retrieve time entry history
- `staffStatus`: Get current staff clock-in status
- `dashboardStats`: Get analytics data

### GraphQL Mutations
- `clockIn`: Create new time entry
- `clockOut`: Update existing time entry
- `createLocation`: Add new facility location
- `updateLocation`: Modify existing location
- `deleteLocation`: Remove facility location

## Security Features

- **Auth0 Authentication**: Industry-standard OAuth 2.0
- **Role-Based Access Control**: Different permissions per user role
- **Location Verification**: Prevents unauthorized clock-ins
- **Session Management**: Secure session handling
- **Data Validation**: Input validation and sanitization

## Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Touch interfaces

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly set for your production environment, including:
- Database connection string
- Auth0 configuration
- API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
