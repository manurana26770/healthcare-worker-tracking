'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  name: string;
  email: string;
  user_metadata: {
    role: string;
  };
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implement real authentication check
    // For now, no user is logged in
    setIsLoading(false);
  }, []);

  const login = () => {
    // TODO: Implement real Auth0 login
    console.log('Login not implemented');
  };

  const logout = () => {
    setUser(null);
    // TODO: Implement real Auth0 logout
    console.log('Logout not implemented');
  };

  const getUserRole = () => {
    return user?.user_metadata?.role || 'CARE_WORKER';
  };

  const isManager = () => getUserRole() === 'MANAGER';
  const isCareWorker = () => getUserRole() === 'CARE_WORKER';

  return {
    user,
    error,
    isLoading,
    login,
    logout,
    getUserRole,
    isManager,
    isCareWorker,
  };
}