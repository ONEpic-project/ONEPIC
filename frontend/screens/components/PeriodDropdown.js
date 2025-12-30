import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions
} from 'react-native';
import AppText from '../../components/AppText';

const { width, height } = Dimensions.get('window');

const PeriodDropdown = ({ selectedPeriod, onPeriodChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const periods = [
    { label: '이번 달', value: 'current' },
    { label: '1개월 전', value: 'month1' },
    { label: '2개월 전', value: 'month2' },
  ];

  const handleButtonPress = () => {
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setDropdownPosition({
        top: py + height + 5,
        right: 20,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (period) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  const getSelectedLabel = () => {
    return periods.find(p => p.value === selectedPeriod)?.label || '이번 달';
  };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={styles.dropdownButton}
        onPress={handleButtonPress}
        activeOpacity={0.8}
      >
        
        <AppText style={styles.selectedPeriod}>
          {getSelectedLabel()} {isOpen ? '▲' : '▼'}
        </AppText>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setIsOpen(false)}
        >
          <View 
            style={[
              styles.dropdownMenu,
              {
                position: 'absolute',
                top: dropdownPosition.top,
                right: dropdownPosition.right,
                //width: width * 0.25, 이거아님
              }
            ]}
          >
            {periods.map((period, index) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.menuItem,
                  index !== periods.length - 1 && styles.menuItemBorder,
                  period.value === selectedPeriod && styles.selectedMenuItem
                ]}
                onPress={() => handleSelect(period.value)}
                activeOpacity={0.7}
              >
                <AppText 
                  style={[
                    styles.menuItemText,
                    period.value === selectedPeriod && styles.selectedMenuItemText
                  ]}
                >
                  {period.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
  },
  selectedPeriod: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B4B4B',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedMenuItem: {
    backgroundColor: '#FFF5F0',
  },
  selectedMenuItemText: {
    color: '#FF9317',
    fontWeight: '700',
  },
});

export default PeriodDropdown;