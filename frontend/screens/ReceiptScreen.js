import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';

import Header from './components/Header';
import PeriodDropdown from './components/PeriodDropdown';

const { width, height } = Dimensions.get('window');

const ReceiptScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // API 호출로 데이터 필터링
    console.log('선택된 기간:', period);
  };

  const handleReceiptDetail = (receiptId) => {
    console.log('영수증 보기:', receiptId);
    // 영수증 상세 화면으로 이동
    // navigation.navigate('ReceiptDetail', { id: receiptId });
  };

  const renderReceiptItem = ({ item }) => (
    <View style={styles.receiptItemContainer}>
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptDate}>{item.date}</Text>
        <Text style={styles.receiptAmount}>{item.amount}원 {item.purchase}</Text>
      </View>
      <TouchableOpacity
        style={styles.receiptButton}
        onPress={() => navigation.navigate('ReceiptDetail')}
        activeOpacity={0.7}
      >
        <Text style={styles.receiptButtonText}>영수증 보기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>

        <Header 
          navigation={navigation}
          title="전자영수증"
        />

        <PeriodDropdown
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />

        {/* 상단 구분선 */}
        <View style={styles.topDivider} />

        {/* 영수증 리스트 */}
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  topDivider: {
    height: 1,
    backgroundColor: '#D2D2D2',
  },
  listContent: {
    paddingBottom: 20,
  },
  receiptItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 33,
    backgroundColor: '#FFFFFF',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptDate: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: '#2C2C2C',
    marginBottom: 4,
  },
  receiptAmount: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: '#2C2C2C',
  },
  receiptButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFC685',
    borderRadius: 39,
  },
  receiptButtonText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
    color: '#FF9317',
  },
  divider: {
    height: 1,
    backgroundColor: '#D2D2D2',
    marginHorizontal: 0,
  },
});

export default ReceiptScreen;
