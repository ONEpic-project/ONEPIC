# 테스트 이미지 폴더

## 사용법
이 폴더에 테스트할 상품 이미지를 넣어주세요.

## 폴더 구조 (선택사항)
```
test_images/
├── class_0/
│   ├── image1.jpg
│   └── image2.jpg
├── class_1/
│   ├── image1.jpg
│   └── image2.jpg
...
```

또는 단순히 이미지를 직접 넣고 `labels.json`으로 라벨 관리:
```json
{
  "image1.jpg": 0,
  "image2.jpg": 1,
  ...
}
```
