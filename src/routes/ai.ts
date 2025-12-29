import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { askAI } from "../ai/ai.service";
import { supabase } from "../db/supabase";
import { buildUserContext } from "../ai/buildUserContext";

const router = Router();

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // Получаем роли пользователя
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user!.id);

    if (rolesError) throw rolesError;

    const roles = rolesData?.map((r: any) => r.roles?.name).filter(Boolean) ?? ["student"];

    // Собираем контекст (курсы, оценки и т.д.)
    const context = await buildUserContext(user!.id, roles);

    // Отправляем в AI
    const answer = await askAI({
      roles,
      context,
      userMessage: message,
    });

    res.json({ answer });
  } catch (e) {
    console.error("AI ROUTE ERROR:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;