'use client';

import { Box, Button, Heading, Text, Main, Header, Footer } from 'grommet';
import { Login, Logout, User, Add } from 'grommet-icons';

import { useEffect, useState } from 'react';
import { useAuth0 } from '@/context/Auth0Context';

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

export default function HomePage() {
  const { isLoading, logout } = useAuth0();
  const [localUser, setLocalUser] = useState<User | null>(null);

  // Update local user when Auth0 user changes
  // useEffect(() => {
  //   setLocalUser(user);
  // }, [user]);

  // Handle logout parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const logoutParam = urlParams.get('logout');
    
    if (logoutParam === 'true') {
      console.log('Logout parameter detected, clearing client state...');
      // Clear any client-side state
      setLocalUser(null);
      
      // Clear any localStorage/sessionStorage that might contain auth data
      localStorage.removeItem('auth0.is.authenticated');
      sessionStorage.removeItem('auth0.is.authenticated');
      
      // Clear the logout parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('logout');
      newUrl.searchParams.delete('t');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);



  // Redirect authenticated users to appropriate dashboard based on role
  useEffect(() => {
    // Check if user just logged out (don't redirect in this case)
    const urlParams = new URLSearchParams(window.location.search);
    const justLoggedOut = urlParams.get('logout') === 'true';
    
    if (justLoggedOut) {
      console.log('User just logged out, not redirecting');
      // Clear the logout parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('logout');
      newUrl.searchParams.delete('t');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }
    
    // Only redirect if we have a user and we're not loading
    if (localUser && !isLoading) {
      console.log('User authenticated, checking profile completion:', localUser);
      
      // Check if user has complete profile
      if (!localUser.role || !localUser.locationId) {
        console.log('Incomplete profile, redirecting to onboarding');
        window.location.href = '/onboarding';
        return;
      }
      
      // Redirect based on user role
      switch (localUser.role) {
        case 'CARE_WORKER':
          window.location.href = '/worker';
          break;
        case 'MANAGER':
        case 'ADMIN':
          window.location.href = '/manager';
          break;
        default:
          window.location.href = '/onboarding';
      }
    }
  }, [localUser, isLoading]);

  const handleLogout = () => {
    // Use the Auth0Context logout function
    logout();
  };

  if (isLoading) {
    return (
      <Box fill align="center" justify="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (localUser) {
    // Check if user has complete profile
    if (!localUser.role || !localUser.locationId) {
      return (
        <Box fill>
          <Header background="brand" pad="medium">
            <Heading level="2" margin="none" color="white">Healthcare Time Tracking</Heading>
            <Box direction="row" gap="small" align="center">
              <Text color="white">Welcome, {localUser.name || localUser.email}</Text>
              <Button
                icon={<Logout />}
                label="Logout"
                onClick={handleLogout}
                size="small"
              />
            </Box>
          </Header>

          <Main flex="grow" pad="large">
            <Box align="center" justify="center" height="100%" gap="medium">
              <Heading level="1">Welcome, {localUser.name || localUser.email}!</Heading>
              <Text size="large" textAlign="center">
                Please complete your profile setup to continue
              </Text>

              <Box direction="row" gap="medium">
                <Button
                  primary
                  icon={<User />}
                  label="Complete Profile Setup"
                  onClick={() => window.location.href = '/onboarding'}
                />
                <Button
                  icon={<Logout />}
                  label="Logout"
                  onClick={handleLogout}
                />
              </Box>
            </Box>
          </Main>

          <Footer background="neutral-2" pad="medium">
            <Text textAlign="center" size="small">
              © 2024 Healthcare Time Tracking System
            </Text>
          </Footer>
        </Box>
      );
    }

    // User has complete profile - this should not be reached due to redirects above
    return (
      <Box fill>
        <Header background="brand" pad="medium">
          <Heading level="2" margin="none" color="white">Healthcare Time Tracking</Heading>
          <Box direction="row" gap="small" align="center">
            <Text color="white">Welcome, {localUser.name || localUser.email}</Text>
            <Button
              icon={<Logout />}
              label="Logout"
              onClick={handleLogout}
              size="small"
            />
          </Box>
        </Header>

        <Main flex="grow" pad="large">
          <Box align="center" justify="center" height="100%" gap="medium">
            <Heading level="1">Welcome to Healthcare Time Tracking</Heading>
            <Text size="large" textAlign="center">
              A comprehensive time tracking system for healthcare workers
            </Text>

            <Box direction="row" gap="medium">
              <Button
                primary
                icon={<User />}
                label="Go to Dashboard"
                onClick={() => {
                  switch (localUser.role) {
                    case 'CARE_WORKER':
                      window.location.href = '/worker';
                      break;
                    case 'MANAGER':
                    case 'ADMIN':
                      window.location.href = '/manager';
                      break;
                    default:
                      window.location.href = '/onboarding';
                  }
                }}
              />
              <Button
                icon={<Logout />}
                label="Logout"
                onClick={handleLogout}
              />
            </Box>
          </Box>
        </Main>

        <Footer background="neutral-2" pad="medium">
          <Text textAlign="center" size="small">
            © 2024 Healthcare Time Tracking System
          </Text>
        </Footer>
      </Box>
    );
  }

  // No user logged in - show login page
  return (
    <Box fill>
      <Header background="brand" pad="medium">
        <Heading level="2" margin="none" color="white">Healthcare Time Tracking</Heading>
      </Header>

      <Main flex="grow" pad="large">
        <Box align="center" justify="center" height="100%" gap="large">
          <Box align="center" gap="medium">
            <Heading level="1">Welcome to Healthcare Time Tracking</Heading>
            <Text size="large" textAlign="center">
              A comprehensive time tracking system for healthcare workers
            </Text>
          </Box>

          <Box direction="row" gap="medium">
            <Button
              primary
              icon={<Login />}
              label="Login"
              onClick={() => window.location.href = '/api/auth/login'}
            />
            <Button
              icon={<Add />}
              label="Sign Up"
              onClick={() => window.location.href = '/api/auth/signup'}
            />
          </Box>
        </Box>
      </Main>

      <Footer background="neutral-2" pad="medium">
        <Text textAlign="center" size="small">
          © 2024 Healthcare Time Tracking System
        </Text>
      </Footer>
    </Box>
  );
}
