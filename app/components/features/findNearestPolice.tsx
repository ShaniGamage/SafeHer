import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { PoliceStation, policeStations } from '@/data/police-stations'
import { locationService } from '@/services/location.service'
import { FontAwesome5 } from '@expo/vector-icons'

interface NearestStation extends PoliceStation {
  distance: number
}

const FindNearestPolice = () => {
  const [nearestStation, setNearestStation] = useState<NearestStation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const location = await locationService.getCurrentLocation()
      
      if (!location) {
        setError('Unable to get location. Permission may be denied.')
        return
      }

      const { latitude, longitude } = location.coords
      setUserLocation({ lat: latitude, lng: longitude })

      const nearest = getNearestPolice(latitude, longitude)
      setNearestStation(nearest)
    } catch (err: any) {
      setError(err.message || 'Error getting location')
    } finally {
      setLoading(false)
    }
  }

  function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function getNearestPolice(userLat: number, userLng: number): NearestStation | null {
    if (!policeStations || policeStations.length === 0) return null

    return policeStations
      .map(p => ({
        ...p,
        distance: distance(userLat, userLng, p.lat, p.lng)
      }))
      .sort((a, b) => a.distance - b.distance)[0]
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(2)} km`
  }

  const handleCall = () => {
    if (!nearestStation?.phone) {
      Alert.alert('No phone number available')
      return
    }
    Linking.openURL(`tel:${nearestStation.phone}`)
  }
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Fetching location...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!nearestStation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No police stations available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Nearest Police Station</Text> */}

      <View style={styles.card}>
        <Text style={styles.stationName}>Nearest Police station: {nearestStation.name}</Text>
        <Text style={styles.distance}>Distance: {formatDistance(nearestStation.distance)}</Text>
        <Text style={styles.phone}>Phone: {nearestStation.phone}</Text>

        {/* {userLocation && (
          <Text style={styles.location}>
            Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </Text>
        )} */}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCall}>
            <Text style={styles.buttonText}><FontAwesome5 name="phone" size={16} color="#fff" /> Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  distance: {
    fontSize: 16,
    marginBottom: 8,
    color: '#ccc',
  },
  phone: {
    fontSize: 16,
    marginBottom: 8,
    color: '#ccc',
  },
  // location: {
  //   fontSize: 12,
  //   color: '#888',
  //   marginBottom: 15,
  // },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default FindNearestPolice
