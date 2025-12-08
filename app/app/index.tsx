import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Not signed in - go to sign in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Signed in - go to safety check first (your modal screen)
  return <Redirect href="/modal" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});