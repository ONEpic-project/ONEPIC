import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,       
  Dimensions
} from 'react-native';
import AppText from '../components/AppText';
import { fontSizes } from '../config/typography';

const { width, height } = Dimensions.get('window');

const SignupCompleteScreen = ({ navigation }) => {
  const handleGoHome = () => {
    // 로그인된 상태로 홈 화면으로 이동
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 축하 이미지 */}
        <Image 
          source={require('../assets/celebration.png')} // 실제 이미지 경로로 변경
          style={styles.celebrationImage}
          resizeMode="contain"
        />
        
        {/* 완료 메시지 */}
        <View style={styles.messageContainer}>
          <AppText style={styles.messageText}>회원가입이</AppText>
          <AppText style={styles.messageText}>완료되었습니다!</AppText>
        </View>
      </View>

      {/* 홈 화면 가기 버튼 */}
      <View style={styles.buttonContainer}>

        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
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
    fontSize: fontSizes.xl,
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
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SignupCompleteScreen;
