import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// User should replace this with their actual Key
const REST_API_KEY = "14d4155ec774b7dfda7d393aa289f385"; 
const REDIRECT_URI = "http://localhost:8081/oauth/callback/kakao";

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;

const { width, height } = Dimensions.get('window');

const KakaoLogin = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleKakaoLoginPress = () => {
    setModalVisible(true);
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    // When redirected to our callback, we catch the "code" from URL
    const { url } = newNavState;
    if (!url) return;

    if (url.includes('code=')) {
      // Parse auth code
      const code = url.split('code=')[1];
      console.log('Kakao Auth Code:', code);
      
      setModalVisible(false);
      
      // Send code to Backend
      handleBackendLogin(code);
    }
    
    // Handle error or cancel
    if (url.includes('error=')) {
        setModalVisible(false);
        Alert.alert("로그인 취소/실패", "사용자가 취소했거나 오류가 발생했습니다.");
    }
  };

  const handleBackendLogin = async (code) => {
    try {
      // remove any extra params if needed
      // 카카오가 code 뒤에 &state=... 등을 붙일 수 있으므로 정제
      const cleanCode = code.split('&')[0];

      const response = await axios.post(`${API_BASE_URL}/api/auth/kakao`, {
        code: cleanCode
      });

      const data = response.data;
      console.log('Kakao Login Success:', data);

      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        if (data.user_id) await AsyncStorage.setItem('user_id', data.user_id.toString());
        if (data.username) await AsyncStorage.setItem('username', data.username);
        
        // 홈으로 이동
        navigation.replace('Home');
      } else {
        Alert.alert('오류', '로그인 토큰을 받지 못했습니다.');
      }

    } catch (e) {
      console.error('Kakao Login Error:', e);
      if (e.response && e.response.data && e.response.data.detail) {
        console.error('Server detailed error:', e.response.data.detail);
        Alert.alert('로그인 실패', e.response.data.detail);
      } else {
        Alert.alert('로그인 실패', '서버 통신 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.kakaoButton} 
        onPress={handleKakaoLoginPress}
        activeOpacity={0.8}
      >
        {/* Simple Label for now, prefer Image if available */}
        <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Android Back button
      >
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Text style={{ fontSize: 16 }}>닫기</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>카카오 로그인</Text>
            </View>
            <WebView
                source={{ uri: KAKAO_AUTH_URL }}
                style={{ flex: 1 }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" color="#FEE500" />}
            />
        </SafeAreaView>
      </Modal>
    </>
  );
};

// Need SafeAreaView for Modal content
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    width: '85%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 15,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
    backgroundColor: '#fff'
  },
  closeBtn: {
    position: 'absolute',
    left: 20,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default KakaoLogin;
