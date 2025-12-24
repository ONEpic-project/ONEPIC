import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from './components/Header';

const { width } = Dimensions.get('window');

const ReceiptDetailScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Header 
          navigation={navigation}
          title="전자영수증"
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 매장 정보 */}
        <View style={styles.storeSection}>
          <Text style={styles.storeName}>원핑마트 동대구점</Text>
          <Text style={styles.storeAddress}>대구광역시 중구 동내구로 566</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>대표자 김준서</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>사업자번호 123-456-7890</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>고객센터 053-952-0008</Text>
          </View>
        </View>

        {/* 거래 정보 */}
        <View style={styles.transactionSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>거래일시 2025-12-22</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>거래수단 네이버페이</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>카드번호 1234********5678</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>승인번호 123456</Text>
          </View>
        </View>

        {/* 상품 목록 */}
        <View style={styles.divider} />
        
        <View style={styles.itemsHeader}>
          <Text style={[styles.tableHeader, { flex: 2 }]}>상품</Text>
          <Text style={[styles.tableHeader, { flex: 0.5, textAlign: 'center' }]}>수량</Text>
          <Text style={[styles.tableHeader, { flex: 1, textAlign: 'right' }]}>금액</Text>
        </View>
        
        <View style={styles.divider} />

        {/* 상품 아이템 */}
        <View style={styles.itemRow}>
          <Text style={[styles.itemName, { flex: 2 }]}>오리온 초코송이 40g</Text>
          <Text style={[styles.itemQuantity, { flex: 0.5, textAlign: 'center' }]}>1</Text>
          <Text style={[styles.itemPrice, { flex: 1, textAlign: 'right' }]}>1,380원</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={[styles.itemName, { flex: 2 }]}>오리온 예감 오리지널 38g</Text>
          <Text style={[styles.itemQuantity, { flex: 0.5, textAlign: 'center' }]}>1</Text>
          <Text style={[styles.itemPrice, { flex: 1, textAlign: 'right' }]}>2,080원</Text>
        </View>

        {/* 안내사항 */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeText}>
            · 교환, 환불은 결제일로부터 15일 이내
          </Text>
          <Text style={styles.noticeText}>
            · 미개봉 제품에 한해 결제했던 수단과 구매영수증 지참 후 매장 방문 시 가능
          </Text>
          <Text style={styles.noticeText}>
            · 단 한번 수단 변경은 구매매장에서만 가능
          </Text>
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
  scrollView: {
    flex: 1,
  },
  storeSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 24,
    paddingBottom: 16,
  },
  storeName: {
    fontSize: width > 400 ? 20 : 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  storeAddress: {
    fontSize: width > 400 ? 14 : 13,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: width > 400 ? 14 : 13,
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
    fontSize: width > 400 ? 14 : 13,
    fontWeight: '600',
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.05,
    paddingVertical: 12,
  },
  itemName: {
    fontSize: width > 400 ? 14 : 13,
    color: '#333',
  },
  itemQuantity: {
    fontSize: width > 400 ? 14 : 13,
    color: '#333',
  },
  itemPrice: {
    fontSize: width > 400 ? 14 : 13,
    color: '#333',
    fontWeight: '500',
  },
  noticeSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 24,
    paddingBottom: 40,
  },
  noticeText: {
    fontSize: width > 400 ? 12 : 11,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ReceiptDetailScreen;
