import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Image
} from 'react-native';
import AppText from '../components/AppText';
import { BlurView } from 'expo-blur'; // ✅ 블러 처리용
import { verticalScale, scale, moderateScale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

/* =========================
   🔧 사이즈 & 컬러 조절용 상수
   → 여기만 바꾸면 전체 비율 조정 가능
========================= */

// 메인 컬러
const MAIN_ORANGE = '#ff9500';
const DARK_TEXT = '#2C2C2C';

// 스캔 카드 (줄 안 서고 결제)
const SCAN_CARD_HEIGHT = verticalScale(150);
const SCAN_TITLE_SIZE = moderateScale(20);
const SCAN_BUTTON_HEIGHT = verticalScale(40);
const SCAN_BUTTON_RADIUS = moderateScale(20);
const SCAN_CARD_COLOR = 'rgba(217, 217, 217, 0.85)';

// ✅ 배경 블러 강도 (10~20 추천 / 값만 바꿔서 조절 가능)
const SCAN_BG_BLUR_INTENSITY = 10;

// 하단 메뉴 버튼
const MENU_BUTTON_HEIGHT = verticalScale(58);
const MENU_ICON_SIZE = moderateScale(24);
const MENU_TEXT_SIZE = moderateScale(16);
const MENU_BUTTON_COLOR = 'rgba(255,255,255,0.92)';

const HomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);
    };
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      {/* 상단 오렌지 영역 */}
      <View style={styles.topSection}>
        <AppText style={styles.welcomeText}>
          반갑습니다!{'{\n}'}
          <AppText style={styles.boldText}>{username}</AppText> 님
        </AppText>

        <View style={styles.marketImageContainer}>
          <Image
            source={require('../assets/market.png')}
            style={styles.marketImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 메인 흰색 영역 */}
      <View style={styles.mainSection}>
        {/* =======================
            줄 안 서고 결제 카드
            → 배경 이미지만 살짝 블러
        ======================= */}
        <View style={styles.scanCard}>
          <ImageBackground
            source={require('../assets/scanbg.png')}
            style={styles.scanImage}
          >
            {/* 🔹 배경 블러 오버레이 (사진만 흐림) */}
            <BlurView
              intensity={SCAN_BG_BLUR_INTENSITY} // ← 여기 값으로 블러 조절
              tint="dark"
              style={StyleSheet.absoluteFill}
            />

            {/* 🔹 기존 텍스트 / 버튼 (블러 영향 X) */}
            <AppText style={styles.scanTitle}>
              줄 안 서고 결제{'{\n}'}
              <AppText style={styles.scanSubText}>지금 사용해 보세요</AppText>
            </AppText>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.8}
            >
              <AppText style={styles.scanButtonText}>스캔하기 →</AppText>
            </TouchableOpacity>
          </ImageBackground>
        </View>

        {/* =======================
            하단 메뉴 버튼들
        ======================= */}
        {[
          { icon: 'cart-outline', label: '장바구니', screen: 'Cart' },
          { icon: 'receipt-outline', label: '전자영수증', screen: 'Receipt' },
          { icon: 'person-outline', label: '회원정보', screen: 'MyPage' },
        ].map((item, index) => (
          <View key={index} style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={MENU_ICON_SIZE}
                color={DARK_TEXT}
                style={styles.menuIcon}
              />
              <AppText style={styles.menuText}>{item.label}</AppText>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAIN_ORANGE },

  /* 상단 */
  topSection: {
    height: verticalScale(190),
    backgroundColor: MAIN_ORANGE,
    paddingHorizontal: scale(20),
  },
  welcomeText: {
    marginTop: verticalScale(90),
    marginLeft: scale(20),
    fontSize: moderateScale(14),
    color: '#e6e6e6ff',
  },
  boldText: {
    fontSize: moderateScale(22),
    fontWeight: '800',
  },
  marketImageContainer: {
    position: 'absolute',
    right: 0,
    top: verticalScale(30),
    width: scale(140),
    height: verticalScale(180),
  },
  marketImage: { width: '100%', height: '100%' },

  /* 메인 */
  mainSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingTop: verticalScale(40),
    paddingHorizontal: scale(18),
    alignItems: 'center',
  },

  /* 스캔 카드 */
  scanCard: {
    width: width - scale(36),
    height: SCAN_CARD_HEIGHT,
    borderRadius: moderateScale(18),
    overflow: 'hidden',
    marginBottom: verticalScale(22),
    backgroundColor: SCAN_CARD_COLOR,
  },
  scanImage: {
    flex: 1,
    padding: scale(20),
    justifyContent: 'space-between',
  },
  scanTitle: {
    fontSize: SCAN_TITLE_SIZE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanSubText: {
    fontSize: moderateScale(14),
    fontWeight: '300',
    color: '#e6e6e6ff',
  },
  scanButton: {
    alignSelf: 'flex-end',
    height: SCAN_BUTTON_HEIGHT,
    paddingHorizontal: scale(20),
    borderRadius: SCAN_BUTTON_RADIUS,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    marginBottom: verticalScale(-10),
    marginRight: scale(-7),
    borderWidth: 1,              // ⬅ 테두리 두께
    borderColor: '#ddd6cdff',
  },
  scanButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },

  /* 메뉴 버튼 */
  menuContainer: {
    width: '100%',
    marginBottom: verticalScale(12),
  },
  menuButton: {
    height: MENU_BUTTON_HEIGHT,
    backgroundColor: MENU_BUTTON_COLOR,
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(22),
  },
  menuIcon: {
    marginRight: scale(12),
    opacity: 0.7,
  },
  menuText: {
    fontSize: MENU_TEXT_SIZE,
    fontWeight: '500',
    color: DARK_TEXT,
    fontSize: 20,
  },
});

export default HomeScreen;
