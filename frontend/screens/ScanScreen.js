import React, { useState, useEffect, useRef } from "react";
import {
  View,
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
import AppText from "../components/AppText";
import { CameraView, useCameraPermissions } from "expo-camera";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Header from "./components/Header";
import { fontSizes } from '../config/typography';
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* ================= [ADD] L자 스캔 프레임 조절 ================= */
const GUIDE_WIDTH_RATIO = 0.8; // 프레임 가로 비율
const GUIDE_HEIGHT_RATIO = 0.95; // 프레임 세로 비율
const GUIDE_OFFSET_Y = 115; // 위(+)/아래(-) 이동
const GUIDE_BORDER = 4; // L자 두께
const GUIDE_LENGTH = 28; // L자 길이
/* ============================================================ */

// 레이아웃 상수
const PURCHASE_AREA_HEIGHT = 130;
const DRAWER_PEEK_HEIGHT = 70;
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;
const MAX_Y = -DRAWER_MAX_HEIGHT + DRAWER_PEEK_HEIGHT;

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cameraRef = useRef(null);
  const isSyncingRef = useRef(false);
  const scannedProductsRef = useRef([]);
  const productQuantitiesRef = useRef({});
  const isMountedRef = useRef(true);
  const isDataLoadedRef = useRef(false);

  // --- 드로워 애니메이션 및 제스처 로직 =============================================================
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
        if (currentTotalY <= 0 && currentTotalY >= MAX_Y) {
          pan.setValue({ x: 0, y: newY });
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
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

  // --- 로컬 저장 함수 =============================================================
  useEffect(() => {
    const initData = async () => {
      const productList = await loadProducts();
      const hasServerCart = await loadCartFromServer(productList);
      if (!hasServerCart) {
        await loadCartFromStorage();
      }
      isDataLoadedRef.current = true;
    };
    initData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // 수량이 변경될 때마다(비어있는 경우 포함) 로컬 스토리지 업데이트
    saveCartToStorage(productQuantities);
    
    // keep refs updated for use in listeners
    productQuantitiesRef.current = productQuantities;
    scannedProductsRef.current = scannedProducts;
  }, [productQuantities]);

  useEffect(() => {
    scannedProductsRef.current = scannedProducts;
  }, [scannedProducts]);

  // helper: sync current scannedProducts -> server
  const syncCartToServer = async (overrideItems = null) => {
    if (isSyncingRef.current) return true;
    isSyncingRef.current = true;
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        isSyncingRef.current = false;
        return false;
      }

      const items = overrideItems ?? (scannedProductsRef.current || []).map((p) => ({
        product_id: Number(p.product_id),
        quantity: productQuantitiesRef.current[p.product_id] || 1,
      }));

      console.log('syncCartToServer: syncing items', items);

      const res = await axios.post(`${API_BASE_URL}/api/cart/scan/sync`, { items }, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      console.log('syncCartToServer: success', res.status, res.data);
      isSyncingRef.current = false;
      return true;
    } catch (e) {
      console.error('syncCartToServer error', e?.response?.status, e?.response?.data || e.message);
      isSyncingRef.current = false;
      return false;
    }
  };

  // block navigation on beforeRemove and attempt sync
  useEffect(() => {
    const beforeRemove = (e) => {
      // 데이터가 아직 로드되지 않은 상태에서 나가면 동기화 스킵 (기존 데이터 보존 위해)
      if (!isDataLoadedRef.current) return;

      // 리스트가 비어있어도 동기화 진행 (장바구니 비우기)
      // if (scannedProductsRef.current.length === 0) return;

      e.preventDefault();

      const trySync = async () => {
        const ok = await syncCartToServer();
        if (ok) {
          navigation.dispatch(e.data.action);
        } else {
          Alert.alert('동기화 실패', '장바구니를 서버에 저장하지 못했습니다. 계속하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '다시시도', onPress: () => trySync() },
            { text: '저장 안함', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
          ]);
        }
      };

      trySync();
    };

    const unsub = navigation.addListener('beforeRemove', beforeRemove);
    return () => unsub();
  }, [navigation]);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/`);
      setProducts(response.data);
      return response.data;
    } catch (e) {
      console.error("로드 실패", e);
      return [];
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

  const loadCartFromServer = async (productList = []) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        return false;
      }

      const response = await axios.get(`${API_BASE_URL}/api/cart/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = response.data?.items ?? [];
      if (items.length == 0) {
        return false;
      }

      const productMap = new Map(
        productList.map((product) => [product.product_id, product])
      );

      const serverProducts = items.map((item) => {
        const product = productMap.get(item.product_id);
        return {
          product_id: item.product_id,
          product_name: item.name ?? product?.name ?? "",
          image_url:
            product?.image_url ?? `/static/products/${item.product_id}.jpg`,
          price: item.price ?? product?.price ?? 0,
          brand_name: null,
          size: null,
        };
      });

      const serverQuantities = items.reduce((acc, item) => {
        acc[item.product_id] = item.quantity;
        return acc;
      }, {});

      setScannedProducts(serverProducts);
      setProductQuantities(serverQuantities);
      return true;
    } catch (e) {
      console.error("cart fetch failed", e);
      return false;
    }
  };

  // --- 장바구니 핵심 로직 =============================================================
  const addToCart = (product) => {
    const pid = Number(product.product_id);
    const normalized = { ...product, product_id: pid };

    setScannedProducts((prev) => {
      const isExist = prev.find((p) => Number(p.product_id) === pid);
      if (isExist) {
        // force re-render by returning a new array with a copied item
        const updated = prev.map((p) =>
          Number(p.product_id) === pid ? { ...p } : p
        );
        setProductQuantities((prevQty) => ({
          ...prevQty,
          [pid]: (prevQty[pid] || 1) + 1,
        }));
        return updated;
      }
      setProductQuantities((prevQty) => ({
        ...prevQty,
        [pid]: 1,
      }));
      return [...prev, normalized];
    });

    setIsModalVisible(false);
    setSelectedProduct(null);
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

  const handlePurchase = async () => {
    if (scannedProducts.length === 0) {
      Alert.alert("알림", "장바구니가 비어있습니다.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      // 서버로 현재 장바구니 상태 동기화
      const itemsToSync = scannedProducts.map((p) => ({
        product_id: p.product_id,
        quantity: productQuantities[p.product_id] || 1,
      }));

      await axios.post(
        `${API_BASE_URL}/api/cart/scan/sync`,
        { items: itemsToSync },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 결제 화면으로 이동
      const paymentProducts = scannedProducts.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        brand_name: p.brand_name || "",
        price: p.price,
        size: p.size || "",
        quantity: productQuantities[p.product_id] || 1,
        image_url: p.image_url,
      }));

      navigation.navigate("Payment", {
        products: paymentProducts,
        quantities: productQuantities,
      });
    } catch (e) {
      console.error("Purchase Sync Error:", e);
      Alert.alert("오류", "장바구니 동기화에 실패했습니다.");
    }
  };

  const calculateTotal = () => {
    return scannedProducts.reduce((sum, product) => {
      const qty = productQuantities[product.product_id] || 0;
      return sum + product.price * qty;
    }, 0);
  };

  // --- 촬영 및 서버 통신 =============================================================
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
        timeout: 10000,
      });

      console.log("Scan Result:", res.data); // [LOG] 스캔 결과 로그 복구

      if (res.data?.result) {
        const result = res.data.result;
        console.log("Detected Product:", result); // [LOG] 인식된 상품 정보

        if (typeof result.confidence === "number" && result.confidence < 0.8) {
          console.log("Low Confidence:", result.confidence); // [LOG] 정확도 낮음
          Alert.alert("알림", "상품을 인식할 수 없습니다.\n다시 스캔해주세요.");
        } else {
          setSelectedProduct(result);
          setIsModalVisible(true);
        }
      } else {
        console.log("No Result Data"); // [LOG] 결과 데이터 없음
        Alert.alert("알림", "상품을 인식할 수 없습니다.\n다시 스캔해주세요.");
      }
    } catch (e) {
      console.error("Scan Error:", e); // [LOG] 스캔 에러
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
        <AppText>카메라 권한이 필요합니다.</AppText>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <AppText style={{ color: "#fff" }}>권한 요청</AppText>
        </TouchableOpacity>
      </View>
    );

  // --- UI 시작 =============================================================
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <Header navigation={navigation} title="상품 스캔하기" />

            {/* ================= [ADD] L자 스캔 프레임 ================= */}
            <View
              pointerEvents="none"
              style={[styles.lFrameWrapper, { top: GUIDE_OFFSET_Y }]}
            >
              <View
                style={[
                  styles.lFrameBox,
                  {
                    width: SCREEN_WIDTH * GUIDE_WIDTH_RATIO,
                    height: SCREEN_WIDTH * GUIDE_HEIGHT_RATIO,
                  },
                ]}
              >
                <View style={[styles.lCorner, styles.lTL]} />
                <View style={[styles.lCorner, styles.lTR]} />
                <View style={[styles.lCorner, styles.lBL]} />
                <View style={[styles.lCorner, styles.lBR]} />
              </View>
            </View>
            {/* ======================================================== */}
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

        {/* ===== 이하 장바구니 / 결제 / 모달 원본 그대로 ===== */}

        {/* 바텀 드로워 (장바구니 리스트) */}
        <Animated.View
          style={[styles.drawer, { transform: [{ translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBar} />
          <AppText style={styles.drawerHeader}>
            내 장바구니 ({scannedProducts.length})
          </AppText>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {scannedProducts.length === 0 ? (
              <AppText style={styles.emptyText}>
                스캔한 상품이 여기 표시됩니다.
              </AppText>
            ) : (
              scannedProducts.map((item) => (
                <View key={item.product_id} style={styles.cartItem}>
                  <View style={styles.itemHeader}>
                    <View />
                    <TouchableOpacity
                      onPress={() => removeProduct(item.product_id)}
                    >
                      <AppText style={{ color: "#ccc" }}>✕</AppText>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemBody}>
                    <Image
                      source={{ uri: `${API_BASE_URL}${item.image_url}` }}
                      style={styles.itemImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <AppText style={styles.itemNameInline} numberOfLines={1}>
                        {item.product_name}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.itemFooter}>
                    <AppText style={styles.itemPrice}>
                      {(
                        item.price * productQuantities[item.product_id]
                      ).toLocaleString()}
                      원
                    </AppText>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        onPress={() => decreaseQuantity(item.product_id)}
                        style={styles.qtyBtn}
                      >
                        <AppText>-</AppText>
                      </TouchableOpacity>
                      <AppText style={styles.qtyText}>
                        {productQuantities[item.product_id]}
                      </AppText>
                      <TouchableOpacity
                        onPress={() => increaseQuantity(item.product_id)}
                        style={styles.qtyBtn}
                      >
                        <AppText>+</AppText>
                      </TouchableOpacity>
                    </View>
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
            <AppText style={styles.totalLabel}>합계</AppText>
            <AppText style={styles.totalPriceText}>
              {calculateTotal().toLocaleString()}원
            </AppText>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handlePurchase}>
            <AppText style={styles.payBtnText}>구매하기</AppText>
          </TouchableOpacity>
        </View>

        {/* 인식 확인 모달 */}
        <Modal visible={isModalVisible} transparent animationType="none">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              

              {/* 👇 여기 */}
              {selectedProduct && (
                <>
                  <Image
                    source={{
                      uri: `${API_BASE_URL}${selectedProduct.image_url}`,
                    }}
                    style={styles.modalImg}
                    resizeMode="contain"
                  />
                  <AppText style={styles.modalName}>
                    {selectedProduct.product_name}
                  </AppText>
                  <AppText style={styles.modalPrice}>
                    {selectedProduct.price?.toLocaleString()}원
                  </AppText>
                  <AppText style={styles.modalTitle}>
                    상품을 추가하시겠습니까?
                  </AppText>
                </>
              )}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setIsModalVisible(false)}
                >
                  <AppText>취소</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOk}
                  onPress={() => addToCart(selectedProduct)}
                >
                  <AppText style={{ color: "#fff", fontWeight: "bold" }}>
                    담기
                  </AppText>
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

  /* ================= [ADD] L자 프레임 스타일 ================= */
  lFrameWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  lFrameBox: {
    position: "relative",
  },
  lCorner: {
    position: "absolute",
    width: GUIDE_LENGTH,
    height: GUIDE_LENGTH,
    borderColor: "#FF9500",
  },
  lTL: {
    top: 0,
    left: 0,
    borderTopWidth: GUIDE_BORDER,
    borderLeftWidth: GUIDE_BORDER,
  },
  lTR: {
    top: 0,
    right: 0,
    borderTopWidth: GUIDE_BORDER,
    borderRightWidth: GUIDE_BORDER,
  },
  lBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: GUIDE_BORDER,
    borderLeftWidth: GUIDE_BORDER,
  },
  lBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: GUIDE_BORDER,
    borderRightWidth: GUIDE_BORDER,
  },
  /* =========================================================== */

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
    border: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 10,
  },
  drawerHeader: {
    fontSize: fontSizes.md,
    fontWeight: "bold",
    marginVertical: 10,
  },
  cartItem: {
    flexDirection: "column",
    //alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    // 그림자 효과 (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    // 그림자 효과 (Android)
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    //marginBottom: 5,
  },
  itemImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    //backgroundColor: "#f5f5f5",
    resizeMode: "contain",
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemNameInline: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#333",
    // move slightly down relative to the image
    marginTop: 15,
  },
  itemBody: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  itemPrice: {
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: "#FF9500",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    //marginTop: 10,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    // 버튼 입체감
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyText: {
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 15,
    textAlign: "center",
  },

  // 하단 결제바
  purchaseBar: {
    position: "absolute",
    bottom: 10,
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
  totalLabel: { color: "#888", fontSize: fontSizes.sm },
  totalPriceText: { fontSize: fontSizes.xl, fontWeight: "bold" },
  payBtn: {
    backgroundColor: "#FF9500",
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  payBtnText: { color: "#fff", fontSize: fontSizes.md, fontWeight: "bold" },

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
  modalTitle: { fontSize: fontSizes.md, fontWeight: "bold", marginBottom: 15 },
  modalImg: { width: "100%", height: 150, marginBottom: 15 },
  modalName: { fontSize: fontSizes.sm, marginBottom: 5 },
  modalPrice: {
    fontSize: fontSizes.lg,
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
