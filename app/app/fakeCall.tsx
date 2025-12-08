import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {FontAwesome5} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const FakeCall = () => {
  const router = useRouter();
  const [callAnswered, setCallAnswered] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  

  // Pulsing animation for incoming call
  useEffect(() => {
    if (!callAnswered) {
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
    }
  }, [callAnswered]);

  // Call timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callAnswered) {
      interval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callAnswered]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setCallAnswered(true);
  };

  const handleDecline = () => {
    router.back();
  };

  const handleEndCall = () => {
    router.back();
  };

  if (callAnswered) {
    // Active Call Screen
    return (
      <LinearGradient
            colors={['#4A0E4E', 'black', 'black']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
      <View style={{
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 80,
        paddingHorizontal: 20,
      }}>
        {/* Top Section - Caller Info */}
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#3a3a3c',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <FontAwesome5 name="user" size={30} color='white'/>
          </View>
          
          <Text style={{
            fontSize: 28,
            fontWeight: '600',
            color: '#fff',
            marginBottom: 8,
          }}>
            Mom
          </Text>
          
          <Text style={{
            fontSize: 18,
            color: '#10b981',
            fontWeight: '500',
          }}>
            {formatTime(callTime)}
          </Text>
        </View>

        {/* Middle Section - Call Actions */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 20,
        }}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              backgroundColor: '#3a3a3c',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 24 }}><FontAwesome5 name='volume-mute' size={30} color='white'/></Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 12 }}>mute</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              backgroundColor: '#3a3a3c',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 24 }}><FontAwesome5 name='pause' size={30} color='white'/></Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 12 }}>hold</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              backgroundColor: '#3a3a3c',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 24 }}><FontAwesome5 name='volume-up' size={30} color='white'/></Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 12 }}>speaker</Text>
          </View>
        </View>

        {/* Bottom Section - End Call */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleEndCall}
            style={{
              width: 80,
              height: 80,
              borderRadius: 45,
              backgroundColor: '#ef4444',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36, transform: [{ rotate: '225deg' }] }}><FontAwesome5 name="phone" size={30} color='white'/></Text>
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    );
  }

  // Incoming Call Screen
  return (
    <LinearGradient
          colors={['#4A0E4E', 'black', 'black']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
    <View style={{
      flex: 1,
      justifyContent: 'space-between',
      paddingVertical: 60,
      paddingHorizontal: 30,
    }}>
      {/* Top Section */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: 16,
          color: '#fff',
          marginBottom: 30,
          opacity: 0.8,
        }}>
          Mobile
        </Text>

        <Animated.View style={{
          transform: [{ scale: pulseAnim }],
          marginBottom: 20,
        }}>
          <View style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: '#2c2c2e',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 64 }}><FontAwesome5 name="user" size={40} color='white'/></Text>
          </View>
        </Animated.View>

        <Text style={{
          fontSize: 36,
          fontWeight: '300',
          color: '#fff',
          marginBottom: 10,
        }}>
          Mom
        </Text>

        <Text style={{
          fontSize: 20,
          color: '#9ca3af',
          fontWeight: '400',
        }}>
          incoming call...
        </Text>
      </View>

      {/* Middle Section - Quick Actions */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
      }}>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#3a3a3c',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 24 }}><FontAwesome5 name="clock" size={30} color='white'/></Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 13 }}>Remind Me</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#3a3a3c',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 24 }}><FontAwesome5 name="comment" size={30} color='white'/></Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 13 }}>Message</Text>
        </View>
      </View>

      {/* Bottom Section - Answer/Decline */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 0,
      }}>
        {/* Decline */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleDecline}
            style={{
              width: 75,
              height: 75,
              borderRadius: 37.5,
              backgroundColor: '#ef4444',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36, transform: [{ rotate: '225deg' }] }}><FontAwesome5 name="phone" size={24} color='white'/></Text>
          </TouchableOpacity>
          <Text style={{
            color: '#fff',
            fontSize: 15,
            marginTop: 12,
          }}>
            Decline
          </Text>
        </View>

        {/* Answer */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleAnswer}
            style={{
              width: 75,
              height: 75,
              borderRadius: 37.5,
              backgroundColor: '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36 }}><FontAwesome5 name="phone" size={20} color='white'/></Text>
          </TouchableOpacity>
          <Text style={{
            color: '#fff',
            fontSize: 15,
            marginTop: 12,
          }}>
            Accept
          </Text>
        </View>
      </View>
    </View>
    </LinearGradient>
  );
};

export default FakeCall;