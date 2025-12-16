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
} from 'react-native';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');

  const handleSignup = () => {
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

    // 회원가입 완료 화면으로 이동
    navigation.navigate('SignupComplete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 제목 */}
          <Text style={styles.title}>회원가입</Text>

          {/* 입력 필드들 */}
          <View style={styles.formContainer}>
            {/* 성명 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>성명</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder=""
                autoCapitalize="words"
              />
            </View>

            {/* 아이디 */}
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

            {/* 비밀번호 */}
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

            {/* 연락처 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>연락처</Text>
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder=""
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>회원가입</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 60,
  },
  formContainer: {
    marginBottom: 80,
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
    backgroundColor: '#F0F0F0',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    borderRadius: 4,
  },
  signupButton: {
    backgroundColor: '#FF9500',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignupScreen;