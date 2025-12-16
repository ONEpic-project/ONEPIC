import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const SignupCompleteScreen = ({ navigation }) => {
  const handleGoHome = () => {
    // 로그인 화면으로 이동 (스택 초기화)
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 완료 메시지 */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            회원가입이{'\n'}완료되었습니다!
          </Text>
        </View>

        {/* 홈 화면 가기 버튼 */}
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>로그인 화면으로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 36,
  },
  homeButton: {
    backgroundColor: '#FF9500',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 40,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignupCompleteScreen;
