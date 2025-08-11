'use client';

import { Box, Button, Heading, Text, Main, Header, Footer } from 'grommet';
import { Login, Logout } from 'grommet-icons';
import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <Box fill>
      <Header background="brand" pad="medium">
        <Heading level="2" margin="none">Healthcare Time Tracking</Heading>
      </Header>

      <Main flex="grow" pad="large">
        <Box align="center" justify="center" height="100%" gap="medium">
          <Heading level="1">Welcome to Healthcare Time Tracking</Heading>
          <Text size="large" textAlign="center">
            A comprehensive time tracking system for healthcare workers with location-based clock-in/clock-out
          </Text>

          <Box direction="row" gap="medium">
            <Button
              primary
              icon={<Login />}
              label="Sign In"
              onClick={() => setShowLogin(true)}
            />
            <Button
              secondary
              label="Sign Up"
              onClick={() => setShowSignup(true)}
            />
          </Box>
        </Box>
      </Main>

      <Footer background="neutral-2" pad="medium">
        <Text textAlign="center" size="small">
          © 2024 Healthcare Time Tracking System
        </Text>
      </Footer>

      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
      {showSignup && <SignupForm onClose={() => setShowSignup(false)} />}
    </Box>
  );
}
