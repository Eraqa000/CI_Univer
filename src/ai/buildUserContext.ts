import { supabase } from "../db/supabase";

export async function buildUserContext(
  userId: string,
  roles: string[]
): Promise<string> {
  const contextStrings: string[] = [];

  // 1. Профиль пользователя
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  contextStrings.push(`
Текущая дата: ${new Date().toLocaleDateString("ru-RU")}
Пользователь:
Имя: ${profile?.full_name ?? "Неизвестно"}
Email: ${profile?.email ?? "Неизвестно"}
Роль: ${roles.join(", ")}
`.trim());

  // 2. СТУДЕНТ: Запрос от таблицы оценок (самый надежный способ)
  if (roles.includes("student")) {
    const { data: gradesData, error } = await supabase
      .from("student_grades")
      .select(`
        rk1, 
        rk2, 
        final_exam,
        course_offering (
          courses (
            name,
            description
          )
        )
      `)
      .eq("student_id", userId); // Прямая и безопасная фильтрация

    if (error) console.error("Grades fetch error:", error);

    if (gradesData && gradesData.length > 0) {
      let block = `Успеваемость по курсам:\n`;
      
      for (const item of gradesData) {
        const offering: any = item.course_offering;
        const course = offering?.courses;

        if (course) {
          block += `- ${course.name}: РК1: ${item.rk1}, РК2: ${item.rk2}, Финал: ${item.final_exam}\n`;
        }
      }
      contextStrings.push(block.trim());
    } else {
      contextStrings.push("Данные об успеваемости отсутствуют.");
    }
  }

  // 3. ПРЕПОДАВАТЕЛЬ
  if (roles.includes("teacher") || roles.includes("dean")) {
    const { data: teaching } = await supabase
      .from("offering_teachers")
      .select(`
        course_offering (
          courses (name)
        )
      `)
      .eq("instructor_id", userId);

    if (teaching && teaching.length > 0) {
      let block = `Ведёт курсы:\n`;
      teaching.forEach((t: any) => {
        const course = t.course_offering?.courses;
        if (course) block += `- ${course.name}\n`;
      });
      contextStrings.push(block.trim());
    }
  }

  return contextStrings.join("\n\n");
}