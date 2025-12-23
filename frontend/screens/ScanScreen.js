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
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_PEEK_HEIGHT = 200; // drawerBleeding과 동일
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.6; // 화면의 50%

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [detectedImage, setDetectedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const cameraRef = useRef(null);

  // Bottom Drawer 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT)).current;

  // 상품별 수량 관리
  const [productQuantities, setProductQuantities] = useState({});

  // 모달 상태 추가
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 예시 상품 데이터
  const sampleProducts = [
    { id: 1, name: '오리온 예감 오리지널', size: '64g', price: 1250, image: null },
    { id: 2, name: '롯데 칙촉', size: '144g', price: 2500, image: null },
    { id: 3, name: '농심 새우깡', size: '90g', price: 1500, image: null },
    { id: 4, name: '해태 허니버터칩', size: '60g', price: 1800, image: null },
    { id: 5, name: '크라운 쿠크다스', size: '108g', price: 2200, image: null },
    { id: 6, name: '오뚜기 진라면', size: '120g', price: 1000, image: null },
    { id: 7, name: '삼양 불닭볶음면', size: '140g', price: 1300, image: null },
    { id: 8, name: '농심 신라면', size: '120g', price: 950, image: null },
  ];

  // 스크롤 업 Bottom Drawer
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

  // 수량 증가
  const increaseQuantity = (productId) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  // 수량 감소
  const decreaseQuantity = (productId) => {
    setProductQuantities(prev => {
      const currentQty = prev[productId] || 0;
      if (currentQty > 0) {
        return {
          ...prev,
          [productId]: currentQty - 1
        };
      }
      return prev;
    });
  };

  // ✅ 상품 삭제 함수
  const removeProduct = (id) => {
    setScannedProducts((products) =>
      products.filter((product) => product.id !== id)
    );
  };

    // ✅ 합계 계산 함수
  const calculateTotal = () => {
    return scannedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
  };

  // 현재 수량 가져오기
  const getQuantity = (productId) => {
    return productQuantities[productId] || 1;
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
  }

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
        
        // Alert 대신 모달 표시
        setSelectedProduct(result);
        setIsModalVisible(true);
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
    setIsModalVisible(false);  // ✅ 모달 먼저 닫기
    Alert.alert('알림', '장바구니에 상품이 추가되었습니다!');
    resetCamera();
  };

  const resetCamera = () => {
    setDetectedImage(null);
    setDetectionResult(null);
    setSelectedProduct(null);  // ✅ 추가
    setIsModalVisible(false);
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
            facing="back"
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

        {/* 상품 리스트 */}
            {sampleProducts.map((product) => {
              const quantity = getQuantity(product.id);
              const displayPrice = quantity > 0 ? product.price * quantity : product.price;
              
              return (
                <View key={product.id} style={styles.resultItem}>
                  <View style={styles.resultItemImage} />
                  <View style={styles.resultItemInfo}>
                    <Text style={styles.resultItemTitle}>
                      {product.name}
                    </Text>
                    <Text style={styles.resultItemSize}>{product.size}</Text>
                    <Text style={styles.resultItemPrice}>
                      {displayPrice.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => decreaseQuantity(product.id)}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityText}>{quantity}개</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => increaseQuantity(product.id)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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

        {/* 장바구니 추가 확인 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {/* 상품 이미지 */}
            <View style={styles.modalImageContainer}>
              {detectedImage ? (
                <Image
                  source={{ uri: detectedImage }}
                  style={styles.modalProductImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.modalProductImage} />
              )}
            </View>

            {/* 상품명 */}
            <Text style={styles.modalProductName}>
              {selectedProduct?.label || '오리온 초코송이'} {selectedProduct?.size || '50g'}
            </Text>

            {/* 질문 텍스트 */}
            <Text style={styles.modalQuestionText}>
              장바구니에 추가하시겠습니까?
            </Text>

            {/* 버튼 영역 */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonNo]}
                onPress={() => {
                  setIsModalVisible(false);
                  resetCamera();
                }}
              >
                <Text style={styles.modalButtonNoText}>아니오</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonYes]}
                onPress={() => addToCart(selectedProduct)}
              >
                <Text style={styles.modalButtonYesText}>네</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // 상품 아이템 스타일 (이미지 참고)
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultItemImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
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
    color: '#000',
    marginBottom: 2,
  },
  resultItemSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  
  // 수량 조절 버튼 스타일
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyCartSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  productList: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  quantityButton: {
    backgroundColor: '#FF8C00',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 35,
    textAlign: 'center',
  },
  removeButton: {
    padding: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  paymentButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalProductName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalQuestionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonNo: {
    backgroundColor: '#E5E5E5',
  },
  modalButtonYes: {
    backgroundColor: '#FF9500',
  },
  modalButtonNoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonYesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});