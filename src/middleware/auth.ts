import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase"; // Импорт подключения к базе данных

// Тип запроса с добавленным пользователем
export type AuthRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role?: string;  // Добавляем роль в тип
  };
};

// Middleware для проверки авторизации
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Проверка, что заголовок авторизации присутствует
  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing",
    });
  }

  // Извлечение токена из заголовка
  const [type, token] = authHeader.split(" ");

  // Проверка формата авторизации
  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Invalid authorization format",
    });
  }

  try {
    // Проверка и декодирование JWT токена
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as jwt.JwtPayload;

    // Записываем данные пользователя в запрос
    req.user = {
      id: payload.sub as string,
      email: payload.email as string | undefined,
    };

    // Извлекаем роль из базы данных
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single(); // Получаем одну запись (профиль пользователя)

    if (error || !data) {
      console.error('Supabase role fetch error:', { error, data, userId: req.user.id });
      const detail = (error && (error.message || JSON.stringify(error))) || (data ? JSON.stringify(data) : null);
      return res.status(500).json({
        error: "Failed to fetch user role",
        detail,
      });
    }

    // Добавляем роль в объект пользователя
    req.user.role = data.role;

    // Переходим к следующему middleware или маршруту
    next();
  } catch (err: any) {
    // Если ошибка в токене (недействительный или истекший)
    try {
      const tokenPreview = token ? `${token.slice(0,8)}...${token.slice(-8)}` : null;
      console.error('JWT verify error:', { message: err?.message, tokenPreview });
    } catch (e) {
      console.error('JWT verify error (failed to build preview):', err);
    }

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
