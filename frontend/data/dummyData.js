// 상품 더미 데이터
export const sampleProducts = [
  {
    id: 1,
    name: '오리온 초코송이',
    price: 1380,
    image: require('../assets/products/product1.png'),
    barcode: '8801234567890',
  },
  {
    id: 2,
    name: '오리온 예감 오리지널',
    price: 2080,
    image: require('../assets/products/product2.png'),
    barcode: '8801234567891',
  },
  // 추가 상품...
];

// 장바구니 더미 데이터
export const cartItems = [
  {
    id: 1,
    productId: 1,
    name: '오리온 초코송이',
    price: 1380,
    quantity: 2,
    image: require('../assets/products/product1.png'),
  },
];

// 영수증 더미 데이터
export const receipts = [
  {
    id: 1,
    storeName: '원픽마트 동대구점',
    date: '2025-12-22',
    totalAmount: 10500,
    items: [
      { name: '오리온 초코송이', quantity: 1, price: 1380 },
      { name: '오리온 예감', quantity: 1, price: 2080 },
    ],
  },
];