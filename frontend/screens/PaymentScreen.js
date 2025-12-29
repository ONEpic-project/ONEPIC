import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from './components/Header';
import { API_BASE_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  /* ============================
     1. ScanScreen에서 전달받은 데이터
  ============================ */
  const products = route?.params?.products ?? [];
  const quantities = route?.params?.quantities ?? {};
  const totalPrice = route?.params?.totalPrice ?? 0;

  const [selectedPayment, setSelectedPayment] = useState(null);

  /* ============================
     2. 상품 데이터 정규화
  ============================ */
  const normalizedProducts = products.map(p => ({
    id: p.product_id,
    name: p.product_name,
    brand: p.brand_name,
    price: p.price,
    size: p.size,
    quantity: quantities[p.product_id] ?? 1,
    image: `${API_BASE_URL}${p.image_url}`,
  }));

  const totalQuantity = normalizedProducts.reduce(
    (sum, p) => sum + p.quantity,
    0
  );

  /* ============================
     3. 결제 수단
  ============================ */
  const paymentMethods = [
    { id: 'card', name: '카드 결제', icon: 'card-outline' },
    { id: 'kakao', name: '카카오페이', icon: 'chatbubble-outline' },
  ];

  /* ============================
     4. 결제 처리
  ============================ */
  const handlePayment = () => {
    if (!selectedPayment) {
      Alert.alert('알림', '결제 방법을 선택해주세요');
      return;
    }

    Alert.alert(
      '결제 확인',
      `${totalPrice.toLocaleString()}원을 결제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert('결제 완료', '결제가 완료되었습니다', [
              {
                text: '확인',
                onPress: () => navigation.navigate('Paid'),
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header navigation={navigation} title="결제하기" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 주문 상품 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>총 상품 개수</Text>
              <Text style={styles.summaryValue}>{totalQuantity}개</Text>
            </View>
            <View style={styles.divider} />

            {normalizedProducts.map((product, index) => (
              <View key={product.id}>
                <View style={styles.productRow}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productQuantity}>
                      수량: {product.quantity}개
                    </Text>
                  </View>
                  <Text style={styles.productTotal}>
                    {(product.price * product.quantity).toLocaleString()}원
                  </Text>
                </View>
                {index < normalizedProducts.length - 1 && (
                  <View style={styles.productDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 결제 방법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 방법</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id &&
                  styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedPayment === method.id ? '#ff9500' : '#666'}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPayment === method.id &&
                    styles.paymentMethodTextSelected,
                  ]}
                >
                  {method.name}
                </Text>
                {selectedPayment === method.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#ff9500"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 결제 금액 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>상품 금액</Text>
              <Text style={styles.priceValue}>
                {totalPrice.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>총 결제 금액</Text>
              <Text style={styles.totalPrice}>
                {totalPrice.toLocaleString()}원
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* 하단 결제 버튼 */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>총 결제 금액</Text>
          <Text style={styles.bottomTotalPrice}>
            {totalPrice.toLocaleString()}원
          </Text>
        </View>
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={handlePayment}
        >
          <Text style={styles.paymentButtonText}>
            결제하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================
   스타일 (원본 그대로)
============================ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#666' },
  summaryValue: { fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  productDetails: { flex: 1 },
  productName: { fontSize: 14 },
  productQuantity: { fontSize: 13, color: '#999' },
  productTotal: { fontWeight: '600' },
  productDivider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 8 },
  paymentMethods: { backgroundColor: '#fff', borderRadius: 12 },
  paymentMethod: { flexDirection: 'row', padding: 18 },
  paymentMethodSelected: { backgroundColor: '#FFF5EB' },
  paymentMethodText: { marginLeft: 12, flex: 1 },
  paymentMethodTextSelected: { color: '#ff9500', fontWeight: '600' },
  checkIcon: { marginLeft: 'auto' },
  priceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: 'bold' },
  totalPrice: { fontWeight: 'bold', color: '#ff9500' },
  bottomContainer: { backgroundColor: '#fff', padding: 20 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  bottomTotalLabel: { fontWeight: '600' },
  bottomTotalPrice: { fontSize: 22, fontWeight: 'bold', color: '#ff9500' },
  paymentButton: {
    backgroundColor: '#ff9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  paymentButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
