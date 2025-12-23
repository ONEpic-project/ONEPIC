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
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';

import Header from './components/Header';

const { width, height } = Dimensions.get('window');

// API URL 설정 (실제 배포 시 환경 변수로 관리 권장)
const API_BASE_URL = 'http://ec2-13-239-10-253.ap-southeast-2.compute.amazonaws.com:8000';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');

  const handleSignup = async () => {
    // 유효성 검사
    if (!name.trim()) {
      Alert.alert('알림', '성명을 입력해주세요.');
      return;
    }
    if (!userId.trim()) {
      Alert.alert('알림', '아이디를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!contact.trim()) {
    Alert.alert('알림', '연락처를 입력해주세요.');
    return;
    }
    if (contact.length !== 11) {
      Alert.alert('알림', '연락처는 11자리로 입력해주세요.');
      return;
    }

    // 회원가입 완료 화면으로 이동
    try {
    const response = await fetch('${API_BASE_URL}/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 🔴 여기!!! 이게 제일 중요
        login_id: userId,   // DB 컬럼명
        password: password,
        username: name,     // 화면의 '성명'
        phone: contact,     // 화면의 '연락처'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert('회원가입 실패', data.detail || '오류 발생');
      return;
    }

    navigation.navigate('SignupComplete');
  } catch (error) {
    Alert.alert('오류', '서버와 연결할 수 없습니다.');
  }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        //style={styles.flex}
      >
        <ScrollView 
          //contentContainerStyle={styles.scrollContent}
          //keyboardShouldPersistTaps="handled"
          //showsVerticalScrollIndicator={false}
        >
          {/* 헤더영역 */}
          <Header 
            navigation={navigation}
            title="회원가입"
          />

          {/* 입력 필드들 */}
          <View style={styles.formContainer}>
            {/* 성명 */}
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="성명"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />

            {/* 아이디 */}
              <TextInput
                style={styles.input}
                value={userId}
                onChangeText={setUserId}
                placeholder="아이디"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />

            {/* 비밀번호 */}
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

            {/* 연락처 */}
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder="연락처"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text 
            style={styles.signupButtonText}
            >회원가입</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    marginBottom: height * 0.08,
    marginTop: height * 0.08,
    paddingHorizontal: width * 0.08,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.05,
  },
  input: {
    width: '95%',
    height: height * 0.06, // 화면 높이의 6%
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.035,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  signupButton: {
    backgroundColor: '#FF9500',
    height: height * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: height * 0.03,
    width: '83%',
    alignSelf: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
});

export default SignupScreen;