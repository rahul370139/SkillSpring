import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { lesson_id, user_id, file_name, framework, explanation_level } = await req.json()

  if (!lesson_id || !user_id || !file_name) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("user_lessons")
      .insert([
        {
          lesson_id,
          user_id,
          file_name,
          framework,
          explanation_level,
        },
      ])
      .select()

    if (error) {
      console.error("Error saving lesson:", error)
      return NextResponse.json({ message: "Failed to save lesson", error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Lesson saved successfully", data }, { status: 200 })
  } catch (err: any) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ message: "An unexpected error occurred", error: err.message }, { status: 500 })
  }
}
