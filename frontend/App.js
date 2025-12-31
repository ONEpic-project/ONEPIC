// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 화면 컴포넌트 import
import Login from './screens/LoginScreen';
import Splash from './screens/SplashScreen';
import Header from './screens/components/Header';
import Signup from './screens/SignupScreen';
import FindAccount from './screens/FindAccountScreen';
import SignupComplete from './screens/SignupCompleteScreen';
import Home from './screens/HomeScreen';
import Scan from './screens/ScanScreen';
import Payment from './screens/PaymentScreen';
import Paid from './screens/PaidScreen';
import Cart from './screens/CartScreen';
import MyPage from './screens/MyPageScreen';
import Receipt from './screens/ReceiptScreen';
import ReceiptDetail from './screens/ReceiptDetailScreen';
import Period from './screens/components/PeriodDropdown';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // 모든 화면에서 헤더 숨김
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {/* Splash 화면 (앱 시작 시 먼저 표시) */}
        <Stack.Screen name="Splash" component={Splash} />

        {/* 로그인 화면 */}
        <Stack.Screen 
          name="Login" 
          component={Login} 
        />

        {/* 헤더 영역 컴포넌트 */}
        <Stack.Screen 
          name="Header" 
          component={Header} 
        />

        <Stack.Screen
          name="Signup" 
          component={Signup} 
        />
        
        {/* 아이디/비밀번호 찾기 화면 */}
        <Stack.Screen 
          name="FindAccount" 
          component={FindAccount} 
        />
        
        {/* 회원가입 완료 화면 */}
        <Stack.Screen 
          name="SignupComplete" 
          component={SignupComplete} 
        />
        
        {/* 홈 화면 */}
        <Stack.Screen 
          name="Home" 
          component={Home} 
        />
        
        {/* 스캔 화면 */}
        <Stack.Screen 
          name="Scan" 
          component={Scan} 
        />

        {/* 결제 화면 */}
        <Stack.Screen 
          name="Payment" 
          component={Payment} 
        />

        {/* 결제 완료 화면 */}
        <Stack.Screen 
          name="Paid" 
          component={Paid} 
        />

        {/* 장바구니 */}
        <Stack.Screen 
          name="Cart" 
          component={Cart} 
        />

        {/* 마이페이지 */}
        <Stack.Screen 
          name="MyPage" 
          component={MyPage} 
        />

        {/* 전자영수증 */}
        <Stack.Screen 
          name="Receipt" 
          component={Receipt}
        />

        {/* 영수증  내역 */}
        <Stack.Screen 
          name="ReceiptDetail" 
          component={ReceiptDetail}
        />

        {/* 전자영수증 드롭다운 */}
        <Stack.Screen 
          name="Period" 
          component={Period} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;