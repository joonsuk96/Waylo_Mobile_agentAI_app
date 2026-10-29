export const destinations = [
  {
    id: "kyoto",
    name: "교토",
    country: "일본",
    english: "일본 · 교토",
    tag: "느리게 걷는 여행",
    image: require("../../assets/images/kyoto.jpg"),
    days: "3–4일",
    season: "봄 · 가을",
    description:
      "오래된 골목을 걷고, 작은 찻집에 잠시 머무르세요. 고즈넉한 사찰과 정원 사이에서 나만의 속도를 찾는 여행이에요.",
    spots: [
      "기요미즈데라와 산넨자카 산책",
      "아라시야마 대나무 숲",
      "니시키 시장에서 맛보는 교토",
    ],
    credit: "사진 출처: 언스플래시",
  },
  {
    id: "bali",
    name: "발리",
    country: "인도네시아",
    english: "인도네시아 · 발리",
    tag: "햇살 아래 쉼표",
    image: require("../../assets/images/bali-destination.jpg"),
    days: "5–7일",
    season: "건기 · 5–9월",
    description:
      "바다가 보이는 아침, 초록으로 가득한 오후. 여유로운 해변과 우붓의 자연을 함께 즐기는 휴식을 계획해 보세요.",
    spots: [
      "우붓의 논길과 로컬 카페",
      "울루와뚜의 노을",
      "스미냑 해변에서 쉬어가기",
    ],
    credit: "웨일로 제작 이미지",
  },
  {
    id: "santorini",
    name: "산토리니",
    country: "그리스",
    english: "그리스 · 산토리니",
    tag: "파란 지붕 너머로",
    image: require("../../assets/images/santorini.jpg"),
    days: "3–4일",
    season: "5–6월 · 9–10월",
    description:
      "하얀 마을과 에게해를 따라 걷는 하루. 이아의 노을부터 바닷가의 작은 식당까지, 기억에 남을 순간을 찾아보세요.",
    spots: [
      "이아 마을의 골목과 일몰",
      "피라에서 즐기는 칼데라 전망",
      "에게해를 바라보는 저녁 식사",
    ],
    credit: "사진 출처: 언스플래시",
  },
  {
    id: "grand-canyon",
    name: "그랜드 캐니언",
    country: "미국",
    english: "미국 · 애리조나",
    tag: "자연 앞에서, 잠시 멈춤",
    image: require("../../assets/images/grand-canyon-splash.png"),
    days: "2–3일",
    season: "봄 · 가을",
    description:
      "붉은 협곡을 물들이는 빛을 따라가 보세요. 사우스 림의 전망대와 산책로에서 일상과는 다른 크기의 풍경을 만날 수 있어요.",
    spots: [
      "매더 포인트에서 맞는 일출",
      "사우스 림 전망대 산책",
      "협곡 너머로 지는 노을",
    ],
    credit: "웨일로 제작 이미지",
  },
];
export type Destination = (typeof destinations)[number];
