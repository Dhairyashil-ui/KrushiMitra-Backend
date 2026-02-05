import { Tabs } from 'expo-router';
import { Home, Users, Bot, Calendar, User, Newspaper } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
    
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 75,
          paddingBottom: Platform.OS === 'ios' ? 25 : 15,
          paddingTop: 15,
          paddingHorizontal: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}>
              <Home 
                size={focused ? 26 : 24} 
                color={focused ? '#2E7D32' : '#6B7280'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}>
              <Users 
                size={focused ? 26 : 24} 
                color={focused ? '#2E7D32' : '#6B7280'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 16,
              borderRadius: 20,
              backgroundColor: focused ? '#2E7D32' : '#F8FAF8',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 56,
              minHeight: 56,
              shadowColor: focused ? '#2E7D32' : '#000000',
              shadowOffset: { width: 0, height: focused ? 8 : 4 },
              shadowOpacity: focused ? 0.24 : 0.08,
              shadowRadius: focused ? 16 : 8,
              elevation: focused ? 12 : 6,
              borderWidth: focused ? 0 : 1,
              borderColor: focused ? 'transparent' : '#E8F5E9',
            }}>
              <Bot 
                size={focused ? 28 : 26} 
                color={focused ? '#FFFFFF' : '#2E7D32'}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="farming-news"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}>
              <Newspaper 
                size={focused ? 26 : 24} 
                color={focused ? '#2E7D32' : '#6B7280'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}>
              <Calendar 
                size={focused ? 26 : 24} 
                color={focused ? '#2E7D32' : '#6B7280'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}>
              <User 
                size={focused ? 26 : 24} 
                color={focused ? '#2E7D32' : '#6B7280'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}