import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ navigation }) {
  const camScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // 카메라 셔터 느낌 애니메이션
    Animated.sequence([
      Animated.timing(camScale, {
        toValue: 1.05,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(60),
      Animated.timing(camScale, {
        toValue: 0.6,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    // 2초 후 로그인 화면으로 이동
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [camScale, navigation]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Animated.Image
            source={require('../assets/cam.png')}
            style={[styles.cam, { transform: [{ scale: camScale }] }]}
          />
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cam: {
    width: 145,
    height: 145,
    resizeMode: 'contain',
  },
  logo: {
    position: 'absolute',
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
