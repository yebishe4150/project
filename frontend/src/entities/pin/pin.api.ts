export const fetchPins = async () => {
  return {
    items: Array.from({ length: 20 }).map((_, i) => ({
      id: String(i),
      imageUrl: `https://picsum.photos/300/${300 + i * 10}`,
      width: 300,
      height: 300 + i * 10,
      liked: false,
      likesCount: Math.floor(Math.random() * 100),
    })),
    nextCursor: null,
    hasNext: false,
  }
}