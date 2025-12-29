import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Header from "./components/Header";

// --- 제스처 및 애니메이션 라이브러리 ---
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   interpolate
// } from 'react-native-reanimated';

const SERVER_URL = API_BASE_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 상단 헤더와 하단 버튼 영역을 제외한 실제 이동 범위 계산
const PURCHASE_AREA_HEIGHT = 130;
const DRAWER_PEEK_HEIGHT = 70; // 닫혔을 때 노출될 높이
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
const MIN_Y = 0; // 닫힌 상태 (상대값)
const MAX_Y = -DRAWER_MAX_HEIGHT + DRAWER_PEEK_HEIGHT; // 열린 상태 (상대값)

export default function ScanScreen({ navigation }) {
  // 1. 상태 관리
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [detectedImage, setDetectedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cameraRef = useRef(null);
  const [scannedProducts, setScannedProducts] = useState([]);

  // 2. Animated 값 및 PanResponder 설정
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: pan.y._value }); // 시작 지점 고정
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        // 이동 범위 제한 (열림과 닫힘 사이만 움직이게)
        const newY = gestureState.dy;
        const currentTotalY = pan.y._offset + newY;

        if (currentTotalY <= 0 && currentTotalY >= MAX_Y) {
          pan.setValue({ x: 0, y: newY });
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset(); // 오프셋 합치기

        // 위로 빠르게 올리거나 절반 이상 올렸을 때
        if (gestureState.vy < -0.5 || pan.y._value < MAX_Y / 2) {
          Animated.spring(pan.y, {
            toValue: MAX_Y,
            useNativeDriver: false,
            friction: 8,
          }).start();
        } else {
          // 아래로 내리거나 절반 미만일 때 닫기
          Animated.spring(pan.y, {
            toValue: 0,
            useNativeDriver: false,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // 1. 페이지 진입 시 저장된 장바구니 불러오기
  useEffect(() => {
    const initData = async () => {
      await loadProducts(); // 전체 상품 목록 로드
      await loadCartFromStorage(); // 저장된 수량 로드
    };
    initData();
  }, []);

  // 2. 수량이 변경될 때마다 스토리지에 자동 저장
  useEffect(() => {
    if (Object.keys(productQuantities).length > 0) {
      saveCartToStorage(productQuantities);
    }
  }, [productQuantities]);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/`);
      setProducts(response.data);
    } catch (e) {
      console.error("로드 실패", e);
    }
  };

  const saveCartToStorage = async (data) => {
    try {
      await AsyncStorage.setItem("@cart_data", JSON.stringify(data));
    } catch (e) {
      console.error("저장 실패", e);
    }
  };

  const loadCartFromStorage = async () => {
    try {
      const savedData = await AsyncStorage.getItem("@cart_data");
      if (savedData !== null) {
        setProductQuantities(JSON.parse(savedData));
      }
    } catch (e) {
      console.error("불러오기 실패", e);
    }
  };

  // ====================여기까지

  // 4. 상품 관련 로직 이거 없음
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/`);
        setProducts(response.data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    loadProducts();
  }, []);

  // increaseQuantity 똑같음
  const increaseQuantity = (productId) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const decreaseQuantity = (productId) => {
    setProductQuantities((prev) => {
      if (prev[productId] > 0)
        return {
          ...prev,
          [productId]: prev[productId] - 1,
        };
      return prev;
    });
  };

  const removeProduct = (productId) => {
    setProductQuantities((prev) => {
      const newQty = { ...prev };
      delete newQty[productId];
      return newQty;
    });
  };

  const calculateTotal = () => {
    return scannedProducts.reduce((sum, product) => {
      const qty = productQuantities[product.product_id] || 0;
      return sum + product.price * qty;
    }, 0);
  };

  // 5. 카메라 및 인식 로직
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        detectProduct(photo);
      } catch (error) {
        Alert.alert("오류", "사진 촬영에 실패했습니다.");
        setIsLoading(false);
      }
    }
  };

  const detectProduct = async (photo) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "product.jpg",
      });
      const res = await axios.post(`${API_BASE_URL}/api/ai/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      //여기는 다름
      if (res.data?.result) {
        if (res.data.result.image_base64)
          setDetectedImage(
            `data:image/png;base64,${res.data.result.image_base64}`
          );
        setDetectionResult(res.data.result);
        setSelectedProduct(res.data.result);
        setIsModalVisible(true);
      }
      //여기까지 다름
    } catch (error) {
      Alert.alert("오류", "상품 인식에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  //여기 다름
  const addToCart = (product) => {
    setScannedProducts((prev) => {
      const exists = prev.find((p) => p.product_id === product.product_id);

      if (exists) {
        // 이미 있으면 수량 +1
        setProductQuantities((qty) => ({
          ...qty,
          [product.product_id]: (qty[product.product_id] || 1) + 1,
        }));
        return prev; // 배열 자체는 유지
      }

      // 없으면 새로 추가 및 수량 1 설정
      setProductQuantities((qty) => ({
        ...qty,
        [product.product_id]: 1,
      }));
      return [...prev, product];
    });

    setIsModalVisible(false);
    setSelectedProduct(null);
  };
  //여기까지 다름

  // 6. 권한 렌더링 다름
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* 카메라 영역 */}
        <View style={styles.cameraWrapper}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef}>
            <Header navigation={navigation} title="상품 스캔" />
            {/* <View style={styles.scanGuide}>
              <View style={[styles.scanCorner, styles.topLeft]} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View> */}
          </CameraView>

          {/* 촬영 버튼 */}
          <View style={styles.captureArea}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 장바구니 바텀 시트 (스와이프 가능) */}

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBar} />
          {/* puller랑 handleBar 같음 */}
          <Text style={styles.drawerTitle}>스캔된 상품 목록</Text>

          <ScrollView
            style={styles.drawerContent}
            contentContainerStyle={{ paddingBottom: 200 }} // 버튼에 가려지지 않게 넉넉히
            showsVerticalScrollIndicator={false}
          >
            {scannedProducts.filter(
              (p) => (productQuantities[p.product_id] || 0) > 0
            ).length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyText}>장바구니가 비어 있습니다.</Text>
              </View>
            ) : (
              scannedProducts
                .map((product, index) => (
                  <View
                    key={`${product.product_id}-${index}`}
                    style={styles.resultItem}
                  >
                    {/* 상단: 상품명 및 삭제 버튼 */}
                    <View style={styles.itemHeader}>
                      <Text style={styles.headerProductName}>
                        {product.product_name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeProduct(product.product_id)}
                      >
                        <Text style={styles.closeIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 중간: 이미지 + (브랜드, 상품명, 사이즈) */}
                    <View style={styles.itemBody}>
                      <Image
                        source={{ uri: `${API_BASE_URL}${product.image_url}` }}
                        style={styles.productThumbnail}
                        resizeMode="cover"
                      />
                      <View style={styles.itemInfoContent}>
                        <Text style={styles.infoText}>
                          {product.brand_name}
                        </Text>
                        <Text style={styles.infoText}>
                          {product.product_name}
                        </Text>
                        <Text style={styles.infoText}>
                          {product.size ?? ""}
                        </Text>
                      </View>
                    </View>

                    {/* 하단: 가격 + 수량 조절 버튼 */}
                    <View style={styles.itemFooter}>
                      <Text style={styles.footerPrice}>
                        {(
                          product.price *
                          (productQuantities[product.product_id] || 0)
                        ).toLocaleString()}
                        원
                      </Text>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          onPress={() => decreaseQuantity(product.product_id)}
                          style={styles.qBtn}
                        >
                          <Text style={styles.qBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qText}>
                          {productQuantities[product.product_id]}개
                        </Text>
                        <TouchableOpacity
                          onPress={() => increaseQuantity(product.product_id)}
                          style={styles.qBtn}
                        >
                          <Text style={styles.qBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
            )}
          </ScrollView>
        </Animated.View>

        {/* 하단 고정 결제 영역 */}
        <View style={styles.purchaseArea}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>합계</Text>
            <Text style={styles.totalAmount}>
              {calculateTotal().toLocaleString()}원
            </Text>
          </View>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={() => navigation.navigate("Payment")}
          >
            <Text style={styles.purchaseButtonText}>결제하기</Text>
          </TouchableOpacity>
        </View>

        {/* AI 인식 확인 모달 */}
        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                장바구니에 추가하시겠습니까?
              </Text>
              <Image
                source={{
                  uri: selectedProduct
                    ? `${SERVER_URL}${selectedProduct.image_url}`
                    : null,
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              {/* 제미나이가 찾아준 거 */}
              {/* <Text style={styles.modalName}>
                {selectedProduct?.brand_name || selectedProduct?.label}
              </Text>
              <Text style={styles.modalName}>
                {selectedProduct?.product_name || selectedProduct?.label}
              </Text>
              <Text style={styles.modalName}>
                {selectedProduct?.size || selectedProduct?.label}
              </Text> */}
              <Text style={styles.modalProductName}>
                {selectedProduct?.brand_name}
                {selectedProduct?.product_name}
                {selectedProduct?.size}
              </Text>
              <Text style={styles.modalProductBrand}></Text>
              <Text style={styles.modalProductSize}></Text>
              <Text style={styles.modalProductPrice}>
                {selectedProduct?.price?.toLocaleString()}원
              </Text>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => {
                    setIsModalVisible(false);
                    resetCamera();
                  }}
                >
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtnOk}
                  onPress={() => addToCart(selectedProduct)}
                >
                  <Text style={{ color: "#fff" }}>추가하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cameraWrapper: { flex: 1 },
  camera: { flex: 0.8 },
  scanGuide: {
    position: "absolute",
    top: "25%",
    left: "15%",
    right: "15%",
    height: "35%",
  },
  scanCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FF9500",
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  captureArea: {
    height: 180,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF9500",
    //padding: 5,
    marginTop: -65,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  drawer: {
    position: "absolute",
    top: SCREEN_HEIGHT - DRAWER_PEEK_HEIGHT - PURCHASE_AREA_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  drawerContent: {
    flex: 1,
    marginBottom: PURCHASE_AREA_HEIGHT,
  },
  resultItem: {
    //backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    //borderColor: "#F0F0F0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    color: "#333",
  },
  headerProductName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  closeIcon: {
    fontSize: 18,
    color: "#999",
  },
  itemBody: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  productThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    borderColor: "#fb0404ff",
  },
  itemInfoContent: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    flexWrap: "wrap",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    //marginTop: 10,
  },
  footerPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FF9500",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    padding: 5,
  },
  qBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF9500",
    justifyContent: "center",
    alignItems: "center",
  },
  qBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  qText: {
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  productThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 12,
  },
  resultItemInfo: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#cf2d2dff",
  },
  resultItemTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  resultItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF9500",
  },
  quantityControlArea: {
    alignItems: "flex-end",
    marginLeft: 10,
    backgroundColor: "#cf2d2dff",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 2,
    marginBottom: 5,
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  qBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  qText: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  removeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  removeBtnText: {
    fontSize: 12,
    color: "#FF4D4D",
    textDecorationLine: "underline",
  },

  purchaseArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PURCHASE_AREA_HEIGHT,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    zIndex: 999,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#888" },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "#333" },
  purchaseButton: {
    backgroundColor: "#FF9500",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  purchaseButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  emptyCart: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#bbb", fontSize: 15 },
  emptySubText: { color: "#ddd", fontSize: 12, marginTop: 5 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalName: { fontSize: 16, marginBottom: 20 },
  modalBtnRow: { flexDirection: "row", gap: 10 },
  modalBtnCancel: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  modalBtnOk: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    backgroundColor: "#FF9500",
    borderRadius: 10,
  },
  permissionButton: {
    padding: 15,
    backgroundColor: "#FF9500",
    borderRadius: 10,
    marginTop: 20,
  },
});
