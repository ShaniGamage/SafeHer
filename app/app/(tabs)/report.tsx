import { View, Text, Alert, TouchableOpacity, TextInput, Image, Switch, StyleSheet, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useState, useRef } from 'react'
import * as Location from 'expo-location'
import * as Camera from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useUser } from '@clerk/clerk-expo'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { LinearGradient } from 'expo-linear-gradient';

const Report = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null)
    const [image, setImage] = useState<string | null>(null)
    const [vehicle, setVehicle] = useState<string>('')
    const [harassmentType, setHarassmentType] = useState<string>('')
    const [extraInfo, setExtraInfo] = useState<string>('')
    const [anonymous, setAnonymous] = useState<boolean>(false)
    const [address, setAddress] = useState<string>('')
    const [cameraVisible, setCameraVisible] = useState(false)
    const [mapVisible, setMapVisible] = useState(false)
    const [tempMarker, setTempMarker] = useState<{ latitude: number, longitude: number } | null>(null)
    const [loading, setLoading] = useState(false)
    const [permission, requestPermission] = Camera.useCameraPermissions()
    const cameraRef = useRef<Camera.CameraView>(null)

    const { user } = useUser()

    // Auto-detect location
    const autoDetectLocation = async () => {
        try {
            setLoading(true)
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== "granted") {
                Alert.alert("Permission denied", "Location access is required.")
                return
            }

            const loc = await Location.getCurrentPositionAsync({})
            setLocation(loc)

            // Get address
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
                ].filter(part => part)

                const fullAddress = addressParts.join(', ')
                setAddress(fullAddress)
            }
        } catch (err) {
            console.error("Location error:", err)
            Alert.alert("Error", "Failed to get location")
        } finally {
            setLoading(false)
        }
    }

    // Geocode address
    const geocodeAddress = async (addressText: string) => {
        try {
            if (!addressText || addressText.trim().length < 3) {
                return
            }

            const geocoded = await Location.geocodeAsync(addressText)

            if (geocoded && geocoded.length > 0) {
                const { latitude, longitude } = geocoded[0]
                setLocation({
                    coords: {
                        latitude,
                        longitude,
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: Date.now(),
                } as Location.LocationObject)
            }
        } catch (err) {
            console.error("Geocoding error:", err)
        }
    }

    // Open map picker
    const openMapPicker = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Location permission is required to use the map.')
                return
            }

            // Get initial location
            let initialLocation = { latitude: 6.9271, longitude: 79.8612 } // Default: Colombo

            if (location) {
                initialLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                }
            } else {
                try {
                    const loc = await Location.getCurrentPositionAsync({})
                    initialLocation = {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    }
                } catch (err) {
                    console.log("Using default location (Colombo)")
                }
            }

            setTempMarker(initialLocation)
            setMapVisible(true)
        } catch (err) {
            console.error("Map error:", err)
            Alert.alert("Error", "Failed to open map")
        }
    }

    // Confirm location from map
    const confirmMapLocation = async () => {
        if (tempMarker) {
            setLoading(true)
            try {
                console.log('Selected coordinates:', tempMarker)

                // Set location with coordinates
                setLocation({
                    coords: {
                        latitude: tempMarker.latitude,
                        longitude: tempMarker.longitude,
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: Date.now(),
                } as Location.LocationObject)

                // Get address for the selected location
                console.log('Fetching address for coordinates...')
                const geo = await Location.reverseGeocodeAsync({
                    latitude: tempMarker.latitude,
                    longitude: tempMarker.longitude,
                })

                console.log('Geocode result:', geo)

                if (geo && geo.length > 0) {
                    const item = geo[0]
                    const addressParts = [
                        item.name,
                        item.street,
                        item.streetNumber,
                        item.district,
                        item.city,
                        item.region,
                        item.country,
                    ].filter(part => part && part.trim().length > 0)

                    const fullAddress = addressParts.join(', ')
                    console.log('Generated address:', fullAddress)

                    if (fullAddress.length > 0) {
                        setAddress(fullAddress)
                        Alert.alert('Location Set', `Address: ${fullAddress}`)
                    } else {
                        // Fallback to coordinates if no address found
                        const coordsAddress = `${tempMarker.latitude.toFixed(6)}, ${tempMarker.longitude.toFixed(6)}`
                        setAddress(coordsAddress)
                        Alert.alert('Location Set', `Coordinates: ${coordsAddress}`)
                    }
                } else {
                    // No geocoding result, use coordinates
                    const coordsAddress = `${tempMarker.latitude.toFixed(6)}, ${tempMarker.longitude.toFixed(6)}`
                    setAddress(coordsAddress)
                    Alert.alert('Location Set', `Using coordinates: ${coordsAddress}`)
                }

                setMapVisible(false)
            } catch (err) {
                console.error("Reverse geocode error:", err)
                // Still set coordinates even if address lookup fails
                const coordsAddress = `${tempMarker.latitude.toFixed(6)}, ${tempMarker.longitude.toFixed(6)}`
                setAddress(coordsAddress)
                Alert.alert("Address Not Found", "Using coordinates instead")
                setMapVisible(false)
            } finally {
                setLoading(false)
            }
        }
    }

    // Image upload from library
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true
        })

        if (!result.canceled) {
            setImage(result.assets[0].uri)
        }
    }

    // Open camera
    const openCamera = async () => {
        if (!permission?.granted) {
            const res = await requestPermission()
            if (!res.granted) {
                Alert.alert("Camera permission denied")
                return
            }
        }
        setCameraVisible(true)
    }

    // Capture photo from camera
    const capturePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7
                })
                if (photo) {
                    setImage(photo.uri)
                    setCameraVisible(false)
                }
            } catch (err) {
                console.error("Camera capture error:", err)
                Alert.alert("Error", "Failed to capture photo")
            }
        }
    }

    // Camera view
    if (cameraVisible) {
        return (
            <View style={styles.cameraContainer}>
                <Camera.CameraView
                    ref={cameraRef}
                    facing='back'
                    style={styles.camera}
                />
                <View style={styles.cameraControlsOverlay}>
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={capturePhoto}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setCameraVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    // Map picker modal
    if (mapVisible) {
        return (
            <Modal visible={mapVisible} animationType="slide">
                <View style={styles.mapContainer}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapTitle}>Select Location on Map</Text>
                        <Text style={styles.mapSubtitle}>Tap anywhere to place marker, or drag the marker</Text>
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: tempMarker?.latitude || 6.9271,
                            longitude: tempMarker?.longitude || 79.8612,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        onPress={(e) => {
                            setTempMarker(e.nativeEvent.coordinate)
                        }}
                    >
                        {tempMarker && (
                            <Marker
                                coordinate={tempMarker}
                                title="Selected Location"
                                description="Drag to adjust position"
                                draggable
                                onDragEnd={(e) => setTempMarker(e.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>

                    {tempMarker && (
                        <View style={styles.coordinatesDisplay}>
                            <Text style={styles.coordinatesText}>
                                📍 {tempMarker.latitude.toFixed(6)}, {tempMarker.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.mapControls}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelMapButton]}
                            onPress={() => {
                                setMapVisible(false)
                                setTempMarker(null)
                            }}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmMapButton, !tempMarker && styles.buttonDisabled]}
                            onPress={confirmMapLocation}
                            disabled={!tempMarker || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>✓ Confirm Location</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )
    }

    // Submit report 
    const submitReport = async () => {
        try {
            if (!address || !harassmentType) {
                Alert.alert('Error', 'Location and harassment type are required.')
                return
            }

            setLoading(true)

            const reportPayload = {
                userId: user?.id || '',
                location: address,
                latitude: location?.coords?.latitude || 0,
                longitude: location?.coords?.longitude || 0,
                vehicleNumber: vehicle,
                harassmentType,
                extraInfo,
                anonymous,
                image,
                createdAt: new Date().toISOString(),
            }

            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.30.144.1:3001'

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const response = await fetch(`${apiUrl}/report-harassment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportPayload),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Server error:', errorText)
                throw new Error(`Server returned ${response.status}`)
            }

            const result = await response.json()
            console.log('Success:', result)

            Alert.alert(
                "Report Submitted",
                "Your harassment report has been submitted successfully",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            setVehicle('')
                            setHarassmentType('')
                            setExtraInfo('')
                            setImage(null)
                            setAddress('')
                            setLocation(null)
                            setAnonymous(false)
                        }
                    }
                ]
            )

        } catch (error: any) {
            console.error("Submit error:", error)

            let errorMessage = "Failed to submit report. "

            if (error.name === 'AbortError') {
                errorMessage += "Request timed out. Check:\n\n" +
                    "1. Backend is running\n" +
                    "2. Correct IP: " + (process.env.EXPO_PUBLIC_API_URL || 'http://172.30.144.1:3001') + "\n" +
                    "3. Same WiFi network"
            } else if (error.message.includes('Network request failed')) {
                errorMessage += "Cannot reach server. Is your backend running?"
            } else {
                errorMessage += error.message
            }

            Alert.alert("Error", errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <LinearGradient
            colors={['#4A0E4E', 'black', 'black']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Report Harassment</Text>

                <TextInput
                    style={styles.input}
                    placeholder='Bus/Vehicle Number'
                    placeholderTextColor={'#585c63'}
                    value={vehicle}
                    onChangeText={setVehicle}
                    editable={!loading}
                />

                <TextInput
                    style={styles.input}
                    placeholder='Type of Harassment (Verbal, Physical, etc.)'
                    placeholderTextColor={'#585c63'}
                    value={harassmentType}
                    onChangeText={setHarassmentType}
                    editable={!loading}
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder='Extra Info'
                    placeholderTextColor={'#585c63'}
                    value={extraInfo}
                    onChangeText={setExtraInfo}
                    multiline
                    numberOfLines={4}
                    editable={!loading}
                    textAlignVertical="top"
                />

                <Text style={styles.sectionLabel}>Location *</Text>

                <View style={styles.locationButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.locationButton, loading && styles.buttonDisabled]}
                        onPress={autoDetectLocation}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Auto-detect</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.locationButton, loading && styles.buttonDisabled]}
                        onPress={openMapPicker}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Map</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.orText}>OR</Text>

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder='Enter address manually (e.g., Galle Road, Colombo)'
                    placeholderTextColor={'#585c63'}
                    value={address}
                    onChangeText={(text) => {
                        setAddress(text)
                        // Clear location when manually editing so it can be re-geocoded
                        if (location && text !== address) {
                            // User is manually editing, so geocode on blur
                        }
                    }}
                    editable={!loading}
                    textAlignVertical="top"
                    onBlur={() => {
                        if (address.length > 10) {
                            geocodeAddress(address)
                        }
                    }}
                />

                {location ? (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>✓ Coordinates Detected:</Text>
                        <Text style={styles.infoText}>
                            {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.sectionLabel}>Add Photo (Optional)</Text>
                <View style={styles.imageButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonGallery]}
                        onPress={pickImage}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}> Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={openCamera}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}> Camera</Text>
                    </TouchableOpacity>
                </View>

                {image ? (
                    <View style={styles.imagePreview}>
                        <Image source={{ uri: image }} style={styles.image} />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => setImage(null)}
                            disabled={loading}
                        >
                            <Text style={styles.removeButtonText}>✕ Remove</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.switchContainer}>
                    <Switch
                        value={anonymous}
                        onValueChange={setAnonymous}
                        disabled={loading}
                    />
                    <Text style={styles.switchLabel}>Post Anonymously</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={submitReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        marginTop: 40
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#fff',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 10,
        color: '#fff',
    },
    orText: {
        textAlign: 'center',
        color: '#fff',
        marginVertical: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#2c2c2e',
        color: '#fff',
        
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        flex: 1,
    },
    locationButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    locationButton: {
        flex: 1,
        borderWidth:3,
        backgroundColor:'transparent',
        borderColor:'#007AFF'
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth:3,
        borderColor:'#b24bf3'
    },
    buttonGallery:{
        backgroundColor: '#b24bf3'
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#d1d1d6',
        opacity: 0.6,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    infoBox: {
        backgroundColor: '#e8f5e9',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    infoLabel: {
        fontWeight: '600',
        marginBottom: 6,
        color: '#2e7d32',
        fontSize: 14,
    },
    infoText: {
        fontSize: 14,
        color: '#1b5e20',
        lineHeight: 20,
    },
    imagePreview: {
        marginBottom: 16,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginBottom: 12,
    },
    removeButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        padding: 14,
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    switchLabel: {
        marginLeft: 12,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#34c759',
        padding: 16,
        marginBottom:45,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraControlsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 50,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureButtonInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Map styles
    mapContainer: {
        flex: 1,
        backgroundColor: '#b24bf3',
    },
    mapHeader: {
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    mapTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    mapSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    map: {
        flex: 1,
    },
    coordinatesDisplay: {
        position: 'absolute',
        top: 140,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    coordinatesText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    mapControls: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 30,
        gap: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    cancelMapButton: {
        backgroundColor: '#8E8E93',
        flex: 1,
    },
    confirmMapButton: {
        backgroundColor: '#34c759',
        flex: 2,
    },
})

export default Report