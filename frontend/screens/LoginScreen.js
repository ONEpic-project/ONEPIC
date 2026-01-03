import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Keyboard
} from 'react-native';
import AppText from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontSizes } from '../config/typography';
import Feather from 'react-native-vector-icons/Feather';

import { API_BASE_URL } from '../config/api';
import KakaoLogin from '../components/KakaoLogin';
import GoogleLogin from '../components/GoogleLogin';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [userIdError, setUserIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordRef = useRef(null); // 비밀번호 필드 참조 추가



  const handleLogin = async () => {
    setUserIdError('');
    setPasswordError('');
    //간단한 유효성 검사
    if (!userId.trim()) {
      setUserIdError('아이디를 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    // 모든 필드가 채워졌는지 확인하는 함수
    const checkAndDismissKeyboard = () => {
      if (userId.trim() && password.trim()) {
        Keyboard.dismiss();
      }
    };

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
            <AppText style={styles.title}>ONE PIC</AppText>
            <AppText style={styles.subtitle}>마트에서 줄서기는 그만</AppText>
          </View>

          {/* 입력 필드 영역 */}
          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, userIdError ? styles.inputError : null]}
              placeholder="아이디"
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                if (userIdError) setUserIdError(''); // 입력 시작하면 에러 문구 제거
              }}
              autoCapitalize="none"
              returnKeyType="next" // 키보드 버튼을 '다음'으로 변경
              onSubmitEditing={() => passwordRef.current?.focus()} // 다음 필드로 이동
              submitBehavior="submit" // 포커스 이동 시 키보드 유지
              autoCorrect={false}
              placeholderTextColor="#686868"
            />
            {/* 아이디 에러 문구 */}
            {userIdError ? <AppText style={styles.errorText}>{userIdError}</AppText> : null}

            <View style={[styles.passwordWrapper, passwordError ? styles.inputError : null]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderBottomWidth: 0 }]}
                placeholder="비밀번호"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(''); // 입력 시작하면 에러 문구 제거
                }}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => {
                  if (userId.trim() && password.trim()) Keyboard.dismiss();
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#686868"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#686868"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <AppText style={styles.errorText}>{passwordError}</AppText> : null}
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
    top: height * 0.05,
  },
  title: {
    fontSize: 50,
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
    marginBottom: height * 0.05,
  },
  input: {
    width: '80%',
    height: height * 0.06, // 화면 높이의 6%
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: fontSizes.lg,
    marginBottom: height * 0.01,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  passwordWrapper: {
    width: '80%',
    height: height * 0.06,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: height * 0.01,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: height * 0.02,
  },
  errorText: {
    width: '80%',
    alignSelf: 'center',
    color: '#FF3B30', // iOS 시스템 레드 컬러 느낌
    fontSize: fontSizes.sm,
    marginBottom: height * 0.01,
    paddingLeft: 5,
  },
  // 선택 사항: 에러 시 밑줄 색상 변경
  inputError: {
    borderBottomColor: '#FF3B30',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    padding: 10,
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