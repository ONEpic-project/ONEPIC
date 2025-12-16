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
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 간단한 유효성 검사
    // if (!userId.trim()) {
    //   Alert.alert('알림', '아이디를 입력해주세요.');
    //   return;
    // }
    // if (!password.trim()) {
    //   Alert.alert('알림', '비밀번호를 입력해주세요.');
    //   return;
    // }

    // // 로그인 로직 (실제로는 API 호출)
    // console.log('Login:', userId, password);
    
    // 로그인 성공 시 홈으로 이동 (뒤로가기 불가)
    navigation.replace('Home');
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
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ONEPIC</Text>
        </View>

        {/* 입력 필드 영역 */}
        <View style={styles.formContainer}>
          {/* 아이디 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder=""
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder=""
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* 하단 링크 */}
        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.signupText}>회원가입</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotCredentials}>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: '#4A90E2',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    borderRadius: 4,
  },
  loginButton: {
    backgroundColor: '#FF9500',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomLinks: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  forgotText: {
    fontSize: 14,
    color: '#999',
  },
});

export default LoginScreen;