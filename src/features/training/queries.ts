import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
export const workoutsOptions = (id: string) =>
  queryOptions({
    queryKey: ["workouts", id],
    queryFn: async () => {
      const all = [];
      let offset = 0;
      while (true) {
        const page = unwrap(
          await api.GET("/api/v1/students/{student_id}/workouts", {
            params: { path: { student_id: id }, query: { limit: 100, offset } },
          }),
        );
        all.push(...page);
        if (page.length < 100) break;
        offset += 100;
      }
      return all;
    },
  });
export const exercisesOptions = queryOptions({
  queryKey: ["exercises"],
  queryFn: async () => {
    const all = [];
    let offset = 0;
    while (true) {
      const page = unwrap(
        await api.GET("/api/v1/exercises", {
          params: { query: { limit: 100, offset } },
        }),
      );
      all.push(...page);
      if (page.length < 100) break;
      offset += 100;
    }
    return all;
  },
});
