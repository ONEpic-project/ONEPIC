import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert 
  } from 'react-native';
import AppText from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './components/Header';
import { fontSizes } from '../config/typography';
import { API_BASE_URL } from '../config/api';

import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const MyPageScreen = ({navigation}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  
  // 원본 값 저장 (취소 시 복원용)
  const [originalName, setOriginalName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');

  // 화면 로드 시 AsyncStorage에서 사용자 정보 불러오기
  useEffect(() => {
  const loadUserInfo = async () => {
    try {
      const storedLoginId = await AsyncStorage.getItem('login_id');
      const storedName = await AsyncStorage.getItem('username');
      const storedPhone = await AsyncStorage.getItem('phone');

      if (storedName) {
        setName(storedName);
        setOriginalName(storedName);
      }
      if (storedPhone) {
        setPhone(storedPhone);
        setOriginalPhone(storedPhone);
      }
      if (storedLoginId) setLoginId(storedLoginId);
      setPassword('*******');
      setOriginalPassword('*******');

    } catch (error) {
      console.log('회원 정보 불러오기 실패', error);
    }
  };

  loadUserInfo();
}, []);


  const handleEdit = () => {
    if (!isEditing) {
      // 수정 모드 진입
      setIsEditing(true);
    } else {
      // 수정 완료 (2차 클릭)
      handleSave();
    }
  };

  const handlePasswordFocus = () => {
    // 비밀번호 필드 클릭 시 *******를 자동으로 제거
    if (password === '*******') {
      setPassword('');
    }
  };

  const handleCancel = () => {
    // 원본 값으로 복원
    setName(originalName);
    setPhone(originalPhone);
    setPassword(originalPassword);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // 유효성 검사
    if (!name.trim()) {
      Alert.alert('알림', '성명을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('알림', '연락처를 입력해주세요.');
      return;
    }
    if (phone.length !== 11) {
      Alert.alert('알림', '연락처는 11자리로 입력해주세요.');
      return;
    }
    // 비밀번호를 입력했는데 6자 미만이면 에러
    if (password && password !== '*******' && password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    // 수정 확인 Alert
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        '회원정보 수정',
        '수정하시겠습니까?',
        [
          { text: '아니오', style: 'cancel', onPress: () => resolve(false) },
          { text: '예', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirm) return;

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name,
          phone: phone,
          password: (password && password !== '*******') ? password : null,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        Alert.alert('수정 실패', data.detail || '요청 처리 중 오류가 발생했습니다.');
        return;
      }

      // AsyncStorage 업데이트
      await AsyncStorage.setItem('username', name);
      await AsyncStorage.setItem('phone', phone);
      
      // 원본 값도 업데이트
      setOriginalName(name);
      setOriginalPhone(phone);
      if (password !== '*******') {
        setOriginalPassword('*******');
        setPassword('*******');
      }

      Alert.alert('알림', '회원정보가 수정되었습니다.');
      setIsEditing(false);
    } catch (e) {
      console.log('회원정보 수정 에러', e);
      Alert.alert('오류', '네트워크 또는 서버 오류입니다.');
    }
  };

  const handleWithdraw = async () => {
    try {
      const confirm = await new Promise((resolve) => {
        Alert.alert(
          '회원탈퇴',
          '정말로 탈퇴하시겠습니까?\n계정과 데이터가 삭제됩니다.',
          [
            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
            { text: '확인', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        Alert.alert('탈퇴 실패', data.detail || '요청 처리 중 오류가 발생했습니다.');
        return;
      }

      // 로컬 저장소 정리 및 로그인 화면으로 이동
      await AsyncStorage.multiRemove(['user_id', 'username', 'login_id', 'access_token', 'phone']);
      Alert.alert('알림', '회원탈퇴가 완료되었습니다.');
      navigation.replace('Login');
    } catch (e) {
      console.log('회원탈퇴 에러', e);
      Alert.alert('오류', '네트워크 또는 서버 오류입니다.');
    }
  };

  const handleLogout = () => {
      // 카카오 로그아웃 URL 호출을 위해 WebView 활성화
      // (만약 카카오 유저가 아니어도 호출해도 상관없음, 에러나면 그냥 로컬 로그아웃 진행)
      setShowLogoutModal(true);
      
      // 혹시 WebView가 5초 동안 응답 없으면 강제 로그아웃
      setTimeout(() => {
          if (showLogoutModal) { // 아직 안 끝났으면
              performLocalLogout();
          }
      }, 3000);
  };

  const performLocalLogout = async () => {
    try {
      setShowLogoutModal(false); // 확실히 닫기
      // 로컬 토큰 삭제
      await AsyncStorage.multiRemove(['user_id', 'username', 'login_id', 'access_token', 'phone']);
      Alert.alert('알림', '로그아웃 되었습니다.');
      
      // 로그인 화면으로 이동 (스택 초기화)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.log('로그아웃 에러', e);
      Alert.alert('오류', '로그아웃 처리 중 에러가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Header 
      navigation={navigation}
      title="회원 정보"
      />

      {/* 입력 필드 */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={isEditing}
        />
        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          editable={isEditing}
          keyboardType="phone-pad"
        />
        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={loginId}
          onChangeText={setLoginId}
          editable={false}
        />
        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          onFocus={handlePasswordFocus}
          editable={isEditing}
          secureTextEntry
        />
        <View style={styles.divider} />

        {/* 버튼 그룹 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.editButton,
              isEditing && styles.editButtonActive
            ]}
            onPress={handleEdit}
          >
            <AppText style={[
              styles.editButtonText,
              isEditing && styles.editButtonTextActive
            ]}>
              수정하기
            </AppText>
          </TouchableOpacity>

          {/* 취소 버튼 - 수정 모드에서만 표시 */}
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <AppText style={styles.cancelButtonText}>취소</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 하단 메뉴 */}
      <View style={styles.bottomMenu}>

<<<<<<< HEAD
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>로그아웃</Text>
=======
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <AppText style={styles.logout}>로그아웃</AppText>
>>>>>>> feat/global-typography
        </TouchableOpacity>

        <TouchableOpacity onPress={handleWithdraw}>
          <AppText style={styles.withdraw}>탈퇴하기</AppText>
        </TouchableOpacity>
      </View>
      
      {/* 카카오 로그아웃용 히든 WebView (사이즈 0이면 로드 안될 수 있음) */}
      {showLogoutModal && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0.1, bottom: 0 }}>
          <WebView
            source={{ uri: `https://kauth.kakao.com/oauth/logout?client_id=14d4155ec774b7dfda7d393aa289f385&logout_redirect_uri=http://localhost:8081/oauth/callback/kakao` }}
            onLoadStart={(e) => console.log('Logout WebView Load Start:', e.nativeEvent.url)}
            onShouldStartLoadWithRequest={(request) => {
              console.log('Logout WebView Request:', request.url);
              if (request.url.includes('oauth/callback/kakao')) {
                  setShowLogoutModal(false);
                  performLocalLogout();
                  return false;
              }
              return true;
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('Logout WebView Error:', nativeEvent);
              // localhost 접속 에러인 경우에만 성공으로 처리
              if (nativeEvent.url && nativeEvent.url.includes('oauth/callback/kakao')) {
                 setShowLogoutModal(false);
                 performLocalLogout();
              } else {
                 // 그 외 에러는 진짜 에러일 수 있음
                 if (nativeEvent.url === "") {
                     // URL이 비어서 온다면... 일단 무시하거나 로컬 로그아웃만 진행?
                     // 하지만 쿠키삭제가 안됐을 수 있음.
                 }
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.06,
    paddingHorizontal: width * 0.05,
  },
  backButton: {
    position: 'absolute',
    left: width * 0.05,
    fontSize: fontSizes.lg,
    color: '#676767',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: '#000000',
  },
  formContainer: {
    marginTop: height * 0.12,
    paddingHorizontal: width * 0.15,
  },
  input: {
    fontSize: fontSizes.md,
    color: '#4B4B4B',
    paddingVertical: height * 0.012,
    paddingLeft: width * 0.025,
  },
  divider: {
    height: 1,
    backgroundColor: '#848484',
    marginVertical: height * 0.01,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: height * 0.025,
    justifyContent: 'flex-end',
    gap: width * 0.02,
  },
  editButton: {
    paddingHorizontal: width * 0.038,
    paddingVertical: height * 0.008,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFC685',
    borderRadius: 39,
  },
  editButtonActive: {
    backgroundColor: '#FF9317',
    borderWidth: 0,
  },
  editButtonText: {
    fontSize: fontSizes.sm,
    color: '#FF9317',
  },
  editButtonTextActive: {
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: width * 0.038,
    paddingVertical: height * 0.008,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFC685',
    borderRadius: 39,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    color: '#FF9317',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: height * 0.12,
    alignSelf: 'center',
  },
  logout: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  withdraw: {
    fontSize: fontSizes.sm,
    color: '#C3C3C3',
    textAlign: 'center',
  },
});

export default MyPageScreen;
