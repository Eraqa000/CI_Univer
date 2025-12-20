import { supabase } from "../db/supabase"

export async function buildUserContext(
  userId: string,
  roles: string[]
): Promise<string> {
  // 👤 профиль
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single()

  let context = `
Пользователь:
Имя: ${profile?.full_name ?? "Неизвестно"}
Email: ${profile?.email ?? "Неизвестно"}
Роль: ${roles.join(", ")}
`

  // 🎓 СТУДЕНТ
  if (roles.includes("student")) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        enrolled_at,
        courses (
          name,
          description
        )
      `)
      .eq("student_id", userId)

    if (enrollments && enrollments.length > 0) {
      context += `
Обучается на курсах:
`
      enrollments.forEach((e: any) => {
        context += `- ${e.courses.name}: ${e.courses.description}\n`
      })
    }
  }

  // 👨‍🏫 ПРЕПОДАВАТЕЛЬ
  if (roles.includes("teacher") || roles.includes("dean")) {
    const { data: teaching } = await supabase
      .from("course_teachers")
      .select(`
        courses (
          name,
          description
        )
      `)
      .eq("teacher_id", userId)

    if (teaching && teaching.length > 0) {
      context += `
Ведёт курсы:
`
      teaching.forEach((t: any) => {
        context += `- ${t.courses.name}\n`
      })
    }
  }

  // 🧑‍💼 АДМИН
  if (roles.includes("admin")) {
    context += `
Пользователь имеет административный доступ.
`
  }

  return context.trim()
}
