const uuid = "[0-9a-fA-F-]{36}";
const rules: [RegExp, string[]][] = [
  [/^students$/, ["GET", "POST"]],
  [new RegExp(`^students/${uuid}$`), ["GET", "PUT"]],
  [new RegExp(`^students/${uuid}/workouts$`), ["GET"]],
  [new RegExp(`^students/${uuid}/invitation$`), ["POST"]],
  [new RegExp(`^students/${uuid}/archive$`), ["POST"]],
  [/^exercises$/, ["GET", "POST"]],
  [new RegExp(`^exercises/${uuid}$`), ["PUT"]],
  [/^workouts$/, ["POST"]],
  [new RegExp(`^workouts/${uuid}$`), ["GET", "PUT"]],
];
const studentRules: [RegExp, string[]][] = [
  [new RegExp(`^students/${uuid}/workouts$`), ["GET"]],
  [new RegExp(`^students/${uuid}/sessions$`), ["GET"]],
  [new RegExp(`^workouts/${uuid}$`), ["GET"]],
  [new RegExp(`^workouts/${uuid}/sessions$`), ["POST"]],
  [new RegExp(`^sessions/${uuid}$`), ["GET"]],
  [new RegExp(`^sessions/${uuid}/complete$`), ["POST"]],
  [new RegExp(`^executions/${uuid}/sets$`), ["PUT"]],
  [new RegExp(`^executions/${uuid}/complete$`), ["POST"]],
];
export function permitted(
  path: string,
  method: string,
  role = "personal",
  studentId?: string | null,
) {
  if (!["personal", "student"].includes(role)) return false;
  if (
    role === "student" &&
    path.startsWith("students/") &&
    path.split("/")[1] !== studentId
  )
    return false;
  return (role === "student" ? studentRules : rules).some(
    ([pattern, methods]) => pattern.test(path) && methods.includes(method),
  );
}
