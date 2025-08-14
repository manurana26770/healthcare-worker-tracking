import { useState, useEffect } from 'react';
import { getDistance, isPointWithinRadius } from 'geolib';

interface Location {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  location: Location | null;
  permission: 'granted' | 'denied' | 'prompt';
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    permission: 'prompt',
    loading: false,
    error: null,
  });

  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setState(prev => ({ ...prev, error, permission: 'denied' }));
        reject(new Error(error));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setState({
            location,
            permission: 'granted',
            loading: false,
            error: null,
          });
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          const errorMessage = error.message || 'Failed to get location';
          setState({
            location: null,
            permission: 'denied',
            loading: false,
            error: errorMessage,
          });
          reject(error);
        },
        options
      );
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!navigator.permissions) {
      // Fallback for browsers that don't support permissions API
      try {
        await getCurrentLocation();
        return true;
      } catch {
        return false;
      }
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setState(prev => ({ ...prev, permission: result.state }));
      
      if (result.state === 'granted') {
        await getCurrentLocation();
        return true;
      } else if (result.state === 'prompt') {
        // Try to get location which will trigger the permission prompt
        try {
          await getCurrentLocation();
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  // Calculate distance between two points using geolib
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
  };

  // Check if user is within a specific location's radius using geolib
  const isWithinRadius = (targetLat: number, targetLon: number, radius: number): boolean => {
    if (!state.location) return false;
    
    return isPointWithinRadius(
      { latitude: state.location.latitude, longitude: state.location.longitude },
      { latitude: targetLat, longitude: targetLon },
      radius
    );
  };

  // Get distance to a specific location
  const getDistanceToLocation = (targetLat: number, targetLon: number): number | null => {
    if (!state.location) return null;
    
    return calculateDistance(
      state.location.latitude,
      state.location.longitude,
      targetLat,
      targetLon
    );
  };

  // Check proximity to multiple locations and return the closest one within radius
  const findNearestLocationWithinRadius = (
    locations: Array<{ latitude: number; longitude: number; radius: number; id: string; name: string }>
  ): { location: Record<string, unknown>; distance: number } | null => {
    if (!state.location) return null;

    let nearestLocation = null;
    let shortestDistance = Infinity;

    for (const location of locations) {
      const distance = calculateDistance(
        state.location.latitude,
        state.location.longitude,
        location.latitude,
        location.longitude
      );

      if (distance <= location.radius && distance < shortestDistance) {
        shortestDistance = distance;
        nearestLocation = location;
      }
    }

    return nearestLocation ? { location: nearestLocation, distance: shortestDistance } : null;
  };

  // Initialize geolocation on mount
  useEffect(() => {
    requestPermission().catch(console.error);
  }, []);

  return {
    ...state,
    getCurrentLocation,
    requestPermission,
    calculateDistance,
    isWithinRadius,
    getDistanceToLocation,
    findNearestLocationWithinRadius,
  };
} 