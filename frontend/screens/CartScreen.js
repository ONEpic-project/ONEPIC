import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from './components/Header';
import { API_BASE_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 장바구니 조회
  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/cart/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = response.data.items.map(item => ({
        id: item.cart_item_id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        description: '',
      }));

      setCartItems(items);
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      Alert.alert('오류', '장바구니를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
    });
    return unsubscribe;
  }, [navigation]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('알림', '장바구니가 비어있습니다.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 변경된 수량을 DB에 일괄 업데이트
      for (const item of cartItems) {
        await axios.patch(
          `${API_BASE_URL}/api/cart/items/${item.id}`,
          { quantity: item.quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const paymentProducts = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.name,
        brand_name: item.description || '브랜드 미상',
        price: item.price,
        size: '-',
        quantity: item.quantity,
        image_url: `/static/products/${item.product_id}/main.jpg`
      }));

      const total = cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );

      navigation.navigate('Payment', {
        products: paymentProducts,
        quantities: cartItems.reduce((acc, item) => {
          acc[item.product_id] = item.quantity;
          return acc;
        }, {}),
        totalPrice: total
      });
    } catch (error) {
      console.error('장바구니 업데이트 실패:', error);
      Alert.alert('오류', '장바구니 업데이트에 실패했습니다.');
    }
  };

  // 수량 증가 (로컬에서만)
  const increaseQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // 수량 감소 (로컬에서만)
  const decreaseQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id && item.quantity > 1 
        ? { ...item, quantity: item.quantity - 1 } 
        : item
    ));
  };

  // 아이템 삭제
  const removeItem = (id) => {
    Alert.alert(
      '삭제 확인',
      '이 상품을 장바구니에서 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              await axios.delete(
                `${API_BASE_URL}/api/cart/items/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setCartItems(cartItems.filter(item => item.id !== id));
            } catch (error) {
              console.error('삭제 실패:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // 전체 삭제
  const removeAll = () => {
    Alert.alert(
      '전체 삭제',
      '장바구니를 비우시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '전체 삭제', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              
              // 각 아이템 삭제
              for (const item of cartItems) {
                await axios.delete(
                  `${API_BASE_URL}/api/cart/items/${item.id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }

              setCartItems([]);
            } catch (error) {
              console.error('전체 삭제 실패:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // 총 합계 계산
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 구매하기
  const handlePurchase = () => {
    if (cartItems.length === 0) {
      Alert.alert('알림', '장바구니가 비어있습니다.');
      return;
    }
    Alert.alert('구매 확인', `총 ${totalPrice.toLocaleString()}원을 결제하시겠습니까?`);
  };

  const renderCartItem = ({ item, index }) => (
    <View style={styles.cartItem}>
      {/* 상품 이미지 */}
      <Image source={item.image} style={styles.productImage} resizeMode="contain" />
      
      {/* 상품 정보 */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <Text style={styles.productPrice}>{item.price.toLocaleString()}원</Text>
      </View>

      {/* 수량 조절 */}
      <View style={styles.quantityControl}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => decreaseQuantity(item.id)}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}개</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => increaseQuantity(item.id)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 삭제 버튼 */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => removeItem(item.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* 상품 리스트 상단 부분 */}
      {cartItems.slice(0, Math.ceil(cartItems.length / 2)).map((item, index) => (
        <View key={item.id}>
          {renderCartItem({ item, index })}
        </View>
      ))}

      {/* 합계 섹션 */}
      {cartItems.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>합계</Text>
            <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}원</Text>
          </View>
          
          <TouchableOpacity 
          style={styles.purchaseButton}
          onPress={() => navigation.navigate('Payment')}
          >
            <Text style={styles.purchaseButtonText}>구매하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <Header 
        navigation={navigation}
        title="장바구니"
      />

        <TouchableOpacity 
          style={styles.deleteAllButton}
          onPress={removeAll}
        >
          <Text style={styles.deleteAllText}>전체 삭제</Text>
        </TouchableOpacity>

      {/* 장바구니 리스트 */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>장바구니가 비어있습니다</Text>
        </View>
      ) : (
        <FlatList
          data={cartItems.slice(Math.ceil(cartItems.length / 2))}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: width * 0.1,
    height: width * 0.1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: width * 0.06,
    color: '#333',
  },
  headerTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#333',
  },
  deleteAllButton: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
  },
  deleteAllText: {
    fontSize: width * 0.035,
    color: '#FF9500',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productImage: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.02,
    backgroundColor: '#F5F5F5',
    marginRight: width * 0.03,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.005,
  },
  productDescription: {
    fontSize: width * 0.03,
    color: '#999',
    lineHeight: width * 0.04,
    marginBottom: height * 0.005,
  },
  productPrice: {
    fontSize: width * 0.036,
    fontWeight: '700',
    color: '#333',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  quantityButton: {
    width: width * 0.08,
    height: width * 0.08,
    backgroundColor: '#FF9500',
    borderRadius: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quantityText: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: width * 0.02,
    minWidth: width * 0.08,
    textAlign: 'center',
  },
  deleteButton: {
    width: width * 0.08,
    height: width * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: width * 0.05,
    color: '#CCC',
  },
  summarySection: {
    backgroundColor: '#FAFAFA',
    paddingVertical: height * 0.025,
    paddingHorizontal: width * 0.05,
    marginVertical: height * 0.02,
    marginHorizontal: -width * 0.05,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  totalLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#333',
  },
  purchaseButton: {
    width: '100%',
    height: height * 0.06,
    backgroundColor: '#FF9500',
    borderRadius: height * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: width * 0.04,
    color: '#999',
  },
});

export default CartScreen;
