'use client';

import { useState } from 'react';
import { Box, Button, TextInput, Text, Heading, Layer } from 'grommet';
import { Login, Google } from 'grommet-icons';

interface LoginFormProps {
  onClose: () => void;
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        window.location.href = '/worker';
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/login?connection=google-oauth2';
  };

  return (
    <Layer onEsc={onClose} onClickOutside={onClose}>
      <Box pad="large" width="400px">
        <Heading level="2" margin={{ bottom: 'medium' }}>
          Sign In
        </Heading>

        {error && (
          <Box background="status-error" pad="small" margin={{ bottom: 'medium' }}>
            <Text color="white">{error}</Text>
          </Box>
        )}

        <form onSubmit={handleEmailLogin}>
          <Box gap="medium">
            <TextInput
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            
            <TextInput
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />

            <Button
              type="submit"
              primary
              icon={<Login />}
              label="Sign In with Email"
              disabled={isLoading}
            />
          </Box>
        </form>

        <Box margin={{ top: 'medium' }}>
          <Text textAlign="center" margin={{ bottom: 'small' }}>
            OR
          </Text>
          
          <Button
            secondary
            icon={<Google />}
            label="Sign In with Google"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          />
        </Box>

        <Box margin={{ top: 'medium' }}>
          <Button
            plain
            label="Don't have an account? Sign up"
            onClick={() => {
              onClose();
              window.location.href = '/signup';
            }}
          />
        </Box>
      </Box>
    </Layer>
  );
}
