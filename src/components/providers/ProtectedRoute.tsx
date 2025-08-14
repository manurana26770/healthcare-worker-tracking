'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Heading, Text, Button } from 'grommet';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['CARE_WORKER', 'MANAGER'], 
  fallbackPath = '/' 
}: ProtectedRouteProps) {
  const { user, isLoading, getUserRole, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(fallbackPath);
    }
  }, [user, isLoading, router, fallbackPath]);

  if (isLoading) {
    return (
      <Box align="center" justify="center" fill>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box align="center" justify="center" fill gap="medium">
        <Heading level="2">Authentication Required</Heading>
        <Text>Please sign in to access this page.</Text>
        <Button primary label="Sign In" onClick={login} />
      </Box>
    );
  }

  const userRole = getUserRole();
  if (!allowedRoles.includes(userRole)) {
    return (
      <Box align="center" justify="center" fill gap="medium">
        <Heading level="2">Access Denied</Heading>
        <Text>You don&apos;t have permission to access this page.</Text>
        <Button 
          label="Go Back" 
          onClick={() => router.back()} 
        />
      </Box>
    );
  }

  return <>{children}</>;
}