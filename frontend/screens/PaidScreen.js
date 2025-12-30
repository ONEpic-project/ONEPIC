import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import AppText from '../components/AppText';

const { width, height } = Dimensions.get('window');

const SignupCompleteScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 축하 이미지 */}
        <Image 
          source={require('../assets/paidcard.png')} // 실제 이미지 경로로 변경
          style={styles.celebrationImage}
          resizeMode="contain"
        />
        
        {/* 완료 메시지 */}
        <View style={styles.messageContainer}>
          <AppText style={styles.messageText}>결제가</AppText>
          <AppText style={styles.messageText}>완료되었습니다!</AppText>
        </View>
      </View>

      {/* 홈 화면 가기 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
        style={styles.homeButton} 
        onPress={() => navigation.navigate('Home')}
        >
          <AppText style={styles.homeButtonText}>홈 화면 가기</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  celebrationImage: {
    width: 180,
    height: 180,
    marginBottom: 50,
  },
  messageContainer: {
    alignItems: 'center',
  },
  messageText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 80,
  },
  homeButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF9500',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SignupCompleteScreen;