import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import Header from './components/Header';
import { API_BASE_URL } from '../config/api';
import { fontSizes } from '../config/typography';

const { height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const scrollRef = useRef(null);

  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');

  const inputRefs = {
    name: useRef(null),
    loginId: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    passwordConfirm: useRef(null),
  };

  const scrollToInput = (inputRef) => {
    if (!inputRef.current || !scrollRef.current) return;

    inputRef.current.measureLayout(
      scrollRef.current,
      (x, y) => {
        scrollRef.current.scrollTo({
          y: Math.max(0, y - height * 0.25),
          animated: true,
        });
      },
      () => {}
    );
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '성명을 입력해주세요.');
      return;
    }

    if (!loginId.trim()) {
      Alert.alert('알림', '아이디를 입력해주세요.');
      return;
    }

    if (!phone.trim() || phone.length !== 11) {
      Alert.alert('알림', '연락처는 11자리로 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      setPasswordConfirmError('');
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      setPasswordError('');
      return;
    }

    setPasswordError('');
    setPasswordConfirmError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: loginId,
          password,
          username: name,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('회원가입 실패', data.detail || '오류 발생');
        return;
      }

      await AsyncStorage.setItem('login_id', loginId);
      await AsyncStorage.setItem('username', name);
      await AsyncStorage.setItem('phone', phone);

      navigation.navigate('SignupComplete');
    } catch (e) {
      Alert.alert('오류', '서버와 연결할 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ marginTop: -45 }}>
          <Header navigation={navigation} title="회원가입" />
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.container}>
            <View style={styles.form}>
              <Field label="성명">
                <TextInput
                  ref={inputRefs.name}
                  style={styles.input}
                  value={name}
                  placeholder="성명을 입력해 주세요"
                  placeholderTextColor="#C8C8C8"
                  onChangeText={setName}
                  onFocus={() => scrollToInput(inputRefs.name)}
                />
              </Field>

              <Field label="아이디">
                <TextInput
                  ref={inputRefs.loginId}
                  style={styles.input}
                  value={loginId}
                  placeholder="아이디를 입력해 주세요"
                  placeholderTextColor="#C8C8C8"
                  autoCapitalize="none"
                  onChangeText={setLoginId}
                  onFocus={() => scrollToInput(inputRefs.loginId)}
                />
              </Field>

              <Field label="연락처">
                <TextInput
                  ref={inputRefs.phone}
                  style={styles.input}
                  value={phone}
                  placeholder="01012345678"
                  placeholderTextColor="#C8C8C8"
                  keyboardType="phone-pad"
                  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                  onFocus={() => scrollToInput(inputRefs.phone)}
                />
              </Field>

              <Field
                label="비밀번호"
                message={passwordError}
                messageType="error"
              >
                <View style={styles.passwordWrapper}>
                  <TextInput
                    key={showPassword ? 'password-show' : 'password-hide'}
                    ref={inputRefs.password}
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    placeholder="6자 이상 입력해 주세요"
                    placeholderTextColor="#C8C8C8"
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordConfirmError('');
                    }}
                    onFocus={() => scrollToInput(inputRefs.password)}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={25}  // 아이콘 크기 조정
                      color="#9A9A9A"
                    />
                  </TouchableOpacity>
                </View>
              </Field>

              <Field
                label="비밀번호 확인"
                message={passwordConfirmError}
                messageType="error"
              >
                <View style={styles.passwordWrapper}>
                  <TextInput
                    key={showPasswordConfirm ? 'confirm-show' : 'confirm-hide'}
                    ref={inputRefs.passwordConfirm}
                    style={[styles.input, { flex: 1 }]}
                    value={passwordConfirm}
                    placeholder="비밀번호를 다시 입력해 주세요"
                    placeholderTextColor="#C8C8C8"
                    secureTextEntry={!showPasswordConfirm}
                    onChangeText={setPasswordConfirm}
                    onFocus={() => scrollToInput(inputRefs.passwordConfirm)}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPasswordConfirm((prev) => !prev)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPasswordConfirm ? 'eye-off' : 'eye'}
                      size={25}  // 아이콘 크기 조정
                      color="#9A9A9A"
                    />
                  </TouchableOpacity>
                </View>
              </Field>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.primary} onPress={handleSignup}>
                <Text style={styles.primaryText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* 공통 필드 */
const Field = ({ label, children, message, messageType }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
    <View style={styles.divider} />
    <Text
      style={[
        styles.messageSlot,
        messageType === 'error' && styles.errorText,
      ]}
    >
      {message ? message : ' '}
    </Text>
  </View>
);

/* styles */
const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },

  form: { marginTop: 45, width: 296, alignSelf: 'center' },
  field: { marginBottom: 15 },

  label: { fontSize: fontSizes.md, color: '#848484', marginBottom: 12 },
  input: { fontSize: fontSizes.lg, color: '#4B4B4B' },
  divider: { height: 1, backgroundColor: '#848484', marginTop: 6 },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  messageSlot: {
    marginTop: 4,
    minHeight: 18,
    fontSize: fontSizes.sm,
    color: '#848484',
  },
  errorText: { color: '#FF3B30' },

  buttons: { alignItems: 'center', marginTop: height * 0.06 },
  primary: {
    width: 344,
    height: 50,
    backgroundColor: '#FF9317',
    borderRadius: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: fontSizes.lg },
});

export default SignupScreen;
