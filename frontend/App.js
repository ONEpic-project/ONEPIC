import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import SignupCompleteScreen from './screens/SignupCompleteScreen';
import FindAccountScreen from './screens/FindAccountScreen'; 
import Home from './screens/Home';
import ScanScreen from './screens/ScanScreen';
import PaymentScreen from './screens/PaymentScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LoginScreen"
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
        {/* 로그인 화면 */}
        <Stack.Screen 
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        
        {/* 회원가입 화면 */}
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{ 
            title: '회원가입',
            headerTitleAlign: 'center'
          }}
        />

        {/* 회원가입 완료 화면 */}
        <Stack.Screen 
          name="SignupComplete" 
          component={SignupCompleteScreen}
          options={{ headerShown: false }}
        />

        {/* 아이디/비밀번호 찾기 화면 - 추가 */}
        <Stack.Screen 
          name="FindAccount" 
          component={FindAccountScreen}
          options={{ 
            title: '가입정보 찾기',
            headerTitleAlign: 'center'
          }}
        />

        {/* 홈 화면 */}
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ 
            title: 'ONEPIC',
            headerTitleAlign: 'center',
            headerShown: false,
          }}
        />

        {/* 스캔 화면 */}
        <Stack.Screen 
          name="Scan" 
          component={ScanScreen}
          options={{ 
            title: 'ONEPIC - 상품 스캔',
            headerTitleAlign: 'center'
          }}
        />

         {/* 결제 화면 */}   
        <Stack.Screen
        name='Payment'
        component={PaymentScreen}
        options={{
          
        }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}