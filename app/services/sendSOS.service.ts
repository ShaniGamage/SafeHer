import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface SOSPayload {
    userId: string;
    latitude: number;
    longitude: number;
    address: string;
    createdAt: string;
}
const apiUrl = process.env.EXPO_PUBLIC_API_URL


export const sendSOS = async (
    userId: string ,
    token: string,): Promise<{ success: boolean; error?: string }> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Location access is required');
            return { success: false, error: 'Permission denied' };
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({});

        // Get address from coordinates
        const addressData = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        const addressObj = addressData[0];
        const address = [
            addressObj.streetNumber,
            addressObj.street,
            addressObj.city,
            addressObj.region,
            addressObj.country,
            addressObj.postalCode,
        ]
            .filter(Boolean)
            .join(', ');

        // Prepare payload
        const payload: SOSPayload = {
            userId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address,
            createdAt: new Date().toISOString(),
        };

        // Send to API
        const response = await fetch(`${apiUrl}/sos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, 
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        Alert.alert('SOS Sent', 'Your emergency contacts have been notified');
        return { success: true };
    } catch (error: any) {
        console.error('SOS error:', error);
        Alert.alert('Error', 'Failed to send SOS. Please try again.');
        return { success: false, error: error.message };
    }
};
