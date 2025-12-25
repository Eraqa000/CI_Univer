import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { supabase } from "../db/supabase";

const router = Router();


router.get("/", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    id: req.user?.id,
    email: req.user?.email,
  });
});

/**
 * GET /me/roles
 */
router.get("/roles", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error) {
    console.error("ROLES ERROR:", error);
    return res.status(500).json({ error: "Failed to load roles" });
  }

  const roles = (data ?? [])
    .map((r: any) => r.roles?.name)
    .filter(Boolean);

  return res.json({
    roles,
    isStudent: roles.includes("student"),
    isTeacher: roles.includes("teacher"),
    isDean: roles.includes("dean"),
    isAdmin: roles.includes("admin"),
    isDeveloper: roles.includes("developer"),
  });
});

router.get("/grades", authMiddleware, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("v_student_grades") // Используем View!
    .select("*")
    .eq("student_id", req.user?.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


router.get("/schedule", authMiddleware, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("v_full_schedule") // Используем нашу SQL View
    .select("*")
    .eq("student_id", req.user?.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
