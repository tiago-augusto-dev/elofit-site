import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
export const studentsOptions = queryOptions({
  queryKey: ["students"],
  queryFn: async () => {
    const all = [];
    let offset = 0;
    // Backend returns a list, without a total; traverse bounded pages rather than
    // invent a count from the first page. Request errors fail the whole query.
    while (true) {
      const page = unwrap(
        await api.GET("/api/v1/students", {
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
export const studentOptions = (id: string) =>
  queryOptions({
    queryKey: ["students", id],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/students/{student_id}", {
          params: { path: { student_id: id } },
        }),
      ),
  });
