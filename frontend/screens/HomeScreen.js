import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 상단 오렌지 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greetingText}>반갑습니다!</Text>
          <Text style={styles.userNameText}>@@@ 님</Text>
        </View>
        <Image 
          source={require('../assets/market.png')} // 실제 이미지 경로로 변경
          style={styles.marketImage}
          resizeMode="contain"
        />
        
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.mainContent}>
        {/* 제품 스캔 카드 */}
        <TouchableOpacity style={styles.scanCard} activeOpacity={0.9}>
          <ImageBackground
            source={require('../assets/scanbg.png')} // 실제 이미지 경로로 변경
            style={styles.scanCardBackground}
            imageStyle={styles.scanCardImage}
          ></ImageBackground>
            <View style={styles.scanCardContent}>
              <Text style={styles.scanTitle}>제품 스캔</Text>
              <Text style={styles.scanSubtitle}>더 이상 줄서기는 그만! 찍고 담고 결제하기</Text>
              
              <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan')}
              >
                <Text style={styles.scanButtonText}>스캔하기 →</Text>
              </TouchableOpacity>
            </View>
        </TouchableOpacity>

        {/* 장바구니 카드 */}
        <TouchableOpacity 
        style={styles.menuCard} 
        activeOpacity={0.8} 
        onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🛒</Text>
          </View>
          <Text style={styles.menuCardText}>장바구니</Text>
        </TouchableOpacity>

        {/* 마이페이지 카드 */}
        <TouchableOpacity 
        style={styles.menuCard} 
        activeOpacity={0.8} 
        onPress={() => navigation.navigate('Receipt')}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.menuCardText}>전자영수증</Text>
        </TouchableOpacity>
        {/* 마이페이지 카드 */}
        <TouchableOpacity 
        style={styles.menuCard} 
        activeOpacity={0.8} 
        onPress={() => navigation.navigate('MyPage')}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.menuCardText}>회원 정보</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    height: height * 0.25,
    backgroundColor: '#FF9500',
    borderBottomLeftRadius: width * 0.08,
    borderBottomRightRadius: width * 0.08,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.08,
    paddingTop: height * 0.06,
    overflow: 'hidden',
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: width * 0.04,
    color: '#FFFFFF',
    marginBottom: height * 0.005,
  },
  userNameText: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.05,
  },
  scanCard: {
    width: '100%',
    height: height * 0.3,
    borderRadius: width * 0.05,
    overflow: 'hidden',
    marginBottom: height * 0.02,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  scanCardBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.04,
  },
  scanCardImage: {
    borderRadius: width * 0.05,
  },
  scanCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scanTitle: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: height * 0.01,
  },
  scanSubtitle: {
    fontSize: width * 0.04,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scanButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.06,
    marginTop: 'auto',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  iconText: {
    fontSize: width * 0.08,
  },
  menuCardText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#333',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
  },
  logoText: {
    fontSize: width * 0.04,
    color: '#999',
    letterSpacing: 2,
  },
});

export default HomeScreen;