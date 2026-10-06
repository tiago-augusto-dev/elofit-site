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
export function permitted(path: string, method: string) {
  return rules.some(
    ([pattern, methods]) => pattern.test(path) && methods.includes(method),
  );
}
