export const DEFAULT_TOPICS = [
  { id: "ai", name: "AI & Machine Learning", description: "Artificial intelligence, ML models, research" },
  { id: "tech", name: "Technology", description: "Software, hardware, startups, engineering" },
  { id: "science", name: "Science", description: "Research, discoveries, physics, biology" },
  { id: "finance", name: "Finance", description: "Markets, investing, economics, crypto" },
  { id: "health", name: "Health", description: "Medicine, fitness, mental health, nutrition" },
  { id: "climate", name: "Climate", description: "Environment, sustainability, energy" },
  { id: "gaming", name: "Gaming", description: "Games, esports, game development" },
  { id: "design", name: "Design", description: "UI/UX, product design, visual arts" },
  { id: "sport", name: "Sports", description: "Cricket, football, athletics, news" },
  { id: "politics", name: "Politics", description: "Policy, governance, global affairs" },
]

export function getTopicById(id: string) {
  return DEFAULT_TOPICS.find(t => t.id === id)
}

export function getTopicName(id: string) {
  return DEFAULT_TOPICS.find(t => t.id === id)?.name ?? id
}
