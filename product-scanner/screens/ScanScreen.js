import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_PEEK_HEIGHT = 56; // drawerBleeding과 동일
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.5; // 화면의 50%

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedImage, setDetectedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const cameraRef = useRef(null);

  // Bottom Drawer 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT)).current;

  // Bottom Drawer PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        // 위로 드래그: 음수 값
        // 아래로 드래그: 양수 값
        const newTranslateY = Math.max(
          0, // 완전히 열렸을 때
          Math.min(
            DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT, // 완전히 닫혔을 때
            (DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT) + gestureState.dy
          )
        );
        translateY.setValue(newTranslateY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 스와이프 속도나 이동 거리에 따라 열기/닫기 결정
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          // 위로 스와이프 -> 열기
          openDrawer();
        } else if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          // 아래로 스와이프 -> 닫기
          closeDrawer();
        } else {
          // 중간 위치면 현재 상태에 따라 결정
          if (isDrawerOpen) {
            openDrawer();
          } else {
            closeDrawer();
          }
        }
      },
    })
  ).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    Animated.spring(translateY, {
      toValue: DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  // 사진 촬영
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        await detectProduct(photo);
      } catch (error) {
        console.error('사진 촬영 오류:', error);
        Alert.alert('오류', '사진 촬영에 실패했습니다.');
        setIsLoading(false);
      }
    }
  };

  // 갤러리에서 선택
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setIsLoading(true);
        await detectProduct(result.assets[0]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  // AI 상품 인식
  const detectProduct = async (photo) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'product.jpg',
      });

      const apiResponse = await axios.post(
        `${API_BASE_URL}/api/ai/detect`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      if (apiResponse.data && apiResponse.data.result) {
        const result = apiResponse.data.result;
        
        if (result.image_base64) {
          setDetectedImage(`data:image/png;base64,${result.image_base64}`);
        }
        
        setDetectionResult(result);
        
        Alert.alert(
          '인식 완료',
          `상품이 성공적으로 인식되었습니다!\n신뢰도: ${result.confidence || 'N/A'}%`,
          [
            {
              text: '장바구니 추가',
              onPress: () => addToCart(result),
            },
            {
              text: '다시 촬영',
              onPress: () => resetCamera(),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('상품 인식 오류:', error);
      
      let errorMessage = '상품 인식에 실패했습니다.';
      if (error.response) {
        errorMessage += `\n상태 코드: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += '\n서버에 연결할 수 없습니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product) => {
    console.log('장바구니에 추가:', product);
    Alert.alert('알림', '장바구니 기능은 추후 구현 예정입니다.');
    resetCamera();
  };

  const resetCamera = () => {
    setDetectedImage(null);
    setDetectionResult(null);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // 권한 확인
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>카메라 권한이 필요합니다.</Text>
        <Text style={styles.errorSubText}>
          앱을 사용하려면 카메라 권한을 허용해주세요.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 스캔 화면 */}
      {detectedImage ? (
        <View style={styles.resultContainer}>
          <Image
            source={{ uri: detectedImage }}
            style={styles.resultImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetCamera}
          >
            <Text style={styles.resetButtonText}>다시 스캔하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              {/* 스캔 가이드 */}
              <View style={styles.scanGuide}>
                <View style={[styles.scanCorner, styles.topLeft]} />
                <View style={[styles.scanCorner, styles.topRight]} />
                <View style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={[styles.scanCorner, styles.bottomRight]} />
              </View>

              {/* 안내 텍스트 */}
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                  상품을 프레임 안에 위치시켜주세요
                </Text>
              </View>
            </View>
          </CameraView>

          {/* 하단 컨트롤 */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>🖼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && !detectedImage && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingOverlayText}>AI가 상품을 인식 중입니다...</Text>
        </View>
      )}

      {/* Bottom Swipeable Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drawer Header (항상 보이는 부분) */}
        <View style={styles.drawerHeader} {...panResponder.panHandlers}>
          {/* Puller (드래그 핸들) */}
          <View style={styles.puller} />
          <Text style={styles.drawerHeaderText}>51 results</Text>
        </View>

        {/* Drawer Content */}
        <ScrollView style={styles.drawerContent}>
          <View style={styles.contentPlaceholder}>
            <Text style={styles.placeholderText}>스캔 결과가 여기에 표시됩니다</Text>
            
            {/* 예시 아이템들 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <View key={item} style={styles.resultItem}>
                <View style={styles.resultItemImage} />
                <View style={styles.resultItemInfo}>
                  <Text style={styles.resultItemTitle}>상품 {item}</Text>
                  <Text style={styles.resultItemPrice}>₩{(item * 1000).toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Drawer Overlay (열렸을 때 배경 어둡게) */}
      {isDrawerOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeDrawer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  scanGuide: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: '40%',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4A90E2',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    backgroundColor: '#999',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultImage: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#4A90E2',
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#4A90E2',
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // Bottom Drawer 스타일
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20,
  },
  drawerHeader: {
    height: DRAWER_PEEK_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  puller: {
    width: 30,
    height: 6,
    backgroundColor: '#bbb',
    borderRadius: 3,
    position: 'absolute',
    top: 8,
  },
  drawerHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentPlaceholder: {
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  resultItemImage: {
    width: 60,
    height: 60,
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginRight: 12,
  },
  resultItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultItemPrice: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
});