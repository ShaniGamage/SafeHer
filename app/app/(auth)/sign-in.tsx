import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const oauth = useOAuth({ strategy: 'oauth_google' });

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onGoogleSignIn = async () => {
    if (!oauth.startOAuthFlow) {
      Alert.alert('Error', 'Google Sign-In is not available');
      return;
    }

    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setActiveSession } = await oauth.startOAuthFlow();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Google sign-in incomplete');
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      Alert.alert('Error', err?.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4A0E4E', 'black', 'black']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/safeher-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.header}>
            SafeHER
          </Text>
          <Text style={styles.title}>Sign In</Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={onGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Image source={require('../../assets/images/google-color.png')}
                  style={styles.google}
                  resizeMode="contain" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email"
            placeholderTextColor="#999"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            value={password}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSignInPress}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    color: 'white',
    fontSize: 50,
    textAlign: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 40,
    color: 'white',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  googleButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#4A0E4E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#b24bf3',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#593876',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  google: {
    width: 25,
    height: 25,
    alignSelf: 'center',
  },
});