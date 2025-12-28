import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  Image,
  SafeAreaView
} from 'react-native';
import { verticalScale, scale, moderateScale} from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');

  useEffect(() => {
  const loadUser = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (e) {
      console.log('username 불러오기 실패', e);
    }
  };

  loadUser();
}, []);

  return (
    <View style={styles.container}>
      {/* 상단 오렌지 배경 */}
      <View style={styles.topSection}>
        {/* 환영 텍스트 */}
        <Text style={styles.welcomeText}>
          반갑습니다!{'\n'}<Text style={styles.BoldText}>{username}</Text> 님
        </Text>

        {/* 마켓 일러스트레이션 이미지 */}
        <View style={styles.marketImageContainer}>
          <Image
            source={require('../assets/market.png')}
            style={styles.marketImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 흰색 둥근 배경 */}
      <View style={styles.mainSection}>
        {/* 스캔 프로모션 카드 */}
        <View style={styles.scanCard}>
          <View style={styles.scanOverlay}>
            <ImageBackground
              source={require('../assets/scanbg.png')}
              style={styles.scanImage}
              //resizeMode="cover"
            >
              <Text style={styles.scanTitle}>
                줄 안 서고 결제{'\n'}<Text style={styles.SmallText}>지금 사용해 보세요</Text>
              </Text>
              
              {/* 스캔하기 버튼 */}
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.8}
              >
                <Text style={styles.scanButtonText}>스캔하기 →</Text>
              </TouchableOpacity>
              </ImageBackground>
          </View>
        </View>

        {/* 장바구니 버튼 */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={moderateScale(30)} color="#2C2C2C" style={styles.menuIcon} />
            <Text style={styles.menuText}>장바구니</Text>
          </TouchableOpacity>
        </View>

        {/* 전자영수증 버튼 */}
        <View style={styles.menuContainer}>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Receipt')}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={moderateScale(30)} color="#2C2C2C" style={styles.menuIcon} />
            <Text style={styles.menuText}>전자영수증</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          {/* 회원정보 버튼 */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('MyPage')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={moderateScale(30)} color="#2C2C2C" style={styles.menuIcon} />
            <Text style={styles.menuText}>회원정보</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF9317',
  },
  topSection: {
    height: verticalScale(202),
    backgroundColor: '#FF9317',
    paddingHorizontal: scale(20),
    position: 'relative',
  },
  welcomeText: {
    position: 'absolute',
    top: verticalScale(90),
    left: scale(41),
    fontSize: moderateScale(15),
    lineHeight: moderateScale(18),
    color: '#FFF0DF',
    fontWeight: '400',
  },
  BoldText: {
    fontSize: moderateScale(25),
    fontWeight: '800',
    lineHeight: moderateScale(30),
  },
  marketImageContainer: {
    position: 'absolute',
    width: scale(150),
    height: verticalScale(193),
    right: 0,
    top: verticalScale(37),
    zIndex: 999,
  },
  marketImage: {
    width: '100%',
    height: '100%',
  },
  mainSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingTop: verticalScale(54),
    paddingHorizontal: scale(18),
    alignItems: 'center',
  },
  SmallText: {
    fontSize: moderateScale(15),
    fontWeight: '300',
    color: '#FFF0DF',
  },
  scanCard: {
    width: width - scale(36),
    height: verticalScale(200),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: verticalScale(29),
    backgroundColor: 'rgba(183, 44, 44, 0.9)',
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    //position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    //position: 'relative',
    //paddingHorizontal: width * 0.06,
    //paddingVertical: height * 0.04,
    zIndex: 1,
    //padding: scale(30),
  },
  scanTitle: {
    fontSize: moderateScale(24),
    lineHeight: moderateScale(29),
    fontWeight: '600',
    color: '#F2F2F2',
  },
  scanButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(183, 44, 44, 0.9)',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.06,
    marginTop: 'auto',
    transform: [{ translateY: -10 }],
    right: width * -0.45,
  },
  scanButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
  },
  menuCard: {
    width: '100%',
    height: height * 0.12,
    backgroundColor: '#FFF5E6',
    borderRadius: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.02,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.06,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: moderateScale(3),
    borderColor: '#EDEDED',
    borderRadius: moderateScale(41),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    minWidth: scale(158),
    height: verticalScale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: moderateScale(20),
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: verticalScale(14),
  },
  menuButton: {
    width: scale(160),
    height: verticalScale(70),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: moderateScale(21),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(25),
  },
  menuIcon: {
    opacity: 0.62,
    marginRight: scale(15),
  },
  menuText: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: '#2C2C2C',
  },
});

export default HomeScreen;
