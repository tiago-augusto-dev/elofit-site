import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

test("student logs in, records a workout and cannot access other students", async ({
  page,
  request,
  context,
  baseURL,
}) => {
  test.setTimeout(90_000);
  if (process.env.E2E_ALLOW_WRITE !== "1")
    throw new Error("Configure E2E_ALLOW_WRITE=1 for test fixture creation.");
  const backend = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:8000";
  const id = randomUUID();
  const email = `student-${id}@example.test`;
  const personalEmail = `personal-${id}@example.test`;
  const password = randomUUID();
  const personal = await request.post(`${backend}/api/v1/auth/personals`, {
    data: { name: "Personal teste aluno", email: personalEmail, password },
  });
  expect(personal.status()).toBe(201);
  const login = await request.post(`${backend}/api/v1/auth/login`, {
    data: { email: personalEmail, password, role: "personal" },
  });
  expect(login.status()).toBe(200);
  const headers = {
    Authorization: `Bearer ${(await login.json()).access_token}`,
  };
  const studentResponse = await request.post(`${backend}/api/v1/students`, {
    headers,
    data: { name: "Aluno teste de execução", email },
  });
  expect(studentResponse.status()).toBe(201);
  const student = await studentResponse.json();
  const otherResponse = await request.post(`${backend}/api/v1/students`, {
    headers,
    data: { name: "Outro aluno", email: `other-${id}@example.test` },
  });
  const other = await otherResponse.json();
  const invitation = await request.post(
    `${backend}/api/v1/students/${student.id}/invitation`,
    { headers },
  );
  const invited = await invitation.json();
  const activated = await request.post(`${backend}/api/v1/auth/activate`, {
    data: { token: invited.token, password },
  });
  expect(activated.status()).toBe(200);
  const exerciseResponse = await request.post(`${backend}/api/v1/exercises`, {
    headers,
    data: { name: "Agachamento de teste" },
  });
  const exercise = await exerciseResponse.json();
  const workout = await request.post(`${backend}/api/v1/workouts`, {
    headers,
    data: {
      student_id: student.id,
      name: "Treino teste aluno",
      exercises: [
        {
          exercise_id: exercise.id,
          sets: 1,
          repetitions: "10",
          target_load: 20,
          rest_seconds: 30,
          instructions: "Mantenha o movimento controlado.",
        },
      ],
    },
  });
  expect(workout.status()).toBe(201);
  await page.goto("/login");
  await page.getByRole("combobox", { name: "Perfil" }).click();
  await page.getByRole("option", { name: "Aluno", exact: true }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/area-aluno$/);
  await expect(page.getByRole("banner").getByText("Aluno teste de execução", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Meus treinos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Treino teste aluno", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByText("Mantenha o movimento controlado.", { exact: true }),
  ).not.toBeVisible();
  await page.getByText("Orientações", { exact: true }).click();
  await expect(
    page.getByText("Mantenha o movimento controlado.", { exact: true }),
  ).toBeVisible();
  await page.getByText("Orientações", { exact: true }).click();
  await page.screenshot({
    path: "test-results/student-overview-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page
      .getByRole("button", { name: "Iniciar treino", exact: true })
      .filter({ visible: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "test-results/student-overview-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  const cookie = (await context.cookies()).find(
    (value) => value.name === "elofit-session",
  )!;
  expect(cookie.httpOnly).toBe(true);
  const privateHeaders = {
    Cookie: `elofit-session=${cookie.value}`,
    Origin: baseURL!,
  };
  expect(
    (
      await context.request.get(`/api/backend/students/${other.id}/workouts`, {
        headers: privateHeaders,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await context.request.get("/api/backend/students", {
        headers: privateHeaders,
      })
    ).status(),
  ).toBe(404);
  // A fabricated workout belonging to another student must be rejected by the backend too.
  const otherWorkout = await request.post(`${backend}/api/v1/workouts`, {
    headers,
    data: {
      student_id: other.id,
      name: "Treino privado",
      exercises: [{ exercise_id: exercise.id, sets: 1, repetitions: "10" }],
    },
  });
  const privateWorkout = await otherWorkout.json();
  expect(
    (
      await context.request.get(`/api/backend/workouts/${privateWorkout.id}`, {
        headers: privateHeaders,
      })
    ).status(),
  ).toBe(404);
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Registro · Treino teste aluno" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Continuar treino", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Registro · Treino teste aluno" }),
  ).toBeVisible();
  await page.getByLabel("Repetições · série 1").fill("10");
  await page.getByLabel("Carga (kg) · série 1").fill("22.5");
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await page.getByRole("tab", { name: "Registro", exact: true }).click();
  await expect(page.getByLabel("Carga (kg) · série 1")).toHaveValue("22.5");
  await page.getByRole("button", { name: "Salvar série", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Atualizar série", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Série 1 de Agachamento de teste salva.",
  );
  await expect(
    page.getByRole("progressbar", { name: "Progresso das séries salvas" }),
  ).toHaveAttribute("aria-valuenow", "100");
  await page.screenshot({
    path: "test-results/student-record-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Concluir exercício", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Exercício concluído", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir treino", exact: true })
    .click();
  await expect(
    page.getByText("Treino concluído", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await page.getByLabel("Buscar treino no histórico").fill("inexistente");
  await expect(
    page.getByText("Nenhum treino encontrado com esses filtros."),
  ).toBeVisible();
  await page.getByLabel("Buscar treino no histórico").fill("");
  await page.screenshot({
    path: "test-results/student-history-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ver registro", exact: true }).click();
  await expect(
    page
      .getByLabel("Séries registradas de Agachamento de teste")
      .getByText("22,5 kg", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Séries registradas de Agachamento de teste")
      .getByText("10 repetições", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar série", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/student-mobile.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await page.screenshot({
    path: "test-results/student-history-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
