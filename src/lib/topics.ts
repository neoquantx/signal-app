export interface Topic {
  id: string
  name: string
  category: string
  searchQuery: string
}

export const TOPIC_CATEGORIES = [
  "Technology",
  "Science",
  "Business",
  "Culture & Entertainment",
  "Lifestyle",
  "Society",
  "Sports",
  "Creative",
]

export const DEFAULT_TOPICS: Topic[] = [
  { id: "ai", name: "AI & Machine Learning", category: "Technology", searchQuery: "artificial intelligence" },
  { id: "software-eng", name: "Software Engineering", category: "Technology", searchQuery: "software engineering" },
  { id: "cybersecurity", name: "Cybersecurity", category: "Technology", searchQuery: "cybersecurity" },
  { id: "web3", name: "Web3 & Crypto", category: "Technology", searchQuery: "crypto" },
  { id: "gadgets", name: "Gadgets & Hardware", category: "Technology", searchQuery: "new gadget" },
  { id: "robotics", name: "Robotics", category: "Technology", searchQuery: "robotics" },

  { id: "space", name: "Space & Astronomy", category: "Science", searchQuery: "space exploration" },
  { id: "climate", name: "Climate & Environment", category: "Science", searchQuery: "climate change" },
  { id: "biology", name: "Biology & Medicine", category: "Science", searchQuery: "medical research" },
  { id: "physics", name: "Physics", category: "Science", searchQuery: "physics" },
  { id: "psychology", name: "Psychology", category: "Science", searchQuery: "psychology" },

  { id: "startups", name: "Startups", category: "Business", searchQuery: "startup" },
  { id: "investing", name: "Investing & Markets", category: "Business", searchQuery: "stock market" },
  { id: "economics", name: "Economics", category: "Business", searchQuery: "economy" },
  { id: "marketing", name: "Marketing", category: "Business", searchQuery: "marketing" },
  { id: "real-estate", name: "Real Estate", category: "Business", searchQuery: "real estate" },

  { id: "movies-tv", name: "Movies & TV", category: "Culture & Entertainment", searchQuery: "new movie" },
  { id: "music", name: "Music", category: "Culture & Entertainment", searchQuery: "new album" },
  { id: "books", name: "Books & Literature", category: "Culture & Entertainment", searchQuery: "book recommendation" },
  { id: "gaming", name: "Gaming", category: "Culture & Entertainment", searchQuery: "video game" },
  { id: "anime", name: "Anime & Comics", category: "Culture & Entertainment", searchQuery: "anime" },
  { id: "celebrity", name: "Celebrity News", category: "Culture & Entertainment", searchQuery: "celebrity" },

  { id: "fitness", name: "Fitness & Health", category: "Lifestyle", searchQuery: "fitness" },
  { id: "food", name: "Food & Cooking", category: "Lifestyle", searchQuery: "recipe" },
  { id: "travel", name: "Travel", category: "Lifestyle", searchQuery: "travel" },
  { id: "fashion", name: "Fashion & Style", category: "Lifestyle", searchQuery: "fashion" },
  { id: "photography", name: "Photography", category: "Lifestyle", searchQuery: "photography" },
  { id: "parenting", name: "Parenting", category: "Lifestyle", searchQuery: "parenting" },

  { id: "politics", name: "Politics", category: "Society", searchQuery: "politics" },
  { id: "education", name: "Education", category: "Society", searchQuery: "education" },
  { id: "mental-health", name: "Mental Health", category: "Society", searchQuery: "mental health" },
  { id: "social-justice", name: "Social Justice", category: "Society", searchQuery: "social justice" },

  { id: "football", name: "Football (Soccer)", category: "Sports", searchQuery: "football" },
  { id: "basketball", name: "Basketball", category: "Sports", searchQuery: "basketball" },
  { id: "cricket", name: "Cricket", category: "Sports", searchQuery: "cricket" },
  { id: "f1", name: "Formula 1", category: "Sports", searchQuery: "formula 1" },
  { id: "olympics", name: "Olympics & Athletics", category: "Sports", searchQuery: "athletics" },

  { id: "art", name: "Art & Illustration", category: "Creative", searchQuery: "digital art" },
  { id: "design", name: "Design (UI/UX)", category: "Creative", searchQuery: "ui design" },
  { id: "writing", name: "Writing & Poetry", category: "Creative", searchQuery: "poetry" },
  { id: "filmmaking", name: "Film & Video Production", category: "Creative", searchQuery: "filmmaking" },
]

export function getTopicById(id: string) {
  return DEFAULT_TOPICS.find(t => t.id === id)
}

export function getTopicName(id: string) {
  return DEFAULT_TOPICS.find(t => t.id === id)?.name ?? id
}

export function getTopicsByCategory() {
  const grouped: Record<string, Topic[]> = {}
  for (const cat of TOPIC_CATEGORIES) {
    grouped[cat] = DEFAULT_TOPICS.filter(t => t.category === cat)
  }
  return grouped
}
