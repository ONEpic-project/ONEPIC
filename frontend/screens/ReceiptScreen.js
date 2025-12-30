import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AppText from '../components/AppText';
import { fontSizes } from '../config/typography';

import Header from './components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

/**
 * 임시 영수증 리스트 (UI 확인용)
 * ❌ 네트워크 / DB / user 무시
 */
const ReceiptScreen = ({ navigation }) => {
  const [period, setPeriod] = useState('이번 달');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 화면 포커스 될 때마다 리스트 갱신
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReceipts(PERIOD_MAP[period]);
    });
    return unsubscribe;
  }, [navigation]);

  const fetchReceipts = async (monthsAgo = null) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      // GET /api/receipts/me 호출
      const response = await axios.get(`${API_BASE_URL}/api/receipts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allReceipts = response.data || [];

      // monthsAgo가 null이면 전체, 숫자(0,1,2...)이면 해당 월만 필터
      if (monthsAgo === null || typeof monthsAgo !== 'number') {
        setReceipts(allReceipts);
      } else {
        // 대상 월의 시작/종료 UTC 범위를 계산
        const now = new Date();
        let targetMonth = now.getMonth() - monthsAgo; // 0-11
        let targetYear = now.getFullYear();
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        const start = Date.UTC(targetYear, targetMonth, 1, 0, 0, 0);
        const endMonth = targetMonth + 1;
        const endYear = targetYear + (endMonth > 11 ? 1 : 0);
        const end = Date.UTC(endYear, endMonth % 12, 1, 0, 0, 0);

        const filtered = allReceipts.filter((item) => {
          if (!item.created_at) return false;
          const created = new Date(item.created_at).getTime();
          return created >= start && created < end;
        });

        setReceipts(filtered);
      }
    } catch (error) {
      console.error('영수증 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const PERIOD_OPTIONS = ['이번 달', '1개월 전', '2개월 전'];
  const PERIOD_MAP = {
    '이번 달': 0,
    '1개월 전': 1,
    '2개월 전': 2,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // YYYY-MM-DD 만 표시
    return dateString.split('T')[0];
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <AppText style={styles.date}>{formatDate(item.created_at)}</AppText>
        <AppText style={styles.amount}>
          {item.total_amount?.toLocaleString()}원 구매
        </AppText>
      </View>

      <TouchableOpacity 
        style={styles.viewButton} 
        onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.receipt_id })}
      >
        <AppText style={styles.viewButtonText}>영수증 보기</AppText>
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
              <AppText style={styles.dropdownText}>{period}</AppText>
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
                      // 선택 즉시 해당 월로 필터
                      fetchReceipts(PERIOD_MAP[option]);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.dropdownItemText}>{option}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
      />

      {/* ⭐ 전자영수증 제목 (터치 방해 제거) */}
      <AppText style={styles.customTitle} pointerEvents="none">
        전자영수증
      </AppText>

      {/* 리스트 */}
      <FlatList
        contentContainerStyle={{ paddingTop: 26 }}
        data={receipts}
        keyExtractor={(item) => String(item.receipt_id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        refreshing={loading}
        onRefresh={fetchReceipts}
        ListEmptyComponent={
          !loading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <AppText style={{ color: '#999' }}>영수증 내역이 없습니다.</AppText>
            </View>
          )
        }
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
    fontSize: fontSizes.lg,
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
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  amount: {
    fontSize: fontSizes.sm,
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
    fontSize: fontSizes.sm,
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
    fontSize: fontSizes.sm,
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
    fontSize: fontSizes.sm,
    color: '#333333',
  },
});

export default ReceiptScreen;
