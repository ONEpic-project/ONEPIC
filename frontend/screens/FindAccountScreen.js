// FindAccountScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '../config/api';
import Header from './components/Header';

const { width, height } = Dimensions.get('window');

const FindAccountScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('id');

  // 아이디 찾기
  const [idName, setIdName] = useState('');
  const [idPhone, setIdPhone] = useState('');
  const [foundId, setFoundId] = useState('');

  // 비밀번호 찾기
  const [pwId, setPwId] = useState('');
  const [pwPhone, setPwPhone] = useState('');
  const [foundPassword, setFoundPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');


  // ================== 아이디 찾기 ==================
  const handleFindId = async () => {
    if (!idName.trim() || !idPhone.trim()) {
      Alert.alert('알림', '성명과 연락처를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/find-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: idName,
          phone: idPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('알림', data.detail);
        setFoundId('');
        return;
      }

      setFoundId(data.login_id);
    } catch (error) {
      Alert.alert('오류', '서버와 연결할 수 없습니다.');
    }
  };

  // ================== 비밀번호 찾기 ==================
  const handleFindPassword = async () => {
    if (!pwId.trim() || !pwPhone.trim()) {
      Alert.alert('알림', '아이디와 연락처를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/find-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: pwId,
          phone: pwPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('알림', data.detail);
        setFoundPassword('');
        setPwMessage('');
        return;
      }

      setFoundPassword(data.temp_password);
      setPwMessage(data.message);
    } catch (error) {
      Alert.alert('오류', '서버와 연결할 수 없습니다.');
    }
  };

    // 클립보드에 비밀번호 복사
    const copyPassword = async () => {
      if (!foundPassword) return;

      await Clipboard.setStringAsync(foundPassword);
      Alert.alert(
        '복사 완료',
        '임시 비밀번호가 클립보드에 복사되었습니다.'
      );
    };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더영역 */}
          <Header navigation={navigation} title="회원가입" />

        {/* 탭 */}
        <View style={styles.tabContainer}>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'id' && styles.activeTab]}
            onPress={() => {
              setActiveTab('id');
              setFoundId('');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'id' && styles.activeTabText]}>
              아이디 찾기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'password' && styles.activeTab]}
            onPress={() => {
              setActiveTab('password');
              setFoundPassword('');
              setPwMessage('');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
              비밀번호 찾기
            </Text>
          </TouchableOpacity>
        </View>
        

        {/* ================== 아이디 찾기 ================== */}
        {activeTab === 'id' ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="성명"
              value={idName}
              onChangeText={setIdName}
            />
            <TextInput
              style={styles.input}
              placeholder="연락처 (- 제외)"
              value={idPhone}
              onChangeText={setIdPhone}
              keyboardType="phone-pad"
            />

            {foundId && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>아이디 : {foundId}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.searchButton} onPress={handleFindId}>
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
                <Text style={styles.loginButtonText}>로그인 하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
        /* ================== 비밀번호 찾기 ================== */
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={pwId}
              onChangeText={setPwId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="연락처 (- 제외)"
              value={pwPhone}
              onChangeText={setPwPhone}
              keyboardType="phone-pad"
            />

            {foundPassword && (
              <View style={styles.resultContainer}>
                <TouchableOpacity onPress={copyPassword}>
                  <Text style={styles.resultText}>
                    임시 비밀번호 :{' '}
                    <Text style={{ textDecorationLine: 'underline' }}>
                      {foundPassword}
                    </Text>
                  </Text>
                </TouchableOpacity>

                <Text style={styles.noticeText}>
                  터치하면 비밀번호가 복사됩니다.
                  {'\n'}
                  로그인 후 반드시 비밀번호를 변경해주세요.
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.searchButton} onPress={handleFindPassword}>
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
                <Text style={styles.loginButtonText}>로그인 하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: width * 0.1,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: height * 0.06,
    borderRadius: height * 0.03,
    borderWidth: 2,
    borderColor: '#FF9500',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: height * 0.015,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FF9500',
  },
  tabText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#FF9500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: height * 0.06,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.035,
    paddingVertical: 10,
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: height * 0.05,
    minHeight: height * 0.03,
  },
  resultText: {
    fontSize: width * 0.045,
    color: '#FF9500',
    fontWeight: '500',
    textAlign: 'center',
  },
  noticeText: {
    marginTop: 10,
    fontSize: width * 0.035,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  searchButton: {
    width: '100%',
    height: height * 0.06,
    backgroundColor: '#FF9500',
    borderRadius: height * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  searchButtonText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginButton: {
    width: '100%',
    height: height * 0.06,
    backgroundColor: '#FFFFFF',
    borderRadius: height * 0.03,
    borderWidth: 2,
    borderColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#FF9500',
  },
    noticeText: {
    marginTop: 10,
    fontSize: width * 0.035,
    color: '#999',
    textAlign: 'center',
  }
});

export default FindAccountScreen;
