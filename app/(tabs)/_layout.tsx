import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F7C97B',
        tabBarInactiveTintColor: '#999999',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false, // Hide labels, show only icons
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : insets.bottom + 4,
          height: Platform.OS === 'ios' ? 88 + insets.bottom : 64 + insets.bottom,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 26 : 24} 
              name="house.fill" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 26 : 24} 
              name="gearshape.fill" 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
