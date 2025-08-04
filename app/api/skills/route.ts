import { NextResponse } from "next/server"

export async function GET() {
  try {
    let skillsData: string[] = []
    let frameworksData: string[] = []

    // Fetch skills from the TrainPI backend
    const responseSkills = await fetch("https://trainbackend-production.up.railway.app/api/skills", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (responseSkills.ok) {
      const data = await responseSkills.json()
      // Assuming /api/skills returns an array directly, or an object with a 'skills' key
      skillsData = Array.isArray(data) ? data : data.skills || []
    } else {
      console.warn("Backend /api/skills not available or returned an error. Using fallback skills.")
    }

    // Fetch frameworks from the TrainPI backend (used as suggested skills/interests)
    const responseFrameworks = await fetch("https://trainbackend-production.up.railway.app/api/frameworks")

    if (responseFrameworks.ok) {
      const data = await responseFrameworks.json()
      // Assuming /api/frameworks returns an array directly
      frameworksData = Array.isArray(data) ? data : []
    } else {
      console.warn("Backend /api/frameworks not available or returned an error. Using fallback frameworks.")
    }

    // Combine skills and frameworks, ensuring uniqueness
    const combinedSkills = Array.from(new Set([...skillsData, ...frameworksData]))

    // Fallback skills if both backend calls fail or return empty
    const fallbackSkills = [
      "JavaScript",
      "Python",
      "React",
      "Node.js",
      "TypeScript",
      "HTML",
      "CSS",
      "Java",
      "C++",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "Git",
      "Linux",
      "Machine Learning",
      "Data Analysis",
      "UI/UX Design",
      "Project Management",
      "Agile",
      "Scrum",
      "DevOps",
    ]

    return NextResponse.json({
      skills: combinedSkills.length > 0 ? combinedSkills : fallbackSkills,
    })
  } catch (error) {
    console.error("Error fetching skills:", error)

    // Return fallback skills on any error
    const fallbackSkills = [
      "JavaScript",
      "Python",
      "React",
      "Node.js",
      "TypeScript",
      "HTML",
      "CSS",
      "Java",
      "C++",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "Git",
      "Linux",
      "Machine Learning",
      "Data Analysis",
      "UI/UX Design",
      "Project Management",
      "Agile",
      "Scrum",
      "DevOps",
    ]

    return NextResponse.json({ skills: fallbackSkills }, { status: 500 })
  }
}
