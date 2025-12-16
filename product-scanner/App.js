import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './screens/Home';
import ScanScreen from './screens/ScanScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ 
            title: 'ONEPIC',
            headerTitleAlign: 'center',
            headerShown: false, // 홈 화면에서는 헤더 숨김
          }}
        />
        <Stack.Screen 
          name="Scan" 
          component={ScanScreen}
          options={{ 
            title: 'ONEPIC - 상품 스캔',
            headerTitleAlign: 'center'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}