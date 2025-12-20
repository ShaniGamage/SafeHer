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
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#b24bf3',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 10,
          borderRadius: 35,
          marginHorizontal: 15,
          marginBottom: 15,
          position: 'absolute',
          shadowColor: '#b24bf3',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#b24bf3' : 'transparent',
                borderRadius: 20,
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? '#b24bf3' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <FontAwesome5 
                name="home" 
                size={20} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          headerTitle: 'Report a harassment',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#b24bf3' : 'transparent',
                borderRadius: 20,
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? '#b24bf3' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <FontAwesome5 
                name="exclamation-circle" 
                size={20} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          headerTitle: 'SOS',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#b24bf3' : 'transparent',
                borderRadius: 20,
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? '#b24bf3' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <FontAwesome5 
                name="bell" 
                size={20} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerTitle: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#b24bf3' : 'transparent',
                borderRadius: 20,
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? '#b24bf3' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <FontAwesome5 
                name="users" 
                size={20} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerTitle: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#b24bf3' : 'transparent',
                borderRadius: 20,
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: focused ? '#b24bf3' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <FontAwesome5 
                name="location-arrow" 
                size={20} 
                color={focused ? '#FFFFFF' : color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}