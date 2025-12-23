// FindAccountScreen.js
// 서버 연동 시 주석 처리된 API 호출 코드의 주석을 해제하고, Mock DB 부분을 제거
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
  const handleFindId = async () => {
    if (!idName.trim() || !idPhone.trim()) {
      Alert.alert('알림', '성명과 연락처를 모두 입력해주세요.');
      return;
    }

    // TODO: 실제 API 호출로 교체
    // try {
    //   const response = await fetch('http://서버IP:8000/api/auth/find-id', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       name: idName,
    //       phone: idPhone,
    //     }),
    //   });
    //
    //   const data = await response.json();
    //
    //   if (!response.ok) {
    //     Alert.alert('알림', data.detail || '일치하는 회원 정보가 없습니다.');
    //     setFoundId('');
    //     return;
    //   }
    //
    //   setFoundId(data.id);
    // } catch (error) {
    //   Alert.alert('오류', '서버와 연결할 수 없습니다.');
    // }

    // Mock DB 검색
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
  const handleFindPassword = async () => {
    if (!pwId.trim() || !pwPhone.trim()) {
      Alert.alert('알림', '아이디와 연락처를 모두 입력해주세요.');
      return;
    }

    // TODO: 실제 API 호출로 교체
    // try {
    //   const response = await fetch('http://서버IP:8000/api/auth/find-password', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       login_id: pwId,
    //       phone: pwPhone,
    //     }),
    //   });
    //
    //   const data = await response.json();
    //
    //   if (!response.ok) {
    //     Alert.alert('알림', data.detail || '일치하는 회원 정보가 없습니다.');
    //     setFoundPassword('');
    //     return;
    //   }
    //
    //   setFoundPassword(data.password);
    // } catch (error) {
    //   Alert.alert('오류', '서버와 연결할 수 없습니다.');
    // }

    // Mock DB 검색
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
    navigation.navigate('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 탭 버튼 */}
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
            <TextInput
              style={styles.input}
              placeholder="성명"
              placeholderTextColor="#999"
              value={idName}
              onChangeText={setIdName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="연락처 (- 제외)"
              placeholderTextColor="#999"
              value={idPhone}
              onChangeText={setIdPhone}
              keyboardType="phone-pad"
            />

            {/* 결과 표시 영역 */}
            {foundId ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>아이디 : {foundId}</Text>
              </View>
            ) : (
              <View style={styles.resultContainer} />
            )}

            {/* 하단 버튼 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleFindId}
              >
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={goToLogin}
              >
                <Text style={styles.loginButtonText}>로그인 하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 비밀번호 찾기 탭 */
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              placeholderTextColor="#999"
              value={pwId}
              onChangeText={setPwId}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="연락처 (- 제외)"
              placeholderTextColor="#999"
              value={pwPhone}
              onChangeText={setPwPhone}
              keyboardType="phone-pad"
            />

            {/* 결과 표시 영역 */}
            {foundPassword ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>비밀번호 : {foundPassword}</Text>
              </View>
            ) : (
              <View style={styles.resultContainer} />
            )}

            {/* 하단 버튼 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleFindPassword}
              >
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={goToLogin}
              >
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
    marginVertical: height * 0.08,
    minHeight: height * 0.03,
  },
  resultText: {
    fontSize: width * 0.045,
    color: '#FF9500',
    fontWeight: '500',
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
});

export default FindAccountScreen;