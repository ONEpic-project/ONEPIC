import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions 
  } from 'react-native';
import Header from './components/Header';

const { width, height } = Dimensions.get('window');

const MyPageScreen = ({navigation}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('성이름');
  const [phone, setPhone] = useState('01012345678');
  const [username, setUsername] = useState('TheName');
  const [password, setPassword] = useState('*******');

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // 여기에 저장 로직 추가
    setIsEditing(true);
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
          value={username}
          onChangeText={setUsername}
          editable={isEditing}
        />
        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
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
            <Text style={[
              styles.editButtonText,
              isEditing && styles.editButtonTextActive
            ]}>
              수정하기
            </Text>
          </TouchableOpacity>

          {/* 취소? 수정완료? */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 메뉴 이거는 시간이 되면...*/}
      <View style={styles.bottomMenu}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.logout}>로그아웃</Text>
          </TouchableOpacity>
        <Text style={styles.withdraw}>탈퇴하기</Text>
      </View>
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
    fontSize: width * 0.06,
    color: '#676767',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: '600',
    color: '#000000',
  },
  formContainer: {
    marginTop: height * 0.12,
    paddingHorizontal: width * 0.15,
  },
  input: {
    fontSize: width * 0.04,
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
    fontSize: width * 0.035,
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
    fontSize: width * 0.035,
    color: '#FF9317',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: height * 0.12,
    alignSelf: 'center',
  },
  logout: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  withdraw: {
    fontSize: width * 0.04,
    color: '#C3C3C3',
    textAlign: 'center',
  },
});

export default MyPageScreen;
