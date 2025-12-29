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
import axios from "axios";
import Header from "./components/Header";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 레이아웃 상수
const PURCHASE_AREA_HEIGHT = 130;
const DRAWER_PEEK_HEIGHT = 70;
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;
const MAX_Y = -DRAWER_MAX_HEIGHT + DRAWER_PEEK_HEIGHT;

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [scannedProducts, setScannedProducts] = useState([]); // 중복 없는 상품 객체 리스트
  const [productQuantities, setProductQuantities] = useState({}); // { productId: quantity }
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cameraRef = useRef(null);

  // --- 드로워 애니메이션 및 제스처 로직 ---
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        const newY = gestureState.dy;
        const currentTotalY = pan.y._offset + newY;
        // 드로워 이동 제한 범위 (위/아래)
        if (currentTotalY <= 0 && currentTotalY >= MAX_Y) {
          pan.setValue({ x: 0, y: newY });
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        // 속도가 빠르거나 절반 이상 올렸을 때 끝까지 펼침
        if (gestureState.vy < -0.5 || pan.y._value < MAX_Y / 2) {
          Animated.spring(pan.y, {
            toValue: MAX_Y,
            useNativeDriver: false,
            friction: 8,
          }).start();
        } else {
          Animated.spring(pan.y, {
            toValue: 0,
            useNativeDriver: false,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // --- 장바구니 핵심 로직 ---
  const addToCart = (product) => {
    setScannedProducts((prev) => {
      const isExist = prev.find((p) => p.product_id === product.product_id);
      if (isExist) {
        // 1. 이미 있으면 수량만 1 증가
        setProductQuantities((prevQty) => ({
          ...prevQty,
          [product.product_id]: (prevQty[product.product_id] || 1) + 1,
        }));
        return prev;
      }
      // 2. 새로 추가되는 상품이면 목록에 넣고 수량 1로 설정
      setProductQuantities((prevQty) => ({
        ...prevQty,
        [product.product_id]: 1,
      }));
      return [...prev, product];
    });

    setIsModalVisible(false);
    setSelectedProduct(null);
    Alert.alert("장바구니", "상품이 성공적으로 추가되었습니다.");
  };

  const increaseQuantity = (productId) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const decreaseQuantity = (productId) => {
    setProductQuantities((prev) => {
      if (prev[productId] > 1)
        return { ...prev, [productId]: prev[productId] - 1 };
      return prev;
    });
  };

  const removeProduct = (productId) => {
    setScannedProducts((prev) =>
      prev.filter((p) => p.product_id !== productId)
    );
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

  // --- 촬영 및 서버 통신 ---
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      const formData = new FormData();
      formData.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "scan.jpg",
      });

      const res = await axios.post(`${API_BASE_URL}/api/ai/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 25000,
      });

      if (res.data?.result) {
        setSelectedProduct(res.data.result);
        setIsModalVisible(true);
      } else {
        Alert.alert("알림", "상품을 인식할 수 없습니다.");
      }
    } catch (e) {
      Alert.alert("오류", "서버와 통신하는 중 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  if (!permission.granted)
    return (
      <View style={styles.center}>
        <Text>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={{ color: "#fff" }}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* 카메라 및 가이드 */}
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <Header navigation={navigation} title="상품 스캔하기" />
          </CameraView>

          {/* 촬영 버튼 영역 */}
          <View style={styles.captureArea}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureBtnInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 바텀 드로워 (장바구니 리스트) */}
        <Animated.View
          style={[styles.drawer, { transform: [{ translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBar} />
          <Text style={styles.drawerHeader}>
            내 장바구니 ({scannedProducts.length})
          </Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {scannedProducts.length === 0 ? (
              <Text style={styles.emptyText}>
                스캔한 상품이 여기 표시됩니다.
              </Text>
            ) : (
              scannedProducts.map((item) => (
                <View key={item.product_id} style={styles.cartItem}>
                  <Image
                    source={{ uri: `${API_BASE_URL}${item.image_url}` }}
                    style={styles.itemImg}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {(
                        item.price * productQuantities[item.product_id]
                      ).toLocaleString()}
                      원
                    </Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() => decreaseQuantity(item.product_id)}
                      style={styles.qtyBtn}
                    >
                      <Text>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>
                      {productQuantities[item.product_id]}
                    </Text>
                    <TouchableOpacity
                      onPress={() => increaseQuantity(item.product_id)}
                      style={styles.qtyBtn}
                    >
                      <Text>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeProduct(item.product_id)}
                      style={{ marginLeft: 10 }}
                    >
                      <Text style={{ color: "#ccc" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>

        {/* 결제 고정 하단바 */}
        <View style={styles.purchaseBar}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>합계</Text>
            <Text style={styles.totalPriceText}>
              {calculateTotal().toLocaleString()}원
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() =>
              navigation.navigate("Payment", {
                products: scannedProducts,
                quantities: productQuantities,
              })
            }
          >
            <Text style={styles.payBtnText}>구매하기</Text>
          </TouchableOpacity>
        </View>

        {/* 인식 확인 모달 */}
        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              
              {selectedProduct?.image_url && (
                <Image
                  source={{
                    uri: `${API_BASE_URL}${selectedProduct.image_url}`,
                  }}
                  style={styles.modalImg}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.modalName}>
                {selectedProduct?.product_name}
              </Text>
              <Text style={styles.modalPrice}>
                {selectedProduct?.price?.toLocaleString()}원
              </Text>
              <Text style={styles.modalTitle}>상품을 추가하시겠습니까?</Text>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOk}
                  onPress={() => addToCart(selectedProduct)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    담기
                  </Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  camera: { flex: 0.8 },
  scanGuide: {
    position: "absolute",
    top: "25%",
    left: "15%",
    right: "15%",
    height: "30%",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FF9500",
    borderWidth: 4,
  },
  captureArea: {
    height: 160,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF9500",
    marginTop: -60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },

  // 드로워
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
    elevation: 15,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 10,
  },
  drawerHeader: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  itemName: { fontSize: 15, fontWeight: "500" },
  itemPrice: { color: "#FF9500", fontWeight: "bold" },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: "#f0f0f0",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { marginHorizontal: 10, fontWeight: "bold" },

  // 하단 결제바
  purchaseBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: PURCHASE_AREA_HEIGHT,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  totalLabel: { color: "#888", fontSize: 14 },
  totalPriceText: { fontSize: 22, fontWeight: "bold" },
  payBtn: {
    backgroundColor: "#FF9500",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  payBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // 모달
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalImg: { width: "100%", height: 150, marginBottom: 15 },
  modalName: { fontSize: 16, marginBottom: 5 },
  modalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9500",
    marginBottom: 20,
  },
  modalBtnRow: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOk: {
    flex: 1,
    height: 50,
    backgroundColor: "#FF9500",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  permissionButton: {
    padding: 10,
    backgroundColor: "#FF9500",
    borderRadius: 5,
    marginTop: 10,
  },
  emptyText: { textAlign: "center", color: "#ccc", marginTop: 40 },
});
