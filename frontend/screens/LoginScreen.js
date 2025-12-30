import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import AppText from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontSizes } from '../config/typography';

import { API_BASE_URL } from '../config/api';
import KakaoLogin from '../components/KakaoLogin';
import GoogleLogin from '../components/GoogleLogin';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);



  const handleLogin = async () => {
    //간단한 유효성 검사
    if (!userId.trim()) {
      Alert.alert('알림', '아이디를 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    // 로그인 로직 (실제로는 API 호출)
    console.log('Login:', userId, password);
    
    // 로그인 성공 시 홈으로 이동 (뒤로가기 불가)
     try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login_id: userId,
        password: password,
      }),
    });

    const data = await response.json();

    console.log('서버 응답 데이터:', data);

    if (!response.ok) {
        /// 에러 처리
        Alert.alert('로그인 실패', data.detail || '오류가 발생했습니다.');
        return;
      }

    // 로그인 성공 -사용자 정보 저장
      if (data.user_id && data.username) {
        await AsyncStorage.setItem('user_id', data.user_id.toString());
        await AsyncStorage.setItem('login_id', data.login_id);
        await AsyncStorage.setItem('username', data.username);
        await AsyncStorage.setItem('phone', data.phone);

        // 토큰 저장, 추후 인증 헤더에 사용 예정
        await AsyncStorage.setItem('access_token', data.access_token);

        console.log('로그인 성공:', data);
        
        // 홈 화면으로 이동 (뒤로가기 불가)
        navigation.replace('Home');
      } else {
        Alert.alert('오류', '사용자 정보를 받지 못했습니다.');
      }

    } catch (error) {
      console.error('로그인 에러:', error);
      
      // 네트워크 에러 처리
      if (error.message === 'Network request failed') {
        Alert.alert(
          '네트워크 오류',
          '서버에 연결할 수 없습니다.\nFastAPI 서버가 실행 중인지 확인해주세요.'
        );
      } else {
        Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
      }
      } finally {
        setIsLoading(false);
      }
  };

  const handleSignup = () => {
    // 회원가입 화면으로 이동
    navigation.navigate('Signup');
  };

  const handleForgotCredentials = () => {
    // 아이디/비밀번호 찾기 화면으로 이동
    navigation.navigate('FindAccount');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 로고 영역 */}
          <View style={styles.logo}>
            <AppText style={styles.title}>ONE pic</AppText>
            <AppText style={styles.subtitle}>마트에서 줄서기는 그만</AppText>
          </View>

          {/* 입력 필드 영역 */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#686868"
            />

            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#686868"
            />
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <AppText style={styles.loginButtonText}>로그인 하기</AppText>
          </TouchableOpacity>

          {/* 카카오 로그인 버튼 */}
          <KakaoLogin navigation={navigation} />
          
          {/* 구글 로그인 버튼 */}
          <GoogleLogin navigation={navigation} />

          {/* 하단 링크 */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSignup}>
              <AppText style={styles.signupText}>회원가입</AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotCredentials}>
              <AppText style={styles.forgotText}>
                아이디/비밀번호를 잊으셨나요?
              </AppText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.1, // 화면 너비의 10%
    justifyContent: 'center',
  },
  logo: {
    alignItems: 'center',
    marginBottom: height * 0.1, // 화면 높이의 10%
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: height * 0.01,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: '#686868',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
    marginBottom: height * 0.08,
  },
  input: {
    width: '80%',
    height: height * 0.06, // 화면 높이의 6%
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: fontSizes.lg,
    marginBottom: height * 0.035,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  loginButton: {
    width: '85%',
    height: height * 0.06,
    backgroundColor: '#FF9500',
    borderRadius: height * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: height * 0.025,
  },
  loginButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  signupText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
  },
  forgotText: {
    fontSize: fontSizes.sm,
    //fontSize:20,
    color: '#686868',
  },
});

export default LoginScreen;