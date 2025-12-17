import { useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface SOSPayload {
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
}

interface UseSOSReturn {
  sendSOS: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useSOS = (
  apiUrl: string | undefined,
  userId?: string
): UseSOSReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendSOS = useCallback(async () => { //doesn’t get recreated on every render
    if (!apiUrl) {
      Alert.alert('Configuration Error', 'API URL is not configured');
      return;
    }

    if (!userId) {
      Alert.alert('Authentication Error', 'Please sign in to send SOS');
      return;
    }

    if (loading) {
      console.log('SOS already in progress');
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel any pervious request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location access is needed to send SOS alerts to your emergency contacts'
        );
        return;
      }

      // Get current location with timeout
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Build address string
      const addressParts = geo[0]
        ? [
            geo[0].streetNumber,
            geo[0].street,
            geo[0].city,
            geo[0].district,
            geo[0].region,
            geo[0].country,
            geo[0].postalCode,
          ].filter(Boolean)
        : [];

      const address = addressParts.length > 0 
        ? addressParts.join(', ')
        : 'Address unavailable';

      // Prepare payload
      const payload: SOSPayload = {
        userId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address,
        createdAt: new Date().toISOString(),
      };

      // Send SOS request
      const response = await fetch(`${apiUrl}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send SOS: ${response.status} ${errorText}`
        );
      }

      // Success
      Alert.alert(
        'SOS Sent Successfully',
        'Your emergency contacts have been notified with your location',
        [{ text: 'OK' }]
      );

    } catch (err) {
      // Handle abort
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('SOS request was cancelled');
        return;
      }

      // Handle other errors
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unknown error occurred';
      
      setError(errorMessage);
      console.error('SOS error:', err);

      Alert.alert(
        'Failed to Send SOS',
        'Unable to send emergency alert. Please try again or contact emergency services directly.',
        [
          { text: 'Retry', onPress: sendSOS },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [apiUrl, userId, loading]);

  

  return { sendSOS, loading, error };
};