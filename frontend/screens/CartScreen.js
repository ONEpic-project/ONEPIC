import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import AppText from "../components/AppText";
import { fontSizes } from '../config/typography';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Header from "./components/Header";
import { API_BASE_URL } from "../config/api";

const { width, height } = Dimensions.get("window");

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/cart/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = (response.data?.items ?? []).map((item) => ({
        id: item.cart_item_id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: {
          uri: `${API_BASE_URL}/static/products/${item.product_id}.jpg`,
        },
        description: "",
      }));

      setCartItems(items);
      setPendingDeleteIds([]);
    } catch (error) {
      console.error("장바구니 조회 실패:", error);
      Alert.alert("오류", "장바구니를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchCart();
    });
    return unsubscribe;
  }, [navigation]);

  const syncCartChanges = useCallback(async () => {
    if (loading) {
      return;
    }
    if (cartItems.length === 0 && pendingDeleteIds.length === 0) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        return;
      }

      let remainingDeleteIds = [...pendingDeleteIds];

      for (const id of pendingDeleteIds) {
        try {
          await axios.delete(`${API_BASE_URL}/api/cart/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          remainingDeleteIds = remainingDeleteIds.filter(
            (itemId) => itemId !== id
          );
        } catch (error) {
          const status = error?.response?.status;
          if (status === 404) {
            remainingDeleteIds = remainingDeleteIds.filter(
              (itemId) => itemId !== id
            );
          } else {
            console.error("Cart delete sync failed:", error);
          }
        }
      }

      for (const item of cartItems) {
        try {
          await axios.patch(
            `${API_BASE_URL}/api/cart/items/${item.id}`,
            { quantity: item.quantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Cart quantity sync failed:", error);
        }
      }

      setPendingDeleteIds(remainingDeleteIds);
    } catch (error) {
      console.error("Cart sync failed:", error);
    }
  }, [cartItems, pendingDeleteIds, loading]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      syncCartChanges();
    });
    return unsubscribe;
  }, [navigation, syncCartChanges]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert("알림", "장바구니가 비어있습니다.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      await syncCartChanges();

      const paymentProducts = cartItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.name,
        brand_name: item.description || "브랜드 미상",
        price: item.price,
        size: "-",
        quantity: item.quantity,
        image_url: `/static/products/${item.product_id}.jpg`,
      }));

      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      navigation.navigate("Payment", {
        products: paymentProducts,
        quantities: cartItems.reduce((acc, item) => {
          acc[item.product_id] = item.quantity;
          return acc;
        }, {}),
        totalPrice: total,
      });
    } catch (error) {
      console.error("장바구니 업데이트 실패:", error);
      Alert.alert("오류", "장바구니 업데이트에 실패했습니다.");
    }
  };

  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeItem = (id) => {
    Alert.alert("삭제 확인", "해당 상품을 장바구니에서 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        onPress: () => {
          setPendingDeleteIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          );
          setCartItems((prev) => prev.filter((item) => item.id !== id));
        },
        style: "destructive",
      },
    ]);
  };

  const removeAll = () => {
    Alert.alert("전체 삭제", "장바구니를 비우시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "전체 삭제",
        onPress: () => {
          const idsToDelete = cartItems.map((item) => item.id);
          setPendingDeleteIds((prev) => {
            const combined = new Set([...prev, ...idsToDelete]);
            return Array.from(combined);
          });
          setCartItems([]);
        },
        style: "destructive",
      },
    ]);
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItemCard}>
      {/* 상단: 삭제 버튼 (상품명은 이미지 옆 한 곳에서만 표시) */}
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          onPress={() => removeItem(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppText style={styles.deleteIcon}>✕</AppText>
        </TouchableOpacity>
      </View>

      {/* 중간: 이미지 + 정보 */}
      <View style={styles.itemBody}>
        <Image source={item.image} style={styles.itemImg} resizeMode="cover" />
        <View style={styles.itemInfo}>
          <AppText style={styles.itemNameSecondary} numberOfLines={1}>
            {item.name}
          </AppText>
          {item.description ? (
            <AppText style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* 하단: 가격 + 수량 조절 */}
      <View style={styles.itemFooter}>
        <AppText style={styles.itemPrice}>
          {(item.price * item.quantity).toLocaleString()}원
        </AppText>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => decreaseQuantity(item.id)}
            style={styles.qtyBtn}
          >
            <AppText style={styles.qtyBtnText}>-</AppText>
          </TouchableOpacity>
          <AppText style={styles.qtyText}>{item.quantity}</AppText>
          <TouchableOpacity
            onPress={() => increaseQuantity(item.id)}
            style={styles.qtyBtn}
          >
            <AppText style={styles.qtyBtnText}>+</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      {cartItems
        .slice(0, Math.ceil(cartItems.length / 2))
        .map((item, index) => (
          <View key={item.id}>{renderCartItem({ item, index })}</View>
        ))}

      {cartItems.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.totalContainer}>
            <AppText style={styles.totalLabel}>합계</AppText>
            <AppText style={styles.totalPrice}>
              {totalPrice.toLocaleString()}원
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handleCheckout}
          >
            <AppText style={styles.purchaseButtonText}>구매하기</AppText>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container} edges={["top", "left", "right"]}>
      <Header navigation={navigation} title="장바구니" />

      <TouchableOpacity style={styles.deleteAllButton} onPress={removeAll}>
        <AppText style={styles.deleteAllText}>전체 삭제</AppText>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText style={styles.emptyText}>장바구니가 비어있습니다</AppText>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />

          {/* 하단 고정 결제 바 (ScanScreen & PaymentScreen 스타일 참고) */}
          <View style={styles.fixedFooter}>
            <View style={styles.priceSummaryCard}>
              <View style={styles.priceRow}>
                <AppText style={styles.priceLabel}>상품 금액</AppText>
                <AppText style={styles.priceValue}>
                  {totalPrice.toLocaleString()}원
                </AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <AppText style={styles.totalLabel}>총 결제 금액</AppText>
                <AppText style={styles.totalPriceText}>
                  {totalPrice.toLocaleString()}원
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handleCheckout}
            >
              <AppText style={styles.purchaseButtonText}>구매하기</AppText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  deleteAllButton: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.06,
  },
  deleteAllText: {
    color: "#FF9500",
    fontWeight: "600",
    fontSize: fontSizes.sm,
  },
  listContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
  },

  cartItemCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemName: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  deleteIcon: { color: "#ccc", fontSize: fontSizes.md, fontWeight: "600" },
  itemBody: { flexDirection: "row", marginBottom: 10 },
  itemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemNameSecondary: { fontSize: fontSizes.sm, color: "#000000ff", marginBottom: 0, fontWeight: "600" },
  itemDescription: { fontSize: fontSizes.sm, color: "#999" },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: { fontSize: fontSizes.md, fontWeight: "bold", color: "#333" },

  // 수량 조절 (ScanScreen 스타일)
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
    elevation: 1,
  },
  qtyBtnText: { fontSize: fontSizes.md, fontWeight: "600", color: "#333" },
  qtyText: {
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 15,
    textAlign: "center",
  },

  fixedFooter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  priceSummaryCard: { marginBottom: 15 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  priceLabel: { color: "#666", fontSize: fontSizes.sm },
  priceValue: { fontWeight: "600", color: "#333", fontSize: fontSizes.md },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  totalLabel: { fontWeight: "bold", fontSize: fontSizes.md },
  totalPriceText: { fontSize: fontSizes.lg, fontWeight: "bold", color: "#FF9500" },
  purchaseButton: {
    backgroundColor: "#FF9500",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  purchaseButtonText: { color: "#fff", fontSize: fontSizes.md, fontWeight: "bold" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: "#999",
  },
});

export default CartScreen;
