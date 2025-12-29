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

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://서버IP:8000'; // ✅ 실제 서버 주소로 수정

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
      const response = await fetch(`${API_BASE_URL}/auth/find-id`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/find-password`, {
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

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

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
                <Text style={styles.resultText}>
                  임시 비밀번호 : {foundPassword}
                </Text>
                <Text style={styles.noticeText}>
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

export default FindAccountScreen;
