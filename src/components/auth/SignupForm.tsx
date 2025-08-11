'use client';

import { useState, useEffect } from 'react';
import { Box, Button, TextInput, Text, Heading, Layer, Select } from 'grommet';
import { UserAdd, Google } from 'grommet-icons';

interface SignupFormProps {
  onClose: () => void;
}

interface Location {
  id: string;
  name: string;
}

export default function SignupForm({ onClose }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    locationId: ''
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available locations
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations/available');
        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations || []);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        window.location.href = '/worker';
      } else {
        const data = await response.json();
        setError(data.message || 'Signup failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/login?connection=google-oauth2&screen_hint=signup';
  };

  return (
    <Layer onEsc={onClose} onClickOutside={onClose}>
      <Box pad="large" width="500px" overflow="auto" height="80vh">
        <Heading level="2" margin={{ bottom: 'medium' }}>
          Create Account
        </Heading>

        {error && (
          <Box background="status-error" pad="small" margin={{ bottom: 'medium' }}>
            <Text color="white">{error}</Text>
          </Box>
        )}

        <form onSubmit={handleEmailSignup}>
          <Box gap="medium">
            <TextInput
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            
            <TextInput
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              type="email"
              required
            />
            
            <TextInput
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              type="password"
              required
            />
            
            <TextInput
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              type="password"
              required
            />

            <Select
              placeholder="Select Role"
              options={[
                { label: 'Care Worker', value: 'CARE_WORKER' },
                { label: 'Manager', value: 'MANAGER' }
              ]}
              value={formData.role}
              onChange={({ value }) => setFormData({...formData, role: value})}
              required
            />

            <Select
              placeholder="Select Location"
              options={Array.isArray(locations) ? locations.map(loc => ({ label: loc.name, value: loc.id })) : []}
              value={formData.locationId}
              onChange={({ value }) => setFormData({...formData, locationId: value})}
              required
            />

            <Button
              type="submit"
              primary
              icon={<UserAdd />}
              label="Sign Up with Email"
              disabled={isLoading}
            />
          </Box>
        </form>

        <Box margin={{ top: 'large' }}>
          <Text textAlign="center" margin={{ bottom: 'medium' }}>
            OR
          </Text>
          
          <Button
            secondary
            icon={<Google />}
            label="Sign Up with Google"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          />
        </Box>

        <Box margin={{ top: 'medium' }}>
          <Button
            plain
            label="Already have an account? Sign in"
            onClick={() => {
              onClose();
              window.location.href = '/login';
            }}
          />
        </Box>
      </Box>
    </Layer>
  );
}
