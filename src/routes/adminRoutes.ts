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
    // Поддерживаем фильтр по роли и поиск по имени/reg_no
    const role = String(req.query.role || "").trim();
    const q = String(req.query.q || "").trim();

    let builder = supabase
      .from("profiles")
      .select("id, full_name, email, role, reg_no, created_at")
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      builder = builder.eq("role", role);
    }

    if (q) {
      // ищем по full_name или reg_no (case-insensitive)
      // используем OR с ilike
      builder = builder.or(`full_name.ilike.%${q}% , reg_no.ilike.%${q}%`);
    }

    const { data, error } = await builder;

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
