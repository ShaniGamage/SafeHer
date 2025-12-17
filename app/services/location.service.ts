import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { LocationCoords } from '../interface/location';

export class LocationService {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is required.');
      return false;
    }
    return true;
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return null;

    return await Location.getCurrentPositionAsync({});
  }

  async getAddressFromCoords(coords: LocationCoords): Promise<string> {
    const addresses = await Location.reverseGeocodeAsync(coords);
    
    if (addresses.length === 0) return 'Unknown location';

    const addr = addresses[0];
    return [
      addr.streetNumber,
      addr.street,
      addr.city,
      addr.district,
      addr.region,
      addr.country,
      addr.postalCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  calculateBounds(coords: LocationCoords, delta: number = 0.05) {
    return {
      minLat: coords.latitude - delta / 2,
      maxLat: coords.latitude + delta / 2,
      minLng: coords.longitude - delta / 2,
      maxLng: coords.longitude + delta / 2,
    };
  }
}

export const locationService = new LocationService();