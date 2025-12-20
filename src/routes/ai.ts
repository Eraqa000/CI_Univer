// src/routes/ai.ts
import { Router } from "express"
import { authMiddleware, AuthRequest } from "../middleware/auth"
import { askAI } from "../ai/ai.service"
import { supabase } from "../db/supabase"
import { buildUserContext } from "../ai/buildUserContext"

const router = Router()

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  const user = req.user
  const { message } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required" })
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles:roles(name)")
    .eq("user_id", user!.id)

  if (error) {
    return res.status(500).json({ error: "Failed to load roles" })
  }

  const roles =
    data?.map((r: any) => r.roles?.name).filter(Boolean) ?? ["student"]

  const context = await buildUserContext(user!.id, roles)


  try {
    const answer = await askAI({
      roles,
      context,
      userMessage: message,
    })

    res.json({ answer })
  } catch (e) {
    console.error("AI ERROR:", e)
    res.status(500).json({ error: "AI error" })
  }
})


export default router
