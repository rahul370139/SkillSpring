import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://trainbackend-production.up.railway.app/api/career/smart/initial-suggestions")

    if (!response.ok) {
      // Fallback interests if backend is unavailable
      const fallbackInterests = [
        "Technology",
        "Design",
        "Data Science",
        "Business",
        "AI/ML",
        "Cloud Computing",
        "Cybersecurity",
        "Marketing",
        "Finance",
        "Healthcare",
      ]
      return NextResponse.json({ interests: fallbackInterests, source: "fallback" })
    }

    const data = await response.json()
    // Assuming the initial-suggestions endpoint returns an object with an 'interests' array
    const interests = data.interests || []
    return NextResponse.json({ interests })
  } catch (error) {
    console.error("Error fetching interests:", error)
    const fallbackInterests = [
      "Technology",
      "Design",
      "Data Science",
      "Business",
      "AI/ML",
      "Cloud Computing",
      "Cybersecurity",
      "Marketing",
      "Finance",
      "Healthcare",
    ]
    return NextResponse.json({ interests: fallbackInterests }, { status: 500 })
  }
}
