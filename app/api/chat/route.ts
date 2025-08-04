import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages, lessonId, explanationLevel, userId, conversationId, uploadedFiles } = await req.json()

    // You can use lessonId, explanationLevel, userId, conversationId, and uploadedFiles
    // to provide context to your AI model.
    // For example, fetch lesson content based on lessonId, or user preferences.

    const systemPrompt = `You are a helpful AI assistant for TrainPI, a microlearning platform.
    Your responses should be tailored to a ${explanationLevel} level.
    ${
      lessonId
        ? `You are currently discussing content related to lesson ID: ${lessonId}.`
        : uploadedFiles && uploadedFiles.length > 0
          ? `You are currently discussing content from the following files: ${uploadedFiles.map((f: any) => f.name).join(", ")}.`
          : ""
    }
    Provide concise and accurate answers. If you don't know, say so.`

    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
    })

    return result.to
  } catch (error) {
    console.error("Error in /api/chat:", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
