// src/ai/ai.service.ts
import Groq from "groq-sdk"
import { getPromptForRoles } from "./rolePrompts"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

type AskAIParams = {
  roles: string[]
  context: string
  userMessage: string
}

export async function askAI({
  roles,
  context,
  userMessage,
}: AskAIParams): Promise<string> {
  // 🎭 роль-специфичный prompt
  const rolePrompt = getPromptForRoles(roles)

  const systemPrompt = `
Ты — AI-ассистент университета.

${rolePrompt}

Контекст пользователя:
${context}

Правила:
- Используй ТОЛЬКО предоставленные данные
- Не придумывай факты
- Если данных нет — скажи об этом
- Отвечай кратко и по делу
  `.trim()

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // ✅ актуальная модель Groq
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.4,
    max_tokens: 500,
  })

  return (
    completion.choices[0]?.message?.content ??
    "Извини, я не смог сформировать ответ."
  )
}
