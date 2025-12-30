import { Platform } from 'react-native';

// 로컬 개발 환경 (안드로이드 에뮬레이터는 10.0.2.2 필요)
const LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

// 현재 원격 서버(3.37.14.89) 대신 로컬 서버를 바라보도록 설정합니다.
// 원격 서버 설정과 로컬 코드의 리디렉션 URI가 일치하지 않아 로그인이 실패할 수 있습니다.
export const API_BASE_URL = LOCAL_URL;
// export const API_BASE_URL = 'http://3.37.14.89:8000';