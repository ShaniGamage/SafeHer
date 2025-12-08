import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
          
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          headerTitle: 'Report a harassment',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="exclamation-circle" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          headerTitle: 'SOS',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="bell" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerTitle: 'Community',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
