import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image
} from 'react-native';
import * as Location from "expo-location"
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

const apiUrl = process.env.EXPO_PUBLIC_API_URL

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null)
  const [address, setAddress] = useState<string>('')
  const [unsafe, setUnsafe] = useState<boolean>(false)
  const [sosCount, setSosCount] = useState<number>(0)
  const [harassmentCount, setHarassmentCount] = useState<number>(0)
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [vehicleNo, setVehicleNo] = useState<string>('')
  const [harassmentReports, setHarassmentReports] = useState<any>(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const router = useRouter()

  useEffect(() => {
    (async () => {
      setUnsafe(true)
      setLoadingCounts(true)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location access is required.");
          setLoadingCounts(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // Update region with current location
        const currentRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(currentRegion);

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
          ].filter(part => part);
          const fullAddress = addressParts.join(', ');
          setAddress(fullAddress);
          console.log('Address:', fullAddress)
        }

        // Calculate bounds around current location
        const bounds = {
          minLat: currentRegion.latitude - currentRegion.latitudeDelta / 2,
          maxLat: currentRegion.latitude + currentRegion.latitudeDelta / 2,
          minLng: currentRegion.longitude - currentRegion.longitudeDelta / 2,
          maxLng: currentRegion.longitude + currentRegion.longitudeDelta / 2,
        };

        console.log('Fetching heatmap with bounds:', bounds);

        // Fetch heatmap data to get counts - USE POST METHOD
        const response = await fetch(`${apiUrl}/safe-route/heatmap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bounds),
        });

        console.log('Heatmap response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Heatmap data received:", data);

          // Calculate total counts from features
          if (data.features && data.features.length > 0) {
            // Get the first feature's counts (they're the same across all features)
            const firstFeature = data.features[0];
            if (firstFeature.properties) {
              const totalSos = firstFeature.properties.sosCount || 0;
              const totalHarassment = firstFeature.properties.harassmentCount || 0;

              console.log('SOS Count:', totalSos, 'Harassment Count:', totalHarassment);
              setSosCount(totalSos);
              setHarassmentCount(totalHarassment);

              // Determine if area is unsafe (using stats total)
              const totalIncidents = data.stats?.totalIncidents || 0;
              setUnsafe(totalIncidents > 5);
            }
          } else {
            // No incidents in area - safe zone
            console.log('No incidents - safe area');
            setSosCount(0);
            setHarassmentCount(0);
            setUnsafe(false);
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch heatmap data:', response.status, errorText);
          Alert.alert('Error', 'Failed to load safety data');
        }
      } catch (err) {
        console.error("Location/Heatmap error:", err);
        Alert.alert('Error', 'Failed to get location data');
      } finally {
        setLoadingCounts(false);
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

  const getReportsByVehicleNo = async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter a vehicle number');
      return;
    }

    try {
      setSearchingVehicle(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${apiUrl}/report-harassment?vehicleNo=${encodeURIComponent(vehicleNumber)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Vehicle reports received:', data);
      setHarassmentReports(data);

      // Show results summary
      if (data && data.length > 0) {
        Alert.alert(
          'Reports Found',
          `Found ${data.length} report(s) for vehicle ${vehicleNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Reports',
          `No reports found for vehicle ${vehicleNumber}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setSearchingVehicle(false);
    }
  }

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
    <LinearGradient
      colors={['#4A0E4E', 'black', 'black']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome, {user?.firstName || 'User'}!
          </Text>
        </View>

        <View style={styles.address}>
          <Text style={styles.addressTxt}>
            <FontAwesome5 name="map-marker-alt" size={20} color="white" /> {address}
          </Text>
        </View>

        {/* Safety Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Area Safety Report</Text>
          {loadingCounts ? (
            <ActivityIndicator size="small" color="#FF1493" />
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome5 name="bell" size={30} color="#FF4444" />
                <Text style={styles.statNumber}>{sosCount}</Text>
                <Text style={styles.statLabel}>SOS Alerts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <FontAwesome5 name="exclamation-triangle" size={30} color="#FF9800" />
                <Text style={styles.statNumber}>{harassmentCount}</Text>
                <Text style={styles.statLabel}>Harassment Reports</Text>
              </View>
            </View>
          )}
          <View style={[styles.safetyBadge, unsafe ? styles.unsafeBadge : styles.safeBadge]}>
            <FontAwesome5
              name={unsafe ? "exclamation-circle" : "shield-alt"}
              size={16}
              color="white"
            />
            <Text style={styles.safetyText}>
              {unsafe ? "High Risk Area" : "Safe Area"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={sendSOS} style={styles.button}>
            <FontAwesome5 name="bell" size={24} color="#fff" />
            <Text style={styles.buttonText}>Send SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/fakeCall",
                params: { callerName: "Emergency Contact" },
              })
            }
          >
            <FontAwesome5 name="phone" size={24} color="#fff" />
            <Text style={styles.buttonText}>Fake Call</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search Vehicle Reports</Text>
          <View style={styles.searchContainer}>
            <TextInput
              value={vehicleNo}
              onChangeText={setVehicleNo}
              placeholder="Enter vehicle number"
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
            <TouchableOpacity 
              onPress={() => getReportsByVehicleNo(vehicleNo)}
              style={styles.searchButton}
              disabled={searchingVehicle}
            >
              {searchingVehicle ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome5 name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Display Vehicle Reports */}
          {harassmentReports && harassmentReports.length > 0 && (
            <View style={styles.reportsContainer}>
              <Text style={styles.reportsTitle}>
                Reports for {vehicleNo} ({harassmentReports.length})
              </Text>
              {harassmentReports.map((report: any, index: number) => (
                <View key={index} style={styles.reportItem}>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Type:</Text> {report.harassmentType || 'N/A'}
                  </Text>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Location:</Text> {report.location || 'N/A'}
                  </Text>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Extra-info:</Text> {report.extraInfo || 'N/A'}
                  </Text>
                  {report.image && (
                    <View style={styles.imageContainer}>
                      <Text style={styles.reportLabel}>Evidence:</Text>
                      <Image 
                        source={{ uri: report.image }} 
                        style={styles.reportImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Date:</Text> {
                      report.createdAt 
                        ? new Date(report.createdAt).toLocaleDateString()
                        : 'N/A'
                    }
                  </Text>
                  {report.description && (
                    <Text style={styles.reportText}>
                      <Text style={styles.reportLabel}>Details:</Text> {report.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

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
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  address: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addressTxt: {
    fontSize: 16,
    color: '#fff',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  safeBadge: {
    backgroundColor: '#4CAF50',
  },
  unsafeBadge: {
    backgroundColor: '#FF4444',
  },
  safetyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#b24bf3',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#b24bf3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  reportsContainer: {
    marginTop: 20,
  },
  reportsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  reportText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  reportLabel: {
    fontWeight: 'bold',
    color: '#b24bf3',
  },imageContainer: {
    marginTop: 10,
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 8,
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