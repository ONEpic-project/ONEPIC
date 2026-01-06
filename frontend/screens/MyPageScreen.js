import React, { useState, useEffect, useRef } from 'react';
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

const MyPageScreen = ({ navigation }) => {

  const [isEditing, setIsEditing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('*******');
  const [passwordError, setPasswordError] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [infoMessage, setInfoMessage] = useState('');
  const [infoMessageType, setInfoMessageType] = useState('info'); 

  const [showPassword, setShowPassword] = useState(false); 

  const [snsType, setSnsType] = useState('local');

  const [origin, setOrigin] = useState({
    name: '',
    phone: '',
    password: '*******',
  });

  const scrollRef = useRef(null);

  const isAutoScrolling = useRef(false);

  const inputRefs = {
    name: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const scrollToInput = (inputRef) => {
    if (!inputRef.current || !scrollRef.current) return;

    isAutoScrolling.current = true;

    inputRef.current.measureLayout(
      scrollRef.current,
      (x, y, width, height) => {
        const screenCenter = Dimensions.get('window').height / 2;

        scrollRef.current.scrollTo({
          y: Math.max(0, y - screenCenter * 0.6),
          animated: true,
        });

        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 300);
      },
      () => {}
    );
  };

  useEffect(() => {
  const timer = setTimeout(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
  }, 0);

  return () => clearTimeout(timer);
  }, []);

  /* 사용자 정보 로드 */
  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        // 우선 API에서 최신 정보를 가져옵니다.
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
             headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setLoginId(data.login_id || '');
            setName(data.username || '');
            setPhone(data.phone || '');
            setSnsType(data.sns_type || 'local');
            setPassword('*******');

            setOrigin({
              name: data.username || '',
              phone: data.phone || '',
              password: '*******',
            });
            return; 
          }
        }
        
        // API 로드 실패 시 로컬 스토리지 폴백
        const login_id = await AsyncStorage.getItem('login_id');
        const username = await AsyncStorage.getItem('username');
        const phone = await AsyncStorage.getItem('phone');

        setLoginId(login_id || '');
        setName(username || '');
        setPhone(phone || '');
        setPassword('*******');

        setOrigin({
          name: username || '',
          phone: phone || '',
          password: '*******',
        });
      } catch (e) {
        console.log('Load user info failed', e);
      }
    };
    load();
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      setIsEditing(true);

      // 안내 문구 표시
      setInfoMessage('수정할 정보를 선택해 주세요.');
      setInfoMessageType('info');
    } else {
      handleSave();
    }
  };


  const handleCancel = () => {
    setName(origin.name);
    setPhone(origin.phone);
    setPassword(origin.password);
    setConfirmPassword(origin.password);

    setPasswordError('');
    setInfoMessage('');          // 안내 문구 제거
    setInfoMessageType('info');  // 타입 초기화 (안전)

    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handlePasswordFocus = () => {
    if (password === '*******') setPassword('');
    setPasswordError('');
  };

  const handleConfirmPasswordFocus = () => {
    if (confirmPassword === '*******') setConfirmPassword('');
    setPasswordError('');
  };

  const handleSave = async () => {
    if (password && password !== '*******' && password.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    // 유효성 검사: 비밀번호 일치 여부 확인
    if (isEditing && password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const confirm = await new Promise((resolve) => {
      Alert.alert('회원정보 수정', '수정하시겠습니까?', [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '확인', onPress: () => resolve(true) },
      ]);
    });
    if (!confirm) return;

    const token = await AsyncStorage.getItem('access_token');

    // 수정 완료 인라인 메시지
    setInfoMessage('수정이 완료되었습니다.');
    setInfoMessageType('success');

    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: name,
        phone,
        password: password !== '*******' ? password : null,
      }),
    });

    if (!res.ok) {
      Alert.alert('오류', '회원정보 수정에 실패했습니다.');
      return;
    }

    await AsyncStorage.setItem('username', name);
    await AsyncStorage.setItem('phone', phone);


    setOrigin({ name, phone, password: '*******' });
    setPassword('*******');
    setConfirmPassword('*******'); // 추가

    setInfoMessage('수정이 완료되었습니다.');
    setInfoMessageType('success');

    setIsEditing(false);
    Keyboard.dismiss();
  };

  

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      'user_id',
      'username',
      'login_id',
      'access_token',
      'phone',
    ]);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleWithdraw = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        '회원 탈퇴',
        '정말 탈퇴하시겠습니까?\n계정 정보가 모두 삭제됩니다.',
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '확인', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirm) return;

    const token = await AsyncStorage.getItem('access_token');

    await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await AsyncStorage.multiRemove([
      'user_id',
      'username',
      'login_id',
      'access_token',
      'phone',
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };


  return (
    <>
    <Header navigation={navigation} title="회원 정보" />

    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
    
          
        
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          <View style={styles.container}>

            <View style={styles.form}>
              <Field label="성명">
                <TextInput
                  ref={inputRefs.name}
                  style={[styles.input, snsType !== 'local' && styles.disabledInput]}
                  value={name}
                  editable={isEditing && snsType === 'local'}
                  onFocus={() => scrollToInput(inputRefs.name)}
                  onChangeText={setName}
                />
              </Field>

              <Field label="연락처">
                <TextInput
                  ref={inputRefs.phone}
                  style={[styles.input, snsType !== 'local' && styles.disabledInput]}
                   value={phone ?? ''}
                  editable={isEditing && snsType === 'local'}
                  keyboardType="phone-pad"
                  onFocus={() => scrollToInput(inputRefs.phone)}
                  onChangeText={(text) => {
                    if(snsType === 'local') setPhone(text.replace(/[^0-9]/g, ''));
                  }}
                />
              </Field>

              <Field label="아이디">
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={snsType === 'local' ? loginId : ''}
                  editable={false}
                />
              </Field>

              <Field
                label="비밀번호"
                message={passwordError}
                messageType={passwordError ? 'error' : 'info'}
              >
                <View style={[styles.passwordWrapper, { borderBottomWidth: 0 }]}>
                    <TextInput
                    ref={inputRefs.password}
                    style={[
                        styles.input, 
                        { flex: 1 }, 
                        snsType !== 'local' && styles.disabledInput
                    ]}
                    value={
                      snsType !== 'local' 
                        ? (password || '*******') 
                        : (isEditing && password === '*******' && showPassword ? '' : password)
                    }
                    editable={isEditing && snsType === 'local'}
                    secureTextEntry={isEditing ? !showPassword : true}
                    placeholder={isEditing ? "6자 이상 입력해 주세요" : ""}
                    placeholderTextColor="#C8C8C8"
                    onFocus={() => {
                        if (snsType === 'local') {
                        handlePasswordFocus();
                        scrollToInput(inputRefs.password);
                        }
                    }}
                    onChangeText={setPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => inputRefs.confirmPassword.current?.focus()}
                    />
                    {isEditing && (
                     <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                    >
                        <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={25}
                        color="#9A9A9A"
                        />
                    </TouchableOpacity>
                    )}
                </View>
              </Field>

              {/* 5. 비밀번호 확인 필드 추가 */}
                {isEditing && (
                  <Field
                    label="비밀번호 확인"
                    message={password !== confirmPassword && confirmPassword !== '' ? "비밀번호가 일치하지 않습니다." : ""}
                    messageType="error"
                  >
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        ref={inputRefs.confirmPassword}
                        style={[styles.input, { flex: 1 }]}
                        value={confirmPassword === '*******' ? '' : confirmPassword}
                        editable={isEditing}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="다시 한번 입력해 주세요"
                        onFocus={() => {
                          handleConfirmPasswordFocus();
                          scrollToInput(inputRefs.confirmPassword);
                        }}
                        onChangeText={setConfirmPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                        <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={25} color="#9A9A9A" />
                      </TouchableOpacity>
                    </View>
                  </Field>
                )}
             
            </View>

            <View style={styles.buttons}>
              {(snsType === 'kakao' || snsType === 'google') ? (
                <View style={styles.snsNoticeContainer}>
                  <Text style={styles.snsNoticeText}>
                    {snsType === 'kakao' ? '카카오' : '구글'} 로그인 계정은 수정이 불가능합니다.
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.primary} onPress={handleEdit}>
                    <Text style={styles.primaryText}>
                      {isEditing ? '저장하기' : '회원 정보 수정하기'}
                    </Text>
                  </TouchableOpacity>

                  {isEditing && (
                    <TouchableOpacity style={styles.outline} onPress={handleCancel}>
                      <Text style={styles.outlineText}>취소</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {!isEditing && (
                <TouchableOpacity style={styles.outline} onPress={handleLogout}>
                  <Text style={styles.outlineText}>로그아웃 하기</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleWithdraw}>
                <Text style={styles.withdraw}>회원 탈퇴</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
};

/* 공통 필드 */
const Field = ({ label, children, message, messageType }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
    <View style={styles.divider} />

    {/*{ 고정 메시지 슬롯 }*/}
    <Text
      style={[
        styles.messageSlot,
        messageType === 'error' && styles.errorText,
        messageType === 'success' && styles.successText,
      ]}
    >
      {message ? message : ' '}
    </Text>
  </View>
);


/* styles */
const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  scroll: { flexGrow: 1, paddingBottom: height * 0.18 },

  form: { marginTop: 45, width: 296, alignSelf: 'center' },
  field: { marginBottom: 15 },
  label: { fontSize: fontSizes.md, color: '#848484', marginBottom: 5 },
  input: { fontSize: fontSizes.lg, color: '#4B4B4B' },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#A4A4A4', paddingHorizontal: 5 },
  readonly: { color: '#A4A4A4' },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#A4A4A4', paddingHorizontal: 5 },
  readonly: { color: '#A4A4A4' },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
  },
  divider: { height: 1, backgroundColor: '#848484', marginTop: 6 },

  error: { marginTop: 15, color: '#FF3B30', fontSize: fontSizes.sm },

  buttons: { alignItems: 'center', marginTop: height * 0.06 },
  primary: {
    width: 344,
    height: 50,
    backgroundColor: '#FF9317',
    borderRadius: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: { color: '#fff', fontSize: fontSizes.lg },
  outline: {
    width: 344,
    height: 50,
    borderRadius: 300,
    borderWidth: 1,
    borderColor: '#A4A4A4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineText: { color: '#A4A4A4', fontSize: fontSizes.md },
  withdraw: { color: '#C3C3C3', fontSize: fontSizes.md },
  
  errorSlot: {
  marginTop: 8,
  fontSize: fontSizes.sm,
  color: '#FF3B30',
  lineHeight: 18,
  minHeight: 18,
  },

  messageSlot: {
    marginTop: 8,
    minHeight: 18,
    fontSize: fontSizes.sm,
    color: '#848484',
  },

  successText: {
    color: '#34C759',
  },

  errorText: {
    color: '#FF3B30',
  },

  snsNoticeContainer: {
    width: 344,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
  },
  snsNoticeText: {
    color: '#888',
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
});

export default MyPageScreen;
