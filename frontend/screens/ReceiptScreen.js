import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import Header from './components/Header';

const { width } = Dimensions.get('window');

/**
 * 임시 영수증 리스트 (UI 확인용)
 * ❌ 네트워크 / DB / user 무시
 */
const DUMMY_RECEIPTS = [
  { id: 1, date: '2025-12-22', amount: '10,900원 구매' },
  { id: 2, date: '2025-12-22', amount: '10,900원 구매' },
  { id: 3, date: '2025-12-22', amount: '10,900원 구매' },
  { id: 4, date: '2025-12-22', amount: '10,900원 구매' },
  { id: 5, date: '2025-12-22', amount: '10,900원 구매' },
];

const ReceiptScreen = ({ navigation }) => {
  const [period, setPeriod] = useState('이번 달');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const PERIOD_OPTIONS = ['이번 달', '1개월 전', '2개월 전'];

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('ReceiptDetail')}>
        <Text style={styles.viewButtonText}>영수증 보기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      {/* Header 그대로 */}
      <Header
        navigation={navigation}
        title=""
        rightComponent={
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{period}</Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPeriod(option);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
      />

      {/* ⭐ 전자영수증 제목 (터치 방해 제거) */}
      <Text style={styles.customTitle} pointerEvents="none">
        전자영수증
      </Text>

      {/* 리스트 */}
      <FlatList
        contentContainerStyle={{ paddingTop: 26 }}
        data={DUMMY_RECEIPTS}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* 이 화면 전용 제목 */
  customTitle: {
    marginTop: -48,        // ↑↓ 위치 조절
    marginLeft: 150,       // ←→ 위치 조절
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },

  /* 리스트 아이템 */
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  amount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },

  /* 영수증 보기 버튼 */
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#666666',
  },
  viewButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#E6E6E6',
  },

  /* 드롭다운 */
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,        // ⭐ 터치 우선순위 확보
  },
  dropdownButton: {
    marginTop: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333333',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,           // ⭐ 버튼 하단
    right: 0,
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 20,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#333333',
  },
});

export default ReceiptScreen;
