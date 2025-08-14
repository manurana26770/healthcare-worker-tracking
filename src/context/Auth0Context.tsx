'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  // Database fields
  id: string;
  role: 'CARE_WORKER' | 'MANAGER' | 'ADMIN';
  locationId?: string;
  location?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  auth0Id: string;
}

interface Auth0ContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const Auth0Context = createContext<Auth0ContextType | undefined>(undefined);

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount, but respect logout parameter
  useEffect(() => {
    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const justLoggedOut = urlParams.get('logout') === 'true';
      
      if (justLoggedOut) {
        // Ensure user state is null and clear any cached data
        setUser(null);
        
        // Clear the logout parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('logout');
        newUrl.searchParams.delete('t');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Clear any cached session data
        localStorage.removeItem('auth0_user');
        sessionStorage.removeItem('auth0_user');
        
        setIsLoading(false);
        return;
      }
      
      // Only check session if not just logged out
      checkSession();
    }, 200); // Increased delay to ensure logout processing is complete
    return () => clearTimeout(timer);
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = () => {
    // Clear user state immediately
    setUser(null);
    
    // Clear all possible cookies (though httpOnly cookies won't be affected)
    document.cookie = 'auth0_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth0_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;';
    document.cookie = 'auth0.is.authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth0.state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth0.nonce=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached session data
    localStorage.removeItem('auth0_user');
    sessionStorage.removeItem('auth0_user');
    
    // Call the API route that handles both server-side cookie clearing and Auth0 logout
    window.location.href = '/api/logout';
  };

  return (
    <Auth0Context.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </Auth0Context.Provider>
  );
}

export function useAuth0() {
  const context = useContext(Auth0Context);
  if (!context) {
    throw new Error('useAuth0 must be used within Auth0Provider');
  }
  return context;
}
