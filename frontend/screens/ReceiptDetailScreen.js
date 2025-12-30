import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AppText from '../components/AppText';
import { fontSizes } from '../config/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from './components/Header';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

const ReceiptDetailScreen = ({ route, navigation }) => {
  const { receiptId } = route.params || {};
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) {
      Alert.alert('오류', '영수증 정보가 없습니다.');
      navigation.goBack();
      return;
    }
    fetchReceiptDetail();
  }, [receiptId]);

  const fetchReceiptDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/receipts/${receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceipt(response.data);
    } catch (error) {
      console.error('영수증 상세 조회 실패:', error);
      Alert.alert('오류', '영수증 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'kakao': return '카카오페이';
      case 'card': return '카드 결제';
      default: return method || '-';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={[styles.container, styles.center]}>
        <AppText>영수증 정보가 없습니다.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: 13 }} />
      <Header navigation={navigation} title="전자영수증" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 매장 정보 (고정) */}
        <View style={styles.storeSection}>
          <AppText style={styles.storeName}>원픽마트 동대구점</AppText>
          <AppText style={styles.storeAddress}>대구광역시 중구 동내구로 566</AppText>
          
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>대표자 김준서</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>사업자번호 123-456-7890</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>고객센터 053-952-0008</AppText>
          </View>
        </View>

        {/* 거래 정보 (동적) */}
        <View style={styles.transactionSection}>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>거래일시 {formatDate(receipt.created_at)}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>거래수단 {getPaymentMethodName(receipt.payment_method)}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>결제금액 {receipt.total_amount?.toLocaleString()}원</AppText>
          </View>
          {/* 카드번호/승인번호는 실제 데이터가 없으므로 임시 숨김 처리하거나 고정값 유지 */}
          <View style={styles.infoRow}>
             <AppText style={styles.infoLabel}>승인번호 {receipt.receipt_id.toString().padStart(8, '0')}</AppText>
          </View>
        </View>

        {/* 상품 목록 (동적) */}
        <View style={styles.divider} />
        
        <View style={styles.itemsHeader}>
          <AppText style={[styles.tableHeader, { flex: 2 }]}>상품</AppText>
          <AppText style={[styles.tableHeader, { flex: 0.5, textAlign: 'center' }]}>수량</AppText>
          <AppText style={[styles.tableHeader, { flex: 1, textAlign: 'right' }]}>금액</AppText>
        </View>
        
        <View style={styles.divider} />

        {/* 상품 아이템 반복 렌더링 */}
        {receipt.items && receipt.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <AppText style={[styles.itemName, { flex: 2 }]}>{item.product_name}</AppText>
            <AppText style={[styles.itemQuantity, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</AppText>
            <AppText style={[styles.itemPrice, { flex: 1, textAlign: 'right' }]}>
              {(item.price * item.quantity).toLocaleString()}원
            </AppText>
          </View>
        ))}

        {/* 안내사항 */}
        <View style={styles.noticeSection}>
          <AppText style={styles.noticeText}>
            · 교환, 환불은 결제일로부터 15일 이내
          </AppText>
          <AppText style={styles.noticeText}>
            · 미개봉 제품에 한해 결제했던 수단과 구매영수증 지참 후 매장 방문 시 가능
          </AppText>
          <AppText style={styles.noticeText}>
            · 단 한번 수단 변경은 구매매장에서만 가능
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  storeSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 24,
    paddingBottom: 16,
  },
  storeName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  storeAddress: {
    fontSize: fontSizes.sm,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: '#333',
    lineHeight: 20,
  },
  transactionSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 8,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: width * 0.05,
    marginVertical: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
  },
  tableHeader: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.05,
    paddingVertical: 12,
  },
  itemName: {
    fontSize: fontSizes.sm,
    color: '#333',
  },
  itemQuantity: {
    fontSize: fontSizes.sm,
    color: '#333',
  },
  itemPrice: {
    fontSize: fontSizes.sm,
    color: '#333',
    fontWeight: '500',
  },
  noticeSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 24,
    paddingBottom: 40,
  },
  noticeText: {
    fontSize: fontSizes.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ReceiptDetailScreen;
