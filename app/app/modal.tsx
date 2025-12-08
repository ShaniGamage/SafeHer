import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Text,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import {FontAwesome5} from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ModalScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [unsafe, setUnsafe] = useState<boolean>(true);
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<string>("");
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulsing animation for SOS button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      setUnsafe(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location access is required.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo.length > 0) {
          const item = geo[0];
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
          console.log(fullAddress);
        }
      } catch (err) {
        console.log("Location error:", err);
      }
    })();
  }, []);

  const sendSOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission required");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);
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
      };

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.252.116:3001';
      await fetch(`${apiUrl}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      Alert.alert("SOS sent", "Your emergency contacts have been notified");
      console.log("payload for api", payload, apiUrl);

    } catch (error) {
      console.log("SOS error", error);
    }
  };

  const handleSafe = () => {
    setUnsafe(false);
    router.replace("/(tabs)");
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF1744" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!unsafe) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <LinearGradient
      colors={['#4A0E4E', 'black', 'black']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello! {user?.firstName || 'User'}</Text>
          <Text style={styles.subtitle}>Your SOS button is ready if you need it</Text>
        </View>

        {/* Main Content - Centered SOS Button */}
        <View style={styles.mainContent}>
          {/* SOS Button with Pulsing Effect */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={sendSOS}
            style={styles.sosButtonContainer}
          >
            <Animated.View 
              style={[
                styles.sosButtonOuter,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.sosButtonMiddle}>
                <View style={styles.sosButtonInner}>
                  <Text style={styles.sosButtonText}>SOS</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Instruction Text */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Hold the SOS button to alert</Text>
            <Text style={styles.instructionText}>
              This will notify your trusted contacts, nearby{'\n'}
              app users, and the closest hospitals and{'\n'}
              police stations.
            </Text>
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push({
                pathname: "/fakeCall",
                params: { callerName: "Emergency Contact" },
              })
            }
          >
            <View style={styles.actionButtonInner}>
              <Text style={styles.actionButtonIcon}><FontAwesome5 name="phone-alt" size={20} color="white"/></Text>
            </View>
            <Text style={styles.actionButtonLabel}>Fake Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSafe}
          >
            <View style={[styles.actionButtonInner, styles.safeButtonInner]}>
              <Text style={styles.actionButtonIcon}><FontAwesome5 name="check" size={20} color="white"/></Text>
            </View>
            <Text style={styles.actionButtonLabel}>I'm Safe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    padding:20,
    marginTop: 20,
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  sosButtonOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#7921b1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonMiddle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#a020f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#b24bf3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b24bf3',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  actionButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#b24bf3',
    boxShadow: '0 4px 6px rgba(178, 75, 243, 0.5)',
  },
  safeButtonInner: {
    backgroundColor: 'tranparent',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    boxShadow: '0 4px 4px rgba(16, 185, 129, 0.5)',
  },
  actionButtonIcon: {
    fontSize: 32,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});