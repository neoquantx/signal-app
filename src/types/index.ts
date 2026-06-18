export interface User {
  id: string
  name: string
  email: string
  image?: string
  humanScore: number
  createdAt: string
  topicIds: string[]
}

export interface Topic {
  id: string
  name: string
  description: string
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorImage?: string
  content: string
  topicId: string
  topicName: string
  humanScore: number
  trustCount: number
  createdAt: string
}

export interface TrustRelationship {
  trusterId: string
  trusteeId: string
  trusteeName: string
  trusteeImage?: string
  topicId: string
  topicName: string
  createdAt: string
}

export interface TrustChainNode {
  userId: string
  userName: string
}

export interface FeedItem {
  post: Post
  trustChain: TrustChainNode[]
  trustWeight: number
  topicWeight: number
  recencyWeight: number
  totalScore: number
}

export interface AlgorithmPreferences {
  userId: string
  trustChainWeight: number
  topicRelevanceWeight: number
  recencyWeight: number
}

export interface FeedHealth {
  humanContentPercent: number
  topicDiversityPercent: number
  newVoicesPercent: number
  avgTrustDepth: number
  weekOf: string
}
