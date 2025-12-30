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
    // map frontend role names to DB enum values
    const mapRoleToDb = (r: string) => (r === "teacher" ? "instructor" : r);
    const q = String(req.query.q || "").trim();

    let builder = supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      const dbRole = mapRoleToDb(role);
      builder = builder.eq("role", dbRole);
    }

    if (q) {
      // ищем по full_name (case-insensitive)
      builder = builder.ilike("full_name", `%${q}%`);
    }

    const { data, error } = await builder;

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    console.error('admin /users error:', error);
    return res.status(500).json({ error: "Failed to fetch users", detail: (error as any)?.message || String(error) });
  }
});

// Обновление роли пользователя
router.put("/users/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user?.id || req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const userId = req.params.id;
  const { role } = req.body; // Новая роль пользователя

  const allowed = ["student", "instructor", "admin", "teacher"];
  if (!role || !allowed.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // map to DB enum value
  const dbRole = role === "teacher" ? "instructor" : role;
  try {
    // Обновляем роль
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: dbRole })
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
