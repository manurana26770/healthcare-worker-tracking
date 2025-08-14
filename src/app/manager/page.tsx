'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@/context/Auth0Context';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Form,
  FormField,
  TextInput,
  Notification,
  DataTable,
  Grid,
  Tabs,
  Tab,
  Spinner,
  Accordion,
  AccordionPanel
} from 'grommet';
import { Add, Edit, Trash, Location, User, Clock, Analytics, Refresh } from 'grommet-icons';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  locationId: string;
  location?: {
    id: string;
    name: string;
    address: string;
  };
}

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
}

interface LocationForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  locationId: string;
  location?: {
    id: string;
    name: string;
    address: string;
  };
  isClockedIn: boolean;
  lastClockIn?: string;
  currentShiftId?: string;
  recentTimeEntries?: TimeEntry[];
}

interface TimeEntry {
  id: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInLatitude: number;
  clockInLongitude: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  note?: string;
  duration?: number;
  isActive?: boolean;
}

interface StaffTimeEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  location: any;
  timeEntries: TimeEntry[];
  totalHours: number;
  isCurrentlyClockedIn: boolean;
}

interface DailyStats {
  date: string;
  totalHours: number;
  totalShifts: number;
  uniqueStaffCount: number;
  avgHoursPerShift: number;
  avgHoursPerStaff: number;
}

interface StaffHoursBreakdown {
  id: string;
  name: string;
  email: string;
  totalHours: number;
}

interface OverallStats {
  avgHoursPerDay: number;
  avgPeoplePerDay: number;
  totalHoursLastWeek: number;
  totalShiftsLastWeek: number;
  totalUniqueStaffLastWeek: number;
}

export default function ManagerPage() {
  const { logout } = useAuth0();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffTimeEntries, setStaffTimeEntries] = useState<StaffTimeEntry[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [staffHoursBreakdown, setStaffHoursBreakdown] = useState<StaffHoursBreakdown[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<LocationForm>({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '2000' // Default 2km in meters
  });

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
  }, []);

  // Fetch data when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchLocations();
      fetchStaffMembers();
      fetchAnalytics();
      fetchStaffTimeEntries();
    }
  }, [currentUser, fetchLocations, fetchStaffMembers, fetchAnalytics, fetchStaffTimeEntries]);

  const checkUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setCurrentUser(data.user);
        
        // Redirect if not a manager or admin
        if (data.user.role !== 'MANAGER' && data.user.role !== 'ADMIN') {
          window.location.href = '/';
          return;
        }
      } else {
        // No session, redirect to homepage
        window.location.href = '/';
        return;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      window.location.href = '/';
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchLocations = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      } else {
        setError('Failed to fetch locations');
      }
    } catch (error) {
      setError('Error fetching locations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staffMembers || []);
      } else {
        console.error('Failed to fetch staff members');
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchStaffTimeEntries = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingTimeEntries(true);
      const response = await fetch('/api/staff/time-entries');
      if (response.ok) {
        const data = await response.json();
        setStaffTimeEntries(data.staffTimeEntries || []);
      } else {
        console.error('Failed to fetch staff time entries');
      }
    } catch (error) {
      console.error('Error fetching staff time entries:', error);
    } finally {
      setIsLoadingTimeEntries(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingAnalytics(true);
      const response = await fetch('/api/analytics/daily-stats');
      if (response.ok) {
        const data = await response.json();
        setDailyStats(data.dailyStats || []);
        setStaffHoursBreakdown(data.staffHoursBreakdown || []);
        setOverallStats(data.overallStats || null);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleSubmit = async (values: LocationForm) => {
    try {
      const locationData = {
        name: values.name,
        address: values.address,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
        radius: parseInt(values.radius),
        isActive: true
      };

      const url = editingLocation 
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations';
      
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        setSuccess(editingLocation ? 'Location updated successfully!' : 'Location added successfully!');
        setShowForm(false);
        setEditingLocation(null);
        resetForm();
        fetchLocations();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save location');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Location deleted successfully!');
        fetchLocations();
      } else {
        setError('Failed to delete location');
      }
    } catch (error) {
      setError('Error deleting location');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius.toString()
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: '2000'
    });
  };

  const openAddForm = () => {
    setEditingLocation(null);
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    resetForm();
    setError(null);
  };

  const handleLogout = () => {
    // Use the Auth0Context logout function
    logout();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const locationColumns = [
    {
      property: 'name',
      header: 'Location Name',
      primary: true,
    },
    {
      property: 'address',
      header: 'Address',
    },
    {
      property: 'latitude',
      header: 'Latitude',
      render: (datum: Location) => datum.latitude.toFixed(6),
    },
    {
      property: 'longitude',
      header: 'Longitude',
      render: (datum: Location) => datum.longitude.toFixed(6),
    },
    {
      property: 'radius',
      header: 'Radius (m)',
      render: (datum: Location) => `${datum.radius}m`,
    },
    {
      property: 'isActive',
      header: 'Status',
      render: (datum: Location) => (
        <Box
          background={datum.isActive ? 'status-ok' : 'status-error'}
          pad="xsmall"
          round="small"
        >
          <Text size="small" color="white">
            {datum.isActive ? 'Active' : 'Inactive'}
          </Text>
        </Box>
      ),
    },
    {
      property: 'actions',
      header: 'Actions',
      render: (datum: Location) => (
        <Box direction="row" gap="small">
          <Button
            icon={<Edit />}
            size="small"
            onClick={() => handleEdit(datum)}
          />
          {currentUser?.role === 'ADMIN' && (
            <Button
              icon={<Trash />}
              size="small"
              onClick={() => handleDelete(datum.id)}
            />
          )}
        </Box>
      ),
    },
  ];

  const staffColumns = [
    {
      property: 'name',
      header: 'Staff Name',
      primary: true,
    },
    {
      property: 'email',
      header: 'Email',
    },
    {
      property: 'role',
      header: 'Role',
    },
    {
      property: 'isClockedIn',
      header: 'Status',
      render: (datum: StaffMember) => (
        <Box
          background={datum.isClockedIn ? 'status-ok' : 'status-error'}
          pad="xsmall"
          round="small"
        >
          <Text size="small" color="white">
            {datum.isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Text>
        </Box>
      ),
    },
    {
      property: 'lastClockIn',
      header: 'Last Clock In',
      render: (datum: StaffMember) => datum.lastClockIn ? formatDateTime(datum.lastClockIn) : 'N/A',
    },
    {
      property: 'location',
      header: 'Location',
      render: (datum: StaffMember) => datum.location ? datum.location.name : 'N/A',
    },
  ];

  const timeEntryColumns = [
    {
      property: 'clockInTime',
      header: 'Clock In',
      render: (datum: TimeEntry) => formatDateTime(datum.clockInTime),
    },
    {
      property: 'clockOutTime',
      header: 'Clock Out',
      render: (datum: TimeEntry) => datum.clockOutTime ? formatDateTime(datum.clockOutTime) : 'Active',
    },
    {
      property: 'duration',
      header: 'Duration',
      render: (datum: TimeEntry) => datum.duration ? `${datum.duration.toFixed(2)}h` : 'N/A',
    },
    {
      property: 'clockInLocation',
      header: 'Clock In Location',
      render: (datum: TimeEntry) => formatCoordinates(datum.clockInLatitude, datum.clockInLongitude),
    },
    {
      property: 'clockOutLocation',
      header: 'Clock Out Location',
      render: (datum: TimeEntry) => datum.clockOutLatitude && datum.clockOutLongitude ? 
        formatCoordinates(datum.clockOutLatitude, datum.clockOutLongitude) : 'N/A',
    },
    {
      property: 'status',
      header: 'Status',
      render: (datum: TimeEntry) => (
        <Box
          background={datum.isActive ? 'status-ok' : 'status-unknown'}
          pad="xsmall"
          round="small"
        >
          <Text size="small" color="white">
            {datum.isActive ? 'Active' : 'Completed'}
          </Text>
        </Box>
      ),
    },
  ];

  const dailyStatsColumns = [
    {
      property: 'date',
      header: 'Date',
      render: (datum: DailyStats) => formatDate(datum.date),
    },
    {
      property: 'totalHours',
      header: 'Total Hours',
      render: (datum: DailyStats) => `${datum.totalHours}h`,
    },
    {
      property: 'uniqueStaffCount',
      header: 'People Clocked In',
    },
    {
      property: 'avgHoursPerStaff',
      header: 'Avg Hours/Person',
      render: (datum: DailyStats) => `${datum.avgHoursPerStaff}h`,
    },
    {
      property: 'totalShifts',
      header: 'Total Shifts',
    },
  ];

  const staffHoursColumns = [
    {
      property: 'name',
      header: 'Staff Name',
      primary: true,
    },
    {
      property: 'email',
      header: 'Email',
    },
    {
      property: 'totalHours',
      header: 'Total Hours (Last Week)',
      render: (datum: StaffHoursBreakdown) => `${datum.totalHours}h`,
    },
  ];

  if (isLoadingUser) {
    return (
      <Box fill align="center" justify="center">
        <Spinner size="large" />
        <Text margin={{ top: 'medium' }}>Loading...</Text>
      </Box>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <Box fill align="center" justify="center">
        <Text>Loading dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box fill>
      <Box
        background="brand"
        pad={{ horizontal: "medium", vertical: "large" }}
        elevation="medium"
      >
        <Box direction="row" justify="between" align="center">
          <Box>
            <Heading level="2" margin="none" color="white">
              Manager Dashboard
            </Heading>
            {currentUser.location && (
              <Text size="small" color="white" margin={{ top: 'xsmall' }}>
                {currentUser.location.name} - {currentUser.location.address}
              </Text>
            )}
          </Box>
          <Box direction="row" gap="small">
            <Button 
              label="Logout" 
              onClick={handleLogout}
            />
          </Box>
        </Box>
      </Box>

      <Box flex="grow" pad="large">
        {error && (
          <Notification
            toast
            title="Error"
            message={error}
            status="critical"
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Notification
            toast
            title="Success"
            message={success}
            status="normal"
            onClose={() => setSuccess(null)}
          />
        )}

        <Tabs>
          <Tab title="Staff Overview" icon={<User />}>
            <Box gap="large" margin={{ top: 'medium' }}>
              <Box direction="row" justify="between" align="center">
                <Heading level="3" margin="none">
                  Care Workers
                </Heading>
                <Text size="small" color="neutral-2">
                  {staffMembers.length} total care workers
                </Text>
              </Box>

              <Grid columns={['1fr', '1fr']} gap="medium">
                <Card background="light-1" pad="medium">
                  <Box align="center">
                    <Text size="large" weight="bold">
                      {staffMembers.filter(s => s.isClockedIn).length}
                    </Text>
                    <Text size="small">Currently Clocked In</Text>
                  </Box>
                </Card>
                <Card background="light-1" pad="medium">
                  <Box align="center">
                    <Text size="large" weight="bold">
                      {staffMembers.length}
                    </Text>
                    <Text size="small">Total Care Workers</Text>
                  </Box>
                </Card>
              </Grid>

              <Card background="white" elevation="small">
                <DataTable
                  columns={staffColumns}
                  data={staffMembers}
                  step={10}
                  resizeable
                />
              </Card>
            </Box>
          </Tab>

          <Tab title="Time Tracking" icon={<Clock />}>
            <Box gap="large" margin={{ top: 'medium' }}>
              <Box direction="row" justify="between" align="center">
                <Heading level="3" margin="none">
                  Staff Time Tracking
                </Heading>
                <Button
                  icon={<Refresh />}
                  label="Refresh Data"
                  onClick={fetchStaffTimeEntries}
                  disabled={isLoadingTimeEntries}
                />
              </Box>
              
              <Text color="neutral-2">
                Detailed view of staff clock in/out times and locations for the last 7 days.
              </Text>

              {isLoadingTimeEntries ? (
                <Box align="center" gap="medium">
                  <Spinner size="large" />
                  <Text>Loading time entries...</Text>
                </Box>
              ) : staffTimeEntries.length > 0 ? (
                <Accordion>
                  {staffTimeEntries.map((staff) => (
                    <AccordionPanel
                      key={staff.id}
                      label={
                        <Box direction="row" justify="between" align="center" width="100%">
                          <Box>
                            <Text weight="bold">{staff.name}</Text>
                            <Text size="small" color="neutral-2">{staff.email}</Text>
                          </Box>
                          <Box direction="row" gap="medium" align="center">
                            <Box
                              background={staff.isCurrentlyClockedIn ? 'status-ok' : 'status-error'}
                              pad="xsmall"
                              round="small"
                            >
                              <Text size="small" color="white">
                                {staff.isCurrentlyClockedIn ? 'Clocked In' : 'Clocked Out'}
                              </Text>
                            </Box>
                            <Text size="small" color="neutral-2">
                              Total: {staff.totalHours}h
                            </Text>
                          </Box>
                        </Box>
                      }
                    >
                      <Box gap="medium" pad="medium">
                        <Box direction="row" gap="medium" align="center">
                          <Text size="small" color="neutral-2">
                            Role: {staff.role}
                          </Text>
                          <Text size="small" color="neutral-2">
                            Location: {staff.location?.name || 'N/A'}
                          </Text>
                        </Box>
                        
                        {staff.timeEntries.length > 0 ? (
                          <DataTable
                            columns={timeEntryColumns}
                            data={staff.timeEntries}
                            step={10}
                            resizeable
                          />
                        ) : (
                          <Box align="center" pad="medium">
                            <Text color="neutral-2">No time entries found</Text>
                          </Box>
                        )}
                      </Box>
                    </AccordionPanel>
                  ))}
                </Accordion>
              ) : (
                <Card background="light-1" pad="large">
                  <Box align="center" gap="medium">
                    <Clock size="large" color="neutral-3" />
                    <Text size="large" color="neutral-2">
                      No Time Entries Available
                    </Text>
                    <Text size="small" color="neutral-3">
                      Time entries will appear once staff members start clocking in and out.
                    </Text>
                  </Box>
                </Card>
              )}
            </Box>
          </Tab>

          <Tab title="Location Management" icon={<Location />}>
            <Box gap="large" margin={{ top: 'medium' }}>
              <Box direction="row" justify="between" align="center">
                <Heading level="3" margin="none">
                  Assigned Location
                </Heading>
                {currentUser.role === 'ADMIN' && (
                  <Button
                    primary
                    icon={<Add />}
                    label="Add New Location"
                    onClick={openAddForm}
                  />
                )}
              </Box>

              <Text color="neutral-2">
                Your assigned location perimeter where care workers can clock in. Workers must be within the specified radius to clock in.
              </Text>

              {showForm && (
                <Card background="white" elevation="small" pad="large">
                  <Heading level="4" margin={{ bottom: 'medium' }}>
                    {editingLocation ? 'Edit Location' : 'Add New Location'}
                  </Heading>
                  <Form
                    value={formData}
                    onChange={setFormData}
                    onSubmit={({ value }) => handleSubmit(value)}
                    validate="blur"
                  >
                    <Box gap="medium">
                      <FormField
                        name="name"
                        label="Location Name"
                        required
                        validate={[
                          { length: { minimum: 2 }, message: 'Name must be at least 2 characters' }
                        ]}
                      >
                        <TextInput
                          name="name"
                          placeholder="e.g., Main Hospital, Clinic A"
                        />
                      </FormField>

                      <FormField
                        name="address"
                        label="Address"
                        required
                        validate={[
                          { length: { minimum: 5 }, message: 'Address must be at least 5 characters' }
                        ]}
                      >
                        <TextInput
                          name="address"
                          placeholder="Full address of the location"
                        />
                      </FormField>

                      <Grid columns={['1fr', '1fr']} gap="medium">
                        <FormField
                          name="latitude"
                          label="Latitude"
                          required
                          validate={[
                            { regexp: /^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/, message: 'Invalid latitude' }
                          ]}
                        >
                          <TextInput
                            name="latitude"
                            placeholder="e.g., 40.7128"
                            type="number"
                            step="any"
                          />
                        </FormField>

                        <FormField
                          name="longitude"
                          label="Longitude"
                          required
                          validate={[
                            { regexp: /^-?((1[0-7][0-9]|[1-9]?[0-9])(\.[0-9]+)?|180(\.0+)?)$/, message: 'Invalid longitude' }
                          ]}
                        >
                          <TextInput
                            name="longitude"
                            placeholder="e.g., -74.0060"
                            type="number"
                            step="any"
                          />
                        </FormField>
                      </Grid>

                      <FormField
                        name="radius"
                        label="Clock-in Radius (meters)"
                        required
                        help="Distance within which workers can clock in"
                        validate={[
                          { regexp: /^[1-9]\d*$/, message: 'Radius must be a positive number' },
                          { range: { min: 100, max: 10000 }, message: 'Radius must be between 100m and 10km' }
                        ]}
                      >
                        <TextInput
                          name="radius"
                          placeholder="2000"
                          type="number"
                          min="100"
                          max="10000"
                        />
                      </FormField>

                      <Box direction="row" gap="small" justify="end">
                        <Button
                          secondary
                          label="Cancel"
                          onClick={closeForm}
                        />
                        <Button
                          primary
                          type="submit"
                          label={editingLocation ? "Update Location" : "Add Location"}
                          icon={<Location />}
                        />
                      </Box>
                    </Box>
                  </Form>
                </Card>
              )}

              {locations.length === 0 ? (
                <Card background="light-1" pad="large">
                  <Box align="center" gap="medium">
                    <Location size="large" color="neutral-3" />
                    <Text size="large" color="neutral-2">
                      No location assigned
                    </Text>
                    <Text size="small" color="neutral-3">
                      {currentUser.role === 'ADMIN' 
                        ? 'You need to be assigned to a location to manage care workers'
                        : 'Contact your administrator to assign you to a location'
                      }
                    </Text>
                    {currentUser.role === 'ADMIN' && (
                      <Button
                        primary
                        icon={<Add />}
                        label="Add First Location"
                        onClick={openAddForm}
                      />
                    )}
                  </Box>
                </Card>
              ) : (
                <Card background="white" elevation="small">
                  <DataTable
                    columns={locationColumns}
                    data={locations}
                    step={10}
                    resizeable
                  />
                </Card>
              )}
            </Box>
          </Tab>

          <Tab title="Analytics" icon={<Analytics />}>
            <Box gap="large" margin={{ top: 'medium' }}>
              <Box direction="row" justify="between" align="center">
                <Heading level="3" margin="none">
                  Analytics Dashboard
                </Heading>
                <Button
                  icon={<Refresh />}
                  label="Refresh Data"
                  onClick={fetchAnalytics}
                  disabled={isLoadingAnalytics}
                />
              </Box>
              
              <Text color="neutral-2">
                Analytics and reporting for the last 7 days. Track staff hours, attendance, and productivity.
              </Text>

              {isLoadingAnalytics ? (
                <Box align="center" gap="medium">
                  <Spinner size="large" />
                  <Text>Loading analytics...</Text>
                </Box>
              ) : overallStats ? (
                <Box gap="large">
                  {/* Overall Statistics Cards */}
                  <Grid columns={['1fr', '1fr', '1fr', '1fr']} gap="medium">
                    <Card background="light-1" pad="medium">
                      <Box align="center">
                        <Text size="large" weight="bold" color="brand">
                          {overallStats.avgHoursPerDay}h
                        </Text>
                        <Text size="small">Avg Hours/Day</Text>
                      </Box>
                    </Card>
                    <Card background="light-1" pad="medium">
                      <Box align="center">
                        <Text size="large" weight="bold" color="brand">
                          {overallStats.avgPeoplePerDay}
                        </Text>
                        <Text size="small">Avg People/Day</Text>
                      </Box>
                    </Card>
                    <Card background="light-1" pad="medium">
                      <Box align="center">
                        <Text size="large" weight="bold" color="brand">
                          {overallStats.totalHoursLastWeek}h
                        </Text>
                        <Text size="small">Total Hours (Week)</Text>
                      </Box>
                    </Card>
                    <Card background="light-1" pad="medium">
                      <Box align="center">
                        <Text size="large" weight="bold" color="brand">
                          {overallStats.totalShiftsLastWeek}
                        </Text>
                        <Text size="small">Total Shifts (Week)</Text>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Daily Statistics */}
                  <Card background="white" elevation="small">
                    <CardHeader pad="medium">
                      <Heading level="4" margin="none">
                        Daily Statistics (Last 7 Days)
                      </Heading>
                    </CardHeader>
                    <CardBody pad="medium">
                      {dailyStats.length > 0 ? (
                        <DataTable
                          columns={dailyStatsColumns}
                          data={dailyStats}
                          step={10}
                          resizeable
                        />
                      ) : (
                        <Box align="center" pad="large">
                          <Text color="neutral-2">No data available for the last 7 days</Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>

                  {/* Staff Hours Breakdown */}
                  <Card background="white" elevation="small">
                    <CardHeader pad="medium">
                      <Heading level="4" margin="none">
                        Staff Hours Breakdown (Last Week)
                      </Heading>
                    </CardHeader>
                    <CardBody pad="medium">
                      {staffHoursBreakdown.length > 0 ? (
                        <DataTable
                          columns={staffHoursColumns}
                          data={staffHoursBreakdown}
                          step={10}
                          resizeable
                        />
                      ) : (
                        <Box align="center" pad="large">
                          <Text color="neutral-2">No staff hours data available</Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                </Box>
              ) : (
                <Card background="light-1" pad="large">
                  <Box align="center" gap="medium">
                    <Analytics size="large" color="neutral-3" />
                    <Text size="large" color="neutral-2">
                      No Analytics Data Available
                    </Text>
                    <Text size="small" color="neutral-3">
                      Analytics data will appear once staff members start clocking in and out.
                    </Text>
                  </Box>
                </Card>
              )}
            </Box>
          </Tab>
        </Tabs>
      </Box>

      <Box
        background="neutral-4"
        pad="medium"
        justify="center"
      >
        <Text size="small" color="neutral-2">
          © 2024 Healthcare Worker Time Tracking System
        </Text>
      </Box>
    </Box>
  );
}