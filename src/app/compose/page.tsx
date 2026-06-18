import { redirect } from "next/navigation"

// Composing now happens in a floating modal launched from the sidebar "Post" button.
export default function ComposePage() {
  redirect("/feed")
}
