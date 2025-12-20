import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  // 1. Логинимся через Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const user = data.user;

  // 2. Генерируем JWT
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  // 3. Отдаём клиенту
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

export default router;
