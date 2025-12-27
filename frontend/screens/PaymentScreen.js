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

const { width, height } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  const { products, total } = route.params;
  const [selectedPayment, setSelectedPayment] = useState(null);

  // CartScreen에서 PaymentScreen으로 navigate할 때
  navigation.navigate('Payment', {
    products: [
      {
        id: product.product_id,           // AI API의 product_id
        name: product.product_name,       // AI API의 product_name
        brand: product.brand_name,        // AI API의 brand_name
        price: product.price,             // AI API의 price
        size: product.size,               // AI API의 size
        quantity: cartItem.quantity,      // 장바구니에서 관리하는 수량
        image: `/static/products/${product.product_id}/main.jpg` // 상품 이미지 경로
      }
    ],
    total: calculateTotal() // 총 금액
  });

  const handlePayment = () => {
    if (!selectedPayment) {
      Alert.alert('알림', '결제 방법을 선택해주세요');
      return;
    }

    Alert.alert(
      '결제 확인',
      `${total.toLocaleString()}원을 결제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          onPress: () => {
            // 실제 결제 로직 구현
            Alert.alert('결제 완료', '결제가 완료되었습니다', [
              {
                text: '확인',
                onPress: () => navigation.navigate('Home'),
              },
            ]);
          },
        },
      ]
    );
  };

  const totalQuantity = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header 
        navigation={navigation}
        title="결제하기"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>총 상품 개수</Text>
              <Text style={styles.summaryValue}>{totalQuantity}개</Text>
            </View>
            <View style={styles.divider} />
            {products.map((product, index) => (
              <View key={product.id}>
                <View style={styles.productRow}>
                  <Image source={product.image} style={styles.productImage} />
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
                {index < products.length - 1 && (
                  <View style={styles.productDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 방법</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedPayment === method.id ? '#FF8C00' : '#666'}
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
                    color="#FF8C00"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>상품 금액</Text>
              <Text style={styles.priceValue}>{total.toLocaleString()}원</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>배송비</Text>
              <Text style={styles.priceValue}>무료</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>총 결제 금액</Text>
              <Text style={styles.totalPrice}>{total.toLocaleString()}원</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>총 결제 금액</Text>
          <Text style={styles.bottomTotalPrice}>
            {total.toLocaleString()}원
          </Text>
        </View>
        <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
          <Text style={styles.paymentButtonText}>
            {total.toLocaleString()}원 결제하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: '#999',
  },
  productTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  productDivider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 8,
  },
  paymentMethods: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  paymentMethodSelected: {
    backgroundColor: '#FFF5EB',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTextSelected: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    color: '#333',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomTotalPrice: {
    fontSize: 22,
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
});
