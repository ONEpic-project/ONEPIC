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
} from 'react-native';

const FindAccountScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('id'); // 'id' or 'password'
  
  // 아이디 찾기 상태
  const [idName, setIdName] = useState('');
  const [idPhone, setIdPhone] = useState('');
  const [foundId, setFoundId] = useState('');
  
  // 비밀번호 찾기 상태
  const [pwId, setPwId] = useState('');
  const [pwPhone, setPwPhone] = useState('');
  const [foundPassword, setFoundPassword] = useState('');

  // Mock DB 데이터 (실제로는 서버 API 호출)
  const mockUsers = [
    { name: 'qwer', phone: '01012345678', id: 'qwer1234', password: 'qwer****' },
    { name: 'asdf', phone: '01098765432', id: 'asdf1234', password: 'asdf****' },
  ];

  // 아이디 찾기 함수
  const handleFindId = () => {
    if (!idName.trim() || !idPhone.trim()) {
      Alert.alert('알림', '성명과 연락처를 모두 입력해주세요.');
      return;
    }

    // Mock DB 검색 (실제로는 서버 API 호출)
    const user = mockUsers.find(
      u => u.name === idName && u.phone === idPhone
    );

    if (user) {
      setFoundId(user.id);
    } else {
      Alert.alert('알림', '일치하는 회원 정보가 없습니다.');
      setFoundId('');
    }
  };

  // 비밀번호 찾기 함수
  const handleFindPassword = () => {
    if (!pwId.trim() || !pwPhone.trim()) {
      Alert.alert('알림', '아이디와 연락처를 모두 입력해주세요.');
      return;
    }

    // Mock DB 검색 (실제로는 서버 API 호출)
    const user = mockUsers.find(
      u => u.id === pwId && u.phone === pwPhone
    );

    if (user) {
      setFoundPassword(user.password);
    } else {
      Alert.alert('알림', '일치하는 회원 정보가 없습니다.');
      setFoundPassword('');
    }
  };

  // 로그인 화면으로 이동
  const goToLogin = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <Text style={styles.header}>
          {activeTab === 'id' ? '가입정보 찾기-아이디' : '가입정보 찾기-비밀번호'}
        </Text>

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
            }}
          >
            <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
              비밀번호 찾기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 아이디 찾기 탭 */}
        {activeTab === 'id' ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>성명</Text>
            <TextInput
              style={styles.input}
              placeholder="성명을 입력하세요"
              value={idName}
              onChangeText={setIdName}
            />

            <Text style={styles.label}>연락처</Text>
            <Text style={styles.helperText}>"-"을 제외하고 입력해 주세요.</Text>
            <TextInput
              style={styles.input}
              placeholder="연락처를 입력하세요"
              value={idPhone}
              onChangeText={setIdPhone}
              keyboardType="phone-pad"
            />

            {/* 결과 표시 */}
            {foundId ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>아이디 : {foundId}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.searchButton} onPress={handleFindId}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>로그인 하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 비밀번호 찾기 탭 */
          <View style={styles.formContainer}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력하세요"
              value={pwId}
              onChangeText={setPwId}
            />

            <Text style={styles.label}>연락처</Text>
            <Text style={styles.helperText}>"-"을 제외하고 입력해 주세요.</Text>
            <TextInput
              style={styles.input}
              placeholder="연락처를 입력하세요"
              value={pwPhone}
              onChangeText={setPwPhone}
              keyboardType="phone-pad"
            />

            {/* 결과 표시 */}
            {foundPassword ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>비밀번호 : {foundPassword}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.searchButton} onPress={handleFindPassword}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>로그인 하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  activeTab: {
    borderBottomColor: '#FF9800',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#FF9800',
  },
  searchButton: {
    backgroundColor: '#FF9800',
    padding: 18,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#d0d0d0',
    padding: 18,
    borderRadius: 5,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FindAccountScreen;