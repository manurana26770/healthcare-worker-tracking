'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, Main, Header, Footer, Select, FormField, Form } from 'grommet';
import { User, MapLocation } from 'grommet-icons';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface OnboardingData {
  role: 'CARE_WORKER' | 'MANAGER' | 'ADMIN';
  locationId: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    role: 'CARE_WORKER',
    locationId: ''
  });

  // Fetch available locations
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (value: any) => {
    setIsSubmitting(true);
    try {
      console.log('Form value received:', value);
      
      // Extract the actual values from the select options
      const onboardingData = {
        role: typeof value.role === 'object' ? value.role.value : value.role,
        locationId: typeof value.locationId === 'object' ? value.locationId.value : value.locationId
      };
      
      console.log('Processed onboarding data:', onboardingData);
      
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Onboarding successful:', result);
        
        // Redirect based on role
        switch (onboardingData.role) {
          case 'CARE_WORKER':
            router.push('/worker');
            break;
          case 'MANAGER':
          case 'ADMIN':
            router.push('/manager');
            break;
        }
      } else {
        const errorData = await response.json();
        console.error('Onboarding failed:', errorData);
        alert(`Onboarding failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Onboarding failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box fill align="center" justify="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box fill>
      <Header background="brand" pad="medium">
        <Heading level="2" margin="none" color="white">Complete Your Profile</Heading>
      </Header>

      <Main flex="grow" pad="large">
        <Box align="center" justify="center" height="100%" gap="medium">
          <Heading level="1">Welcome! Let&apos;s set up your profile</Heading>
          <Text size="large" textAlign="center">
            Please select your role and location to complete your setup
          </Text>

          <Box width="medium" gap="medium">
            <Form
              value={formData}
              onChange={setFormData}
              onSubmit={({ value }) => handleSubmit(value)}
            >
              <FormField
                name="role"
                label="What's your role?"
                required
              >
                <Select
                  name="role"
                  options={[
                    { label: 'Care Worker', value: 'CARE_WORKER' },
                    { label: 'Manager', value: 'MANAGER' },
                    { label: 'Admin', value: 'ADMIN' }
                  ]}
                  placeholder="Select your role"
                />
              </FormField>

              <FormField
                name="locationId"
                label="Which location do you work at?"
                required
              >
                <Select
                  name="locationId"
                  options={locations.map(location => ({
                    label: location.name,
                    value: location.id
                  }))}
                  placeholder="Select your location"
                />
              </FormField>

              <Box direction="row" gap="medium" justify="center">
                <Button
                  primary
                  type="submit"
                  label="Complete Setup"
                  icon={<User />}
                  disabled={isSubmitting || !formData.role || !formData.locationId}
                />
              </Box>
            </Form>
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


