// routes/admin.ts
import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { supabase } from "../db/supabase";

const router = Router();

// Получение списка пользователей (админ)
router.get("/users", authMiddleware, async (req: AuthRequest, res) => {
  // Проверка роли: админ
  if (!req.user?.id || req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // Получаем всех пользователей
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Обновление роли пользователя
router.put("/users/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user?.id || req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const userId = req.params.id;
  const { role } = req.body; // Новая роль пользователя

  if (!role || !["student", "instructor", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // Обновляем роль
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;
