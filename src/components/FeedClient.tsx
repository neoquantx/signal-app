"use client"
import { useEffect, useState } from "react"
import PostCard from "./PostCard"
import { Post } from "@/types"

export default function FeedClient({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"foryou" | "following">("foryou")

  useEffect(() => {
    fetch("/api/users/sync", { method: "POST" }).catch(() => {})
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      {/* Heading */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Your feed</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Ranked by trust · human-verified</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
        <button
          onClick={() => setTab("foryou")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            tab === "foryou" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          For you
        </button>
        <button
          onClick={() => setTab("following")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            tab === "following" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Following
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex animate-pulse gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3 w-1/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-12 w-full rounded-lg bg-muted/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to post something worth trusting.</p>
        </div>
      ) : tab === "following" ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">Nothing from your trust circle yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Trust people on topics in Explore to populate this tab.
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-signal-in">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
