import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from "expo-location"
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null)
  const [address, setAddress] = useState<string>('')
  const [unsafe, setUnsafe] = useState<boolean>(true)

  const router = useRouter()

  useEffect(() => {
    (async () => {
      setUnsafe(true)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location access is required.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // get address
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })

        if (geo.length > 0) {
          const item = geo[0]
          const addressParts = [
            item.streetNumber,
            item.street,
            item.city,
            item.district,
            item.region,
            item.country,
            item.postalCode
          ].filter(part => part); // Remove null/undefined/empty values

          const fullAddress = addressParts.join(', ');
          setAddress(fullAddress);
          console.log(address)
        }
      } catch (err) {
        console.log("Location error:", err);
      }
    })();
  }, []);


  const sendSOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert("permission required")
        return
      }

      const loc = await Location.getCurrentPositionAsync({})
      const address = await Location.reverseGeocodeAsync(loc.coords)
      const addressObj = address[0];
      const addressStr = [
        addressObj.streetNumber,
        addressObj.street,
        addressObj.city,
        addressObj.region,
        addressObj.country,
        addressObj.postalCode
      ].filter(Boolean).join(', ');

      const payload = {
        userId: user?.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: addressStr,
        createdAt: new Date().toISOString(),

      }
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.252.116:3001';
      await fetch(`${apiUrl}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      Alert.alert("SOS sent", "Your emergency contacts have been notified")
      console.log("payload for api", payload, apiUrl)

    } catch (error) {
      console.log("SOS error", error)
    }
  }


  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Use the correct API URL based on your environment
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.252.116:3001';
      console.log('Fetching from:', `${apiUrl}/reports/mine`);

      const response = await fetch(`${apiUrl}/reports/mine`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      setReports(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);



  if (loading && !reports) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && !reports) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error Loading Reports</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              Welcome, {user?.firstName || 'User'}!
            </Text>
          </View>

          {reports && (
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{reports.user?.email}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Role:</Text>
                <Text style={[styles.value, styles.roleBadge]}>
                  {reports.user?.role?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {reports.user?.firstName} {reports.user?.lastName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>User ID:</Text>
                <Text style={[styles.value, styles.smallText]} numberOfLines={1}>
                  {reports.user?.id}
                </Text>
              </View>

              {reports.message && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ {reports.message}</Text>
                </View>
              )}

              {reports.timestamp && (
                <Text style={styles.timestamp}>
                  Last updated: {new Date(reports.timestamp).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
{/* <TouchableOpacity style={styles.refreshButton} onPress={fetchReports}>
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity> */}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  roleBadge: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 12,
  },
  successBanner: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successText: {
    color: '#155724',
    textAlign: 'center',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});