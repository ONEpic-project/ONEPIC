import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

export default function Home({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ONEPIC</Text>
        <Text style={styles.subtitle}>AI 기반 상품 스캐너</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.scanButtonIcon}>📷</Text>
          <Text style={styles.scanButtonText}>상품 스캔하기</Text>
        </TouchableOpacity>

                <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.paymentButtonIcon}>💳</Text>
          <Text style={styles.paymentButtonText}>결제하기</Text>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>정확한 인식</Text>
            <Text style={styles.featureDescription}>
              AI가 상품을 정확하게 인식합니다
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>빠른 처리</Text>
            <Text style={styles.featureDescription}>
              실시간으로 상품 정보를 제공합니다
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛒</Text>
            <Text style={styles.featureTitle}>간편한 쇼핑</Text>
            <Text style={styles.featureDescription}>
              스캔 후 바로 장바구니에 추가하세요
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  paymentButton: {
    backgroundColor: '#34C759',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentButtonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  featuresContainer: {
    flex: 1,
  },
  featureItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});