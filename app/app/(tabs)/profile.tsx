
// SafeRouteMap.tsx (Expo version)// SafeRouteMap.tsx - Complete Solution
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';
import { Route, HeatmapZone } from '@/interface/Route';
import * as Notifications from 'expo-notifications'

const API_URL = process.env.EXPO_PUBLIC_API_URL;


//configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner:true,
    shouldShowList:true
  })
})
const SafeRouteMap = () => {
  const mapRef = useRef<MapView>(null);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [startPoint, setStartPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(()=>{
    requestNotificationPermissions();
    getCurrentLocation()

    const subscription = Notifications.addNotificationResponseReceivedListener(response =>{
      console.log('notification tapped:',response)
    })
   // return ()=>subscription.remove()
  },[])
  
  // user's current location 
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Load heatmap 
  useEffect(() => {
    loadHeatmapZones();
  }, []);

  // Debounced heatmap 
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHeatmapZones();
    }, 1500);
    return () => clearTimeout(timer);
  }, [region.latitude, region.longitude]);

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Enable notifications to get alerts when entering high-risk areas'
        );
        setNotificationsEnabled(false);
        return;
      }
      
      setNotificationsEnabled(true);
      console.log('Notifications enabled');
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      setNotificationsEnabled(false);
    }
  }
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      setRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      console.log('User location:', coords);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const loadHeatmapZones = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const bounds = {
        minLat: region.latitude - region.latitudeDelta / 2,
        maxLat: region.latitude + region.latitudeDelta / 2,
        minLng: region.longitude - region.longitudeDelta / 2,
        maxLng: region.longitude + region.longitudeDelta / 2,
      };

      console.log('Loading safety zones...');

      const response = await axios.post(
        `${API_URL}/safe-route/heatmap`,
        bounds,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const zones = response.data.features || [];
      setHeatmapZones(zones);
      if (zones.includes(userLocation)) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "High rish area around",
            body: `you are entering a ${zones.riskLevel}`
          },
          trigger: null
        })
      }
      console.log('Safety zones loaded.', zones);

      console.log(`Loaded ${zones.length} zones`);

      if (response.data.stats) {
        console.log('Stats:', response.data.stats);
      }
    } catch (error) {
      const axiosError = error as any;
      console.error('Failed to load zones:', (error as Error).message);

      if (heatmapZones.length === 0 && axiosError.response?.status === 404) {
        Alert.alert(
          'Setup Required',
          'Safe Route API not found. Make sure the backend SafeRouteModule is installed.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: any; }; }) => {
    const coordinate = event.nativeEvent.coordinate;

    if (!startPoint) {
      // Set start point
      setStartPoint(coordinate);
      console.log('Start:', coordinate);
    } else if (!endPoint) {
      // Set end point and calculate route
      setEndPoint(coordinate);
      console.log('Destination:', coordinate);
      calculateSafeRoute(startPoint, coordinate);
    } else {
      // Reset
      clearRoute();
      setStartPoint(coordinate);
      console.log('New start:', coordinate);
    }
  };

  const calculateSafeRoute = async (start: { latitude: any; longitude: any; }, end: { latitude: any; longitude: any; }) => {
    setLoading(true);
    try {
      console.log('Calculating safest route...');

      const response = await axios.post(
        `${API_URL}/safe-route/calculate`,
        {
          start: { lat: start.latitude, lng: start.longitude },
          end: { lat: end.latitude, lng: end.longitude },
        },
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setRoute(response.data);

      // Fit map to show entire route
      if (mapRef.current && response.data.recommendedRoute) {
        const coords = response.data.recommendedRoute.coordinates.map((c: any[]) => ({
          latitude: c[1],
          longitude: c[0],
        }));
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }

      console.log('Route calculated:', response.data.recommendedRoute.safetyRating);

      // Show safety alert
      const safetyRating = response.data.recommendedRoute.safetyRating;
      if (safetyRating.includes('High Risk') || safetyRating.includes('Caution')) {
        Alert.alert(
          'Route Warning',
          `This route passes through ${response.data.dangerZones?.length || 0} high-risk areas. Consider an alternative route if possible.`
        );
      }
    } catch (error) {
      console.error('Route calculation failed:', (error as Error).message);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchDestination = async () => {
    if (!searchQuery.trim()) return;

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Simple geocoding using Nominatim (free)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' Sri Lanka')}&format=json&limit=1`,
        { timeout: 10000 }
      );

      if (response.data.length === 0) {
        Alert.alert('Not Found', 'Could not find that location. Try a different search.');
        return;
      }

      const result = response.data[0];
      const destination = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };

      console.log('🔍 Found:', result.display_name);

      // Set as destination
      setEndPoint(destination);

      // If no start point, use current location
      if (!startPoint) {
        if (userLocation) {
          setStartPoint(userLocation);
          calculateSafeRoute(userLocation, destination);
        } else {
          Alert.alert('Set Start Point', 'Please tap on the map to set your starting point first.');
          // Focus map on destination
          mapRef.current?.animateToRegion({
            ...destination,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        calculateSafeRoute(startPoint, destination);
      }
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', 'Could not search for that location.');
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRoute(null);
    setSearchQuery('');
    console.log('Cleared');
  };

  const useMyLocation = () => {
    if (userLocation) {
      setStartPoint(userLocation);
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      getCurrentLocation();
    }
  };

  // Get risk stats
  const riskStats = {
    high: heatmapZones.filter(z => z.properties.riskLevel === 'high').length,
    medium: heatmapZones.filter(z => z.properties.riskLevel === 'medium').length,
    low: heatmapZones.filter(z => z.properties.riskLevel === 'low').length,
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search destination..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchDestination}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchDestination}>
          <Text style={styles.searchButtonText}><FontAwesome5 name='search' color={'white'} size={20} /></Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Risk Zones  */}
        {heatmapZones
          .filter(z => z.properties.riskLevel === 'high')
          .map((zone, idx) => (
            <Polygon
              key={`high-${idx}`}
              coordinates={zone.geometry.coordinates[0].map((c: any[]) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              fillColor="rgba(255, 68, 68, 0.3)"
              strokeColor="#FF4444"
              strokeWidth={2}
            />
          ))}

        {/* Risk Zones */}
        {heatmapZones
          .filter(z => z.properties.riskLevel === 'medium')
          .map((zone, idx) => (
            <Polygon
              key={`med-${idx}`}
              coordinates={zone.geometry.coordinates[0].map((c: any[]) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              fillColor="rgba(255, 152, 0, 0.25)"
              strokeColor="#FF9800"
              strokeWidth={1}
            />
          ))}

        {/* Risk Zones */}
        {heatmapZones
          .filter(z => z.properties.riskLevel === 'low')
          .map((zone, idx) => (
            <Polygon
              key={`low-${idx}`}
              coordinates={zone.geometry.coordinates[0].map((c: any[]) => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              fillColor="rgba(255, 193, 7, 0.2)"
              strokeColor="#FFC107"
              strokeWidth={1}
            />
          ))}

        {/* Start Marker */}
        {startPoint && (
          <Marker
            coordinate={startPoint}
            pinColor="blue"
            title="Start"
            description="Your starting point"
          />
        )}

        {/* End Marker */}
        {endPoint && (
          <Marker
            coordinate={endPoint}
            pinColor="green"
            title="Destination"
            description="Where you're going"
          />
        )}

        {/* Recommended Safe Route */}
        {route?.recommendedRoute && (
          <Polyline
            coordinates={route.recommendedRoute.coordinates.map(c => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor="#2196F3"
            strokeWidth={5}
            lineDashPattern={[1]}
          />
        )}

        {/* Alternative Routes */}
        {route?.alternativeRoutes?.map((altRoute, idx) => (
          <Polyline
            key={`alt-${idx}`}
            coordinates={altRoute.coordinates.map(c => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor="#90CAF9"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={useMyLocation}>
        <Text style={styles.myLocationText}><FontAwesome5 name='location-arrow' color={'blue'} size={25} /></Text>
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Safety Zones</Text>
        {riskStats.high > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF4444' }]} />
            <Text style={styles.legendText}>High Risk ({riskStats.high})</Text>
          </View>
        )}
        {riskStats.medium > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Medium ({riskStats.medium})</Text>
          </View>
        )}
        {riskStats.low > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>Low Risk ({riskStats.low})</Text>
          </View>
        )}
        {heatmapZones.length === 0 && (
          <Text style={styles.legendSafe}>✅ Safe Area</Text>
        )}
      </View>

      {/* Route Info Card */}
      {route && (
        <View style={styles.routeCard}>
          <Text style={styles.routeTitle}>
            {route.recommendedRoute.safetyRating}
          </Text>
          <View style={styles.routeDetails}>
            <Text style={styles.routeDetail}>
              📏 {(route.recommendedRoute.distance / 1000).toFixed(2)} km
            </Text>
            <Text style={styles.routeDetail}>
              ⏱️ {Math.round(route.recommendedRoute.duration / 60)} min
            </Text>
          </View>
          {route.recommendedRoute.safetyRating.includes('High Risk') && (
            <Text style={styles.warningText}>
              ⚠️ This route passes through high-risk areas. Exercise caution!
            </Text>
          )}
          <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
            <Text style={styles.clearButtonText}>Clear Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      {!startPoint && !loading && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            👆 Tap map to set start point or search destination
          </Text>
        </View>
      )}
      {startPoint && !endPoint && !loading && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            👆 Tap map or search for destination
          </Text>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchButton: {
    backgroundColor: '#4A0E4E',
    marginLeft: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchButtonText: {
    fontSize: 20,
  },
  myLocationButton: {
    position: 'absolute',
    right: 10,
    bottom: 250,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationText: {
    fontSize: 24,
  },
  legend: {
    position: 'absolute',
    top: 120,
    right: 10,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 140,
  },
  legendTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  legendSafe: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  routeCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  routeDetail: {
    fontSize: 14,
    color: '#666',
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 10,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SafeRouteMap;