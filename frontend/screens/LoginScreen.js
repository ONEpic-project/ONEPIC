import React, { useState } from 'react';
import {
  View,
  Text,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// API URL 설정 (실제 배포 시 환경 변수로 관리 권장)
const API_BASE_URL = 'http://ec2-13-239-10-253.ap-southeast-2.compute.amazonaws.com';

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 간단한 유효성 검사
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
      const response = await fetch('${API_BASE_URL}/api/auth/login', {
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

    if (!response.ok) {
        // HTTP 상태 코드별 에러 처리
        if (response.status === 401) {
          Alert.alert('로그인 실패', '아이디 또는 비밀번호가 일치하지 않습니다.');
        } else if (response.status === 404) {
          Alert.alert('로그인 실패', '존재하지 않는 사용자입니다.');
        } else {
          Alert.alert('로그인 실패', data.detail || '오류가 발생했습니다.');
        }
        return;
      }

    // 로그인 성공 - 토큰 저장
      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        
        // refresh_token이 있다면 함께 저장
        if (data.refresh_token) {
          await AsyncStorage.setItem('refresh_token', data.refresh_token);
        }

        // 사용자 정보도 저장 (필요시)
        if (data.user) {
          await AsyncStorage.setItem('user_info', JSON.stringify(data.user));
        }

        console.log('로그인 성공:', data);
        
        // 홈 화면으로 이동 (뒤로가기 불가)
        navigation.replace('Home');
      } else {
        Alert.alert('오류', '토큰을 받지 못했습니다.');
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
        style={styles.content}
      >
        {/* 로고 영역 */}
        <View style={styles.logo}>
        <Text style={styles.title}>ONE pic</Text>
        <Text style={styles.subtitle}>마트에서 줄서기는 그만</Text>
      </View>

        {/* 입력 필드 영역 */}
        <View style={styles.formContainer}>
          {/* 아이디 입력 */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              placeholderTextColor="#999"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>로그인 하기</Text>
          )}
        </TouchableOpacity>

        {/* 하단 링크 */}
        <View style={styles.footer}>
          {/*회원가입*/}
          <TouchableOpacity 
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupText}>회원가입</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleForgotCredentials}
            disabled={isLoading}
          >
            <Text style={styles.forgotText}>아이디/비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: width * 0.12, // 화면 너비의 12%
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: height * 0.01,
  },
  subtitle: {
    fontSize: width * 0.035, // 화면 너비의 3.5%
    color: '#666',
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
    fontSize: width * 0.04,
    color: '#333',
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
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  signupText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
  },
  forgotText: {
    fontSize: width * 0.033,
    color: '#999',
  },
});

export default LoginScreen;