'use client';

import { useState, useEffect, useCallback } from 'react';
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
  FormField,
  TextInput,
  Notification,
  Main,
  Header,
  Footer,
  Spinner,
  Clock
} from 'grommet';
import {
  StatusGood,
  StatusCritical,
  User, 
  Checkmark, 
  Location, 
  Clock as ClockIcon,
  MapLocation,
  FormNext,
  FormPrevious
} from 'grommet-icons';

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
    latitude: number;
    longitude: number;
    radius: number;
  };
}

interface TimeEntry {
  id: string;
  clockInTime: string;
  clockOutTime?: string;
  note?: string;
  shiftId: string;
}

interface CurrentShift {
  id: string;
  startTime: string;
  endTime?: string;
  timeEntries: TimeEntry[];
}

export default function WorkerPage() {
  const router = useRouter();
  const { logout } = useAuth0();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [showClockInForm, setShowClockInForm] = useState(false);
  const [showClockOutForm, setShowClockOutForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isWithinPerimeter, setIsWithinPerimeter] = useState<boolean | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [clockInNote, setClockInNote] = useState('');
  const [clockOutNote, setClockOutNote] = useState('');

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
  }, []);

  // Fetch data when user is loaded
  useEffect(() => {
    if (currentUser && currentUser.role === 'CARE_WORKER') {
      fetchCurrentShift();
    }
  }, [currentUser]);

  // Check location when user location changes
  useEffect(() => {
    if (userLocation && currentUser?.location) {
      checkLocationWithinPerimeter();
    }
  }, [userLocation, currentUser]);

  const checkUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        // Redirect managers to manager page immediately
        if (data.user.role === 'MANAGER') {
          router.push('/manager');
          return;
        }
        
        // Only care workers can access worker dashboard
        if (data.user.role !== 'CARE_WORKER') {
          window.location.href = '/';
          return;
        }
        
        // Only set currentUser if they are a care worker
        setCurrentUser(data.user);
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

  const fetchCurrentShift = async () => {
    if (!currentUser || currentUser.role !== 'CARE_WORKER') return;
    
    try {
      const response = await fetch(`/api/shifts/current?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.currentShift);
      } else {
        console.error('Failed to fetch current shift:', response.status, response.statusText);
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
      setCurrentShift(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setIsGettingLocation(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setIsGettingLocation(false);
          resolve({ latitude, longitude });
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const checkLocationWithinPerimeter = () => {
    if (!userLocation || !currentUser?.location) {
      return;
    }

    const { latitude: userLat, longitude: userLng } = userLocation;
    const { latitude: locationLat, longitude: locationLng, radius } = currentUser.location;

    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (locationLat * Math.PI) / 180;
    const Δφ = ((locationLat - userLat) * Math.PI) / 180;
    const Δλ = ((locationLng - userLng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    const withinPerimeter = distance <= radius;
    
    setIsWithinPerimeter(withinPerimeter);
    
    if (!withinPerimeter) {
      setError(`You are ${Math.round(distance)}m away from your assigned location. You must be within ${radius}m to clock in.`);
    } else {
      setError(null);
    }
  };

  const handleClockIn = async () => {
    if (!currentUser) return;

    try {
      setIsClockingIn(true);
      setError(null);

      // Get current location
      const location = await getCurrentLocation();
      
      // Check if within perimeter
      if (!isWithinPerimeter) {
        setError('You must be within the facility perimeter to clock in.');
        return;
      }

      const response = await fetch('/api/time-entries/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,  // ADDED: Include the user ID
          note: clockInNote,
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to clock in');
      }

      setSuccess('Successfully clocked in!');
      setClockInNote('');
      setShowClockInForm(false);
      fetchCurrentShift(); // Refresh shift data

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while clocking in');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser) return;

    try {
      setIsClockingOut(true);
      setError(null);

      const response = await fetch('/api/time-entries/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,  // ADDED: Include the user ID
          note: clockOutNote
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to clock out');
      }

      setSuccess('Successfully clocked out!');
      setClockOutNote('');
      setShowClockOutForm(false);
      fetchCurrentShift(); // Refresh shift data

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while clocking out');
    } finally {
      setIsClockingOut(false);
    }
  };

  const handleLogout = () => {
    // Use the Auth0Context logout function
    logout();
  };

  const getCurrentTimeEntry = () => {
    if (!currentShift?.timeEntries) return null;
    return currentShift.timeEntries.find(entry => !entry.clockOutTime);
  };

  const isCurrentlyClockedIn = !!getCurrentTimeEntry();

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
      <Header
        background="brand"
        pad="medium"
        elevation="medium"
      >
        <Heading level="2" margin="none" color="white">
          Worker Dashboard
        </Heading>
        <Box direction="row" gap="small">
          <Button 
            label="Logout" 
            onClick={handleLogout}
          />
        </Box>
      </Header>

      <Main pad="large" flex="grow">
        <Box align="center" gap="large">
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

          {locationError && (
            <Notification
              toast
              title="Location Error"
              message={locationError}
              status="warning"
              onClose={() => setLocationError(null)}
            />
          )}

          {/* User Info */}
          <Card background="white" elevation="medium" width="600px" height={{ min: "200px" }}>
            <CardHeader pad="medium">
              <Box direction="row" align="center" gap="medium">
                <User size="medium" />
                <Box>
                  <Heading level="3" margin="none">
                    Welcome, {currentUser.name}
                  </Heading>
                  <Text size="small" color="neutral-2">
                    {currentUser.email}
                  </Text>
                </Box>
              </Box>
            </CardHeader>
            <CardBody pad="medium">
              {currentUser.location && (
                <Box direction="row" align="center" gap="small">
                  <Location size="small" />
                  <Text>
                    <strong>Assigned Location:</strong> {currentUser.location.name}
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>

          {/* Location Status */}
          <Card background="white" elevation="medium" width="600px" height={{ min: "300px", max: "500px" }}>
            <CardHeader pad="medium">
              <Box direction="row" align="center" gap="medium">
                <MapLocation size="medium" />
                <Heading level="4" margin="none">
                  Location Status
                </Heading>
              </Box>
            </CardHeader>
            <CardBody pad="medium" overflow="auto">
              <Box gap="medium">
                <Box direction="row" justify="between" align="center">
                  <Text>Current Location:</Text>
                  <Button
                    size="small"
                    label={isGettingLocation ? "Getting Location..." : "Check Location"}
                    icon={isGettingLocation ? <Spinner size="small" /> : <Location />}
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                  />
                </Box>
                
                {userLocation && (
                  <Box gap="small">
                    <Text size="small">
                      <strong>Your Coordinates:</strong> {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                    </Text>
                    {isWithinPerimeter !== null && (
                      <Box direction="row" align="center" gap="small">
                        {isWithinPerimeter ? (
                          <>
                            <StatusGood size="small" color="status-ok" />
                            <Text size="small" color="status-ok">
                              Within facility perimeter
                            </Text>
                          </>
                        ) : (
                          <>
                            <StatusCritical size="small" color="status-error" />
                            <Text size="small" color="status-error">
                              Outside facility perimeter
                            </Text>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Clock In/Out Status */}
          <Card background="white" elevation="medium" width="600px" height={{ min: "350px", max: "500px" }}>
            <CardHeader pad="medium">
              <Box direction="row" align="center" gap="medium">
                <ClockIcon size="medium" />
                <Heading level="4" margin="none">
                  Time Tracking
                </Heading>
              </Box>
            </CardHeader>
            <CardBody pad="medium" overflow="auto">
              <Box gap="large">
                {/* Current Status */}
                <Box align="center" gap="medium">
                  <Box
                    background={isCurrentlyClockedIn ? 'status-ok' : 'status-error'}
                    pad="medium"
                    round="large"
                    align="center"
                  >
                    <Clock size="large" color="white" />
                    <Text size="large" color="white" weight="bold">
                      {isCurrentlyClockedIn ? 'CLOCKED IN' : 'CLOCKED OUT'}
                    </Text>
                  </Box>
                  
                  {isCurrentlyClockedIn && getCurrentTimeEntry() && (
                    <Text size="small" color="neutral-2">
                      Clocked in at: {new Date(getCurrentTimeEntry()!.clockInTime).toLocaleString()}
                    </Text>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box gap="medium">
                  {!isCurrentlyClockedIn ? (
                    <Button
                      primary
                      size="large"
                      label="Clock In"
                      icon={<FormNext />}
                      onClick={() => setShowClockInForm(true)}
                      disabled={isWithinPerimeter === false}
                    />
                  ) : (
                    <Button
                      secondary
                      size="large"
                      label="Clock Out"
                      icon={<FormPrevious />}
                      onClick={() => setShowClockOutForm(true)}
                    />
                  )}
                </Box>
              </Box>
            </CardBody>
          </Card>

          {/* Clock In Form */}
          {showClockInForm && (
            <Card background="white" elevation="medium" width="600px" height={{ min: "250px" }}>
              <CardHeader pad="medium">
                <Heading level="4" margin="none">
                  Clock In
                </Heading>
              </CardHeader>
              <CardBody pad="medium">
                <Box gap="medium">
                  <FormField
                    name="note"
                    label="Note (Optional)"
                    help="Add any notes about your shift start"
                  >
                    <TextInput
                      name="note"
                      placeholder="e.g., Starting morning shift, feeling good"
                      value={clockInNote}
                      onChange={(e) => setClockInNote(e.target.value)}
                    />
                  </FormField>
                  
                  <Box direction="row" gap="small" justify="end">
                    <Button
                      secondary
                      label="Cancel"
                      onClick={() => {
                        setShowClockInForm(false);
                        setClockInNote('');
                      }}
                    />
                    <Button
                      primary
                      label={isClockingIn ? "Clocking In..." : "Clock In"}
                      icon={isClockingIn ? <Spinner size="small" /> : <Checkmark />}
                      onClick={handleClockIn}
                      disabled={isClockingIn}
                    />
                  </Box>
                </Box>
              </CardBody>
            </Card>
          )}

          {/* Clock Out Form */}
          {showClockOutForm && (
            <Card background="white" elevation="medium" width="600px" height={{ min: "250px" }}>
              <CardHeader pad="medium">
                <Heading level="4" margin="none">
                  Clock Out
                </Heading>
              </CardHeader>
              <CardBody pad="medium">
                <Box gap="medium">
                  <FormField
                    name="note"
                    label="Note (Optional)"
                    help="Add any notes about your shift end"
                  >
                    <TextInput
                      name="note"
                      placeholder="e.g., Completed all tasks, shift went well"
                      value={clockOutNote}
                      onChange={(e) => setClockOutNote(e.target.value)}
                    />
                  </FormField>
                  
                  <Box direction="row" gap="small" justify="end">
                    <Button
                      secondary
                      label="Cancel"
                      onClick={() => {
                        setShowClockOutForm(false);
                        setClockOutNote('');
                      }}
                    />
                    <Button
                      primary
                      label={isClockingOut ? "Clocking Out..." : "Clock Out"}
                      icon={isClockingOut ? <Spinner size="small" /> : <Checkmark />}
                      onClick={handleClockOut}
                      disabled={isClockingOut}
                    />
                  </Box>
                </Box>
              </CardBody>
            </Card>
          )}
        </Box>
      </Main>

      <Footer
        background="neutral-4"
        pad="medium"
        justify="center"
      >
        <Text size="small" color="neutral-2">
          © 2024 Healthcare Worker Time Tracking System
        </Text>
      </Footer>
    </Box>
  );
}