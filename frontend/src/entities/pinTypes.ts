export type Pin = {
  id: string
  imageUrl: string
  width: number
  height: number
  liked: boolean
  likesCount: number
}

export type LandingImageResponse = {
  url: string
}

export type FeedResponse = {
  data: LandingImageResponse[]
  message: string
}
