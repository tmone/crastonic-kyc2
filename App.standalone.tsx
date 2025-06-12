import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Platform, View } from 'react-native';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { DarkModeBackground } from '@/components/DarkModeBackground';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

// Import your screens directly
import HomeScreen from '@/app/(tabs)/index';
import KYCScreen from '@/app/(tabs)/kyc';
import SettingsScreen from '@/app/(tabs)/settings';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { actualTheme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <NavigationContainer theme={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DarkModeBackground>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors[actualTheme ?? 'light'].tint,
            tabBarStyle: Platform.select({
              ios: {
                position: 'absolute',
                backgroundColor: actualTheme === 'dark' ? 'rgba(17, 17, 21, 0.88)' : 'rgba(255, 255, 255, 0.95)',
                height: 88,
                borderTopWidth: 0,
              },
              default: {},
            }),
            tabBarBackground: () => (
              <View style={{ 
                flex: 1, 
                backgroundColor: actualTheme === 'dark' ? 'rgba(17, 17, 21, 0.88)' : '#FFFFFF' 
              }} />
            ),
          }}>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: t('home'),
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tab.Screen
            name="KYC"
            component={KYCScreen}
            options={{
              title: t('kyc'),
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill.viewfinder" color={color} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: t('settings'),
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
            }}
          />
        </Tab.Navigator>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
      </DarkModeBackground>
    </NavigationContainer>
  );
}

export default function StandaloneApp() {
  // Skip font loading in standalone mode to avoid path issues
  const [loaded] = useFonts({});

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <TabNavigator />
      </LanguageProvider>
    </ThemeProvider>
  );
}