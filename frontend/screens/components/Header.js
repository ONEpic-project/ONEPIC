import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const Header = ({ 
  navigation, 
  title, 
  showBackButton = true,
  rightComponent = null,
  onBackPress = null 
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      {/* 뒤로가기 버튼 */}
      {showBackButton ? (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      {/* 제목 */}
      <Text style={styles.headerTitle}>{title}</Text>

      {/* 오른쪽 컴포넌트 (PeriodDropdown 등) */}
      {rightComponent ? (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.07,
    paddingBottom: height * 0.02,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: width * 0.1,
    height: width * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: width * 0.06,
    color: '#676767',
    marginTop: height * 0.02,
    marginLeft: -width * 0.03,
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginTop: height * 0.02,
  },
  headerSpacer: {
    width: width * 0.1,
  },
  rightContainer: {
    width: width * 0.25,
    alignItems: 'flex-end',
  },
});

export default Header;