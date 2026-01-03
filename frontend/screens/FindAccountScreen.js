// FindAccountScreen.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import AppText from "../components/AppText";
import { fontSizes } from '../config/typography';

import * as Clipboard from "expo-clipboard";
import { API_BASE_URL } from "../config/api";
import Header from "./components/Header";

const { width, height } = Dimensions.get("window");

const FindAccountScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("id");

  // 아이디 찾기
  const [idName, setIdName] = useState("");
  const [idPhone, setIdPhone] = useState("");
  const [foundId, setFoundId] = useState("");
  const [idError, setIdError] = useState(""); // 에러 메시지 추가

  // 비밀번호 찾기
  const [pwId, setPwId] = useState("");
  const [pwPhone, setPwPhone] = useState("");
  const [foundPassword, setFoundPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState(""); // 에러 메시지 추가

  // ================== 아이디 찾기 ==================
  const handleFindId = async () => {
    setIdError(""); // 초기화
    if (!idName.trim() || !idPhone.trim()) {
      setIdError("성명과 연락처를 모두 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/find-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: idName,
          phone: idPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIdError(data.detail || "일치하는 정보가 없습니다.");
        setFoundId("");
        return;
      }

      setFoundId(data.login_id);
    } catch (error) {
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };

  // ================== 비밀번호 찾기 ==================
  const handleFindPassword = async () => {
    setPwError(""); // 초기화
    if (!pwId.trim() || !pwPhone.trim()) {
      setPwError("아이디와 연락처를 모두 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/find-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login_id: pwId,
          phone: pwPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("알림", data.detail);
        setFoundPassword("");
        setPwMessage("");
        return;
      }

      setFoundPassword(data.temp_password);
      setPwMessage(data.message);
    } catch (error) {
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };

  // 클립보드에 비밀번호 복사
  const copyPassword = async () => {
    if (!foundPassword) return;

    await Clipboard.setStringAsync(foundPassword);
    Alert.alert("복사 완료", "임시 비밀번호가 클립보드에 복사되었습니다.");
  };

  const goToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <>
      <Header navigation={navigation} title="아이디/비밀번호 찾기" />

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* 탭 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "id" && styles.activeTab]}
              onPress={() => {
                setActiveTab("id");
                setFoundId("");
              }}
            >
              <AppText
                style={[
                  styles.tabText,
                  activeTab === "id" && styles.activeTabText,
                ]}
              >
                아이디 찾기
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "password" && styles.activeTab]}
              onPress={() => {
                setActiveTab("password");
                setFoundPassword("");
                setPwMessage("");
              }}
            >
              <AppText
                style={[
                  styles.tabText,
                  activeTab === "password" && styles.activeTabText,
                ]}
              >
                비밀번호 찾기
              </AppText>
            </TouchableOpacity>
          </View>

          {/* ================== 아이디 찾기 ================== */}
          {activeTab === "id" ? (
            <>
            <View style={styles.formContainer}>
              <TextInput
                style={[styles.input, idError ? styles.inputError : null]}
                placeholder="성명"
                value={idName}
                onChangeText={(t) => { setIdName(t); setIdError(""); }}
              />
              <TextInput
                style={[styles.input, idError ? styles.inputError : null]}
                placeholder="연락처 (- 제외)"
                value={idPhone}
                onChangeText={(t) => { setIdPhone(t); setIdError(""); }}
                keyboardType="phone-pad"
              />

              {/* 에러 메시지 표시 */}
              {idError ? <AppText style={styles.errorText}>{idError}</AppText> : null}

              {foundId && (
                <View style={styles.resultContainer}>
                  <AppText style={styles.resultText}>아이디 : {foundId}</AppText>
                </View>
              )}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleFindId}
              >
                <AppText style={styles.searchButtonText}>검색</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={goToLogin}
              >
                <AppText style={styles.loginButtonText}>로그인 하기</AppText>
              </TouchableOpacity>
            </View>
            </>
          ) : (
            /* ================== 비밀번호 찾기 ================== */
            <>
            <View style={styles.formContainer}>
              <TextInput
                style={[styles.input, pwError ? styles.inputError : null]}
                placeholder="아이디"
                value={pwId}
                onChangeText={(t) => { setPwId(t); setPwError(""); }}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, pwError ? styles.inputError : null]}
                placeholder="연락처 (- 제외)"
                value={pwPhone}
                onChangeText={(t) => { setPwPhone(t); setPwError(""); }}
                keyboardType="phone-pad"
              />

              {/* 에러 메시지 표시 */}
              {pwError ? <AppText style={styles.errorText}>{pwError}</AppText> : null}

              {foundPassword && (
                <View style={styles.resultContainer}>
                  <TouchableOpacity onPress={copyPassword}>
                    <AppText style={styles.resultText}>
                      임시 비밀번호 :{" "}
                      <AppText style={{ textDecorationLine: "underline" }}>
                        {foundPassword}
                      </AppText>
                    </AppText>
                  </TouchableOpacity>

                  <AppText style={styles.noticeText}>
                    터치하면 비밀번호가 복사됩니다.
                    {"\n"}
                    로그인 후 반드시 비밀번호를 변경해주세요.
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleFindPassword}
              >
                <AppText style={styles.searchButtonText}>검색</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={goToLogin}
              >
                <AppText style={styles.loginButtonText}>로그인 하기</AppText>
              </TouchableOpacity>
            </View>
            </>
          )}
        </View>
      </ScrollView>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: width * 0.1,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
    minHeight: height * 0.8,  // 추가: 최소 높이 보장
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: height * 0.06,
    borderRadius: height * 0.03,
    borderWidth: 1,
    borderColor: "#FF9500",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: height * 0.015,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: height * 0.04,
  },
  activeTab: {
    backgroundColor: "#FF9500",
  },
  tabText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#FF9500",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    width: "100%",
    height: height * 0.06,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    fontSize: fontSizes.md,
    color: "#333",
    marginBottom: height * 0.035,
    paddingVertical: 10,
  },
  // 에러 텍스트 스타일
  errorText: {
    width: '80%',
    alignSelf: 'center',
    color: '#FF3B30', // iOS 시스템 레드 컬러 느낌
    fontSize: fontSizes.sm,
    marginBottom: height * 0.01,
    paddingLeft: 5,
  },
  // 선택 사항: 에러 시 밑줄 색상 변경
  inputError: {
    borderBottomColor: '#FF3B30',
  },

  resultContainer: {
    alignItems: "center",
    marginVertical: height * 0.05,
    minHeight: height * 0.03,
  },
  resultText: {
    fontSize: fontSizes.lg,
    color: "#FF9500",
    fontWeight: "500",
    textAlign: "center",
  },
  noticeText: {
    marginTop: 10,
    fontSize: fontSizes.sm,
    color: "#999",
    textAlign: "center",
  },
  buttonContainer: {
    position: 'absolute',
    bottom: height * 0,  // 바닥에서 5% 떨어진 위치
    width: '100%',
    alignSelf: 'center',
  },
  searchButton: {
    width: "100%",
    height: height * 0.06,
    backgroundColor: "#FF9500",
    borderRadius: height * 0.03,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  searchButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loginButton: {
    width: "100%",
    height: height * 0.06,
    backgroundColor: "#FFFFFF",
    borderRadius: height * 0.03,
    borderWidth: 1,
    borderColor: "#FF9500",
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#FF9500",
  },
  noticeText: {
    marginTop: 10,
    fontSize: fontSizes.sm,
    color: "#999",
    textAlign: "center",
  },
});

export default FindAccountScreen;
