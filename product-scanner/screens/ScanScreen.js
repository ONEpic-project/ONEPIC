import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// 백엔드 API URL (실제 환경에 맞게 수정 필요)
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000'  // Android 에뮬레이터
  : 'http://localhost:8000'; // iOS 시뮬레이터 또는 웹

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedImage, setDetectedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const cameraRef = useRef(null);

  // 사진 촬영 함수
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        // 백엔드로 이미지 전송
        await detectProduct(photo);
      } catch (error) {
        console.error('사진 촬영 오류:', error);
        Alert.alert('오류', '사진 촬영에 실패했습니다.');
        setIsLoading(false);
      }
    }
  };

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setIsLoading(true);
        await detectProduct(result.assets[0]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  // AI 상품 인식 함수
  const detectProduct = async (photo) => {
    try {
      // FormData 생성
      const formData = new FormData();
      
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'product.jpg',
      });

      // 백엔드 API 호출
      const apiResponse = await axios.post(
        `${API_BASE_URL}/api/ai/detect`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30초 타임아웃
        }
      );

      // 결과 처리
      if (apiResponse.data && apiResponse.data.result) {
        const result = apiResponse.data.result;
        
        // base64 이미지가 있으면 표시
        if (result.image_base64) {
          setDetectedImage(`data:image/png;base64,${result.image_base64}`);
        }
        
        setDetectionResult(result);
        
        // 성공 알림
        Alert.alert(
          '인식 완료',
          `상품이 성공적으로 인식되었습니다!\n신뢰도: ${result.confidence || 'N/A'}%`,
          [
            {
              text: '장바구니 추가',
              onPress: () => addToCart(result),
            },
            {
              text: '다시 촬영',
              onPress: () => resetCamera(),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('상품 인식 오류:', error);
      
      let errorMessage = '상품 인식에 실패했습니다.';
      if (error.response) {
        errorMessage += `\n상태 코드: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += '\n서버에 연결할 수 없습니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 장바구니 추가 함수 (추후 구현)
  const addToCart = (product) => {
    console.log('장바구니에 추가:', product);
    Alert.alert('알림', '장바구니 기능은 추후 구현 예정입니다.');
    resetCamera();
  };

  // 카메라 초기화
  const resetCamera = () => {
    setDetectedImage(null);
    setDetectionResult(null);
  };

  // 카메라 전환
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // 권한 확인
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>카메라 권한이 필요합니다.</Text>
        <Text style={styles.errorSubText}>
          앱을 사용하려면 카메라 권한을 허용해주세요.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 인식 결과 이미지가 있으면 표시 */}
      {detectedImage ? (
        <View style={styles.resultContainer}>
          <Image
            source={{ uri: detectedImage }}
            style={styles.resultImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetCamera}
          >
            <Text style={styles.resetButtonText}>다시 스캔하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* 카메라 프리뷰 */}
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              {/* 스캔 가이드 */}
              <View style={styles.scanGuide}>
                <View style={[styles.scanCorner, styles.topLeft]} />
                <View style={[styles.scanCorner, styles.topRight]} />
                <View style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={[styles.scanCorner, styles.bottomRight]} />
              </View>

              {/* 안내 텍스트 */}
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                  상품을 프레임 안에 위치시켜주세요
                </Text>
              </View>
            </View>
          </CameraView>

          {/* 하단 컨트롤 */}
          <View style={styles.controls}>
            {/* 갤러리 버튼 */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>📁</Text>
            </TouchableOpacity>

            {/* 촬영 버튼 */}
            <TouchableOpacity
              style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* 카메라 전환 버튼 */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && !detectedImage && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingOverlayText}>AI가 상품을 인식 중입니다...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  scanGuide: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: '40%',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4A90E2',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    backgroundColor: '#999',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultImage: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#4A90E2',
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#4A90E2',
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});










































