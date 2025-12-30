import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Google Client ID from User
const GOOGLE_CLIENT_ID = "663143166468-soaciatlmv3tdbut721uiktlt5urrjd2.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:8081/oauth/callback/google";

// Google Auth URL
const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&prompt=select_account`;

const { width, height } = Dimensions.get('window');

const GoogleLogin = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleGoogleLoginPress = () => {
    setModalVisible(true);
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    if (!url) return;

    // Google returns code in URL
    if (url.includes('code=')) {
      const code = url.split('code=')[1];
      console.log('Google Auth Code:', code);
      
      setModalVisible(false);
      handleBackendLogin(code);
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    // Localhost connection error -> Treat as success if it has code
    if (nativeEvent.url && nativeEvent.url.includes('code=')) {
        const code = nativeEvent.url.split('code=')[1];
        console.log('Google Auth Code (from Error):', code);
        setModalVisible(false);
        handleBackendLogin(code);
    }
  };

  const handleBackendLogin = async (code) => {
    try {
      const cleanCode = code.split('&')[0];

      // Call Backend (Not implemented yet, but prepared)
      const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        code: cleanCode
      });

      const data = response.data;
      console.log('Google Login Success:', data);

      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        if (data.user_id) await AsyncStorage.setItem('user_id', data.user_id.toString());
        if (data.username) await AsyncStorage.setItem('username', data.username);
        
        navigation.replace('Home');
      } else {
        Alert.alert('오류', '로그인 토큰을 받지 못했습니다.');
      }

    } catch (e) {
      console.error('Google Login Error:', e);
      if (e.response && e.response.data && e.response.data.detail) {
        Alert.alert('로그인 실패', e.response.data.detail);
      } else {
        Alert.alert('로그인 실패', '서버 통신 중 오류가 발생했습니다. (백엔드 구현 필요)');
      }
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.googleButton} 
        onPress={handleGoogleLoginPress}
        activeOpacity={0.8}
      >
        <Text style={styles.googleButtonText}>구글 로그인</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
         {/* Use SafeAreaView from react-native-safe-area-context if available, else View with padding */}
         <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 40 }}> 
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Text style={{ fontSize: 16 }}>닫기</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>구글 로그인</Text>
            </View>
            <WebView
                source={{ uri: GOOGLE_AUTH_URL }}
                style={{ flex: 1 }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                onShouldStartLoadWithRequest={(request) => {
                    if (request.url.includes('code=')) {
                        const code = request.url.split('code=')[1];
                        setModalVisible(false);
                        handleBackendLogin(code);
                        return false;
                    }
                    return true;
                }}
                onError={handleError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36" // Google sometimes blocks embedded webviews, specific UA helps
                renderLoading={() => <ActivityIndicator size="large" color="#4285F4" />}
            />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '85%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  googleButtonText: {
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

export default GoogleLogin;
