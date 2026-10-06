import { test, expect } from "@playwright/test";
import { seal, unseal } from "../../src/lib/server/session-codec";
test("personal manages a student and prescribes a workout with a private session", async ({
  page,
  context,
  request,
  baseURL,
}) => {
  if (!process.env.E2E_ALLOW_WRITE || !process.env.E2E_PASSWORD)
    throw new Error(
      "Use an isolated backend and configure E2E_ALLOW_WRITE/E2E_PASSWORD.",
    );
  const email = `personal-${Date.now()}@example.test`;
  const password = process.env.E2E_PASSWORD;
  const created = await request.post("/api/auth/register", {
    headers: { Origin: baseURL! },
    data: { name: "Personal de teste", email, password },
  });
  expect(created.status()).toBe(201);
  const csrf = await request.post("/api/auth/login", {
    headers: { Origin: "https://other.example.test" },
    data: { email, password },
  });
  expect(csrf.status()).toBe(403);
  expect((await request.get("/api/backend/students")).status()).toBe(401);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Seu espaço de acompanhamento" }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "elofit-session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "elofit-session",
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  const secret = process.env.E2E_SESSION_SECRET;
  if (!secret || !cookie)
    throw new Error(
      "Configure E2E_SESSION_SECRET for session rotation checks.",
    );
  const initial = unseal(cookie.value, secret)!;
  const expired = seal({ ...initial, expires: 0 }, secret);
  await context.addCookies([{ ...cookie, value: expired }]);
  const rotations = await Promise.all([
    context.request.post("/api/auth/refresh", {
      headers: { Origin: baseURL!, Cookie: `elofit-session=${expired}` },
    }),
    context.request.post("/api/auth/refresh", {
      headers: { Origin: baseURL!, Cookie: `elofit-session=${expired}` },
    }),
  ]);
  for (const result of rotations) {
    expect(result.status()).toBe(200);
    expect(await result.json()).toEqual({ ok: true });
  }
  const renewed = (await context.cookies()).find(
    (c) => c.name === "elofit-session",
  )!;
  expect(unseal(renewed.value, secret)?.refresh !== initial.refresh).toBe(true);
  await page.getByRole("link", { name: "Novo aluno" }).click();
  await page.getByLabel("Nome completo").fill("Ana Teste");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`ana-${Date.now()}@example.test`);
  await page.getByRole("button", { name: "Salvar aluno" }).click();
  await expect(page.getByRole("heading", { name: "Ana Teste" })).toBeVisible();
  const studentId = new URL(page.url()).pathname.split("/").pop()!;
  const otherEmail = `other-${Date.now()}@example.test`;
  expect(
    (
      await request.post("/api/auth/register", {
        headers: { Origin: baseURL! },
        data: { name: "Outro personal", email: otherEmail, password },
      })
    ).status(),
  ).toBe(201);
  const otherLogin = await request.post("/api/auth/login", {
    headers: { Origin: baseURL! },
    data: { email: otherEmail, password },
  });
  expect(otherLogin.status()).toBe(200);
  const otherCookie = otherLogin.headers()["set-cookie"].split(";")[0];
  expect(
    (
      await request.get(`/api/backend/students/${studentId}`, {
        headers: { Cookie: otherCookie },
      })
    ).status(),
  ).toBe(404);
  await page.getByRole("link", { name: "Editar perfil" }).click();
  await page.getByLabel("Telefone (opcional)").fill("11999990000");
  await page.getByRole("button", { name: "Salvar aluno" }).click();
  await expect(page.getByText("11999990000")).toBeVisible();
  await page.getByRole("link", { name: "Treinos", exact: true }).click();
  await page.getByLabel("Nome do exercício").fill("Agachamento livre");
  await page.getByLabel("Grupo muscular (opcional)").fill("Inferiores");
  await page
    .getByRole("button", { name: "Adicionar exercício", exact: true })
    .click();
  await expect(
    page.getByText("Exercício adicionado à sua biblioteca."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Montar treino" }).click();
  await page.getByRole("combobox", { name: "Aluno", exact: true }).click();
  await page.getByRole("option", { name: "Ana Teste" }).click();
  await page.getByLabel("Nome do treino").fill("Treino A");
  await page.getByRole("combobox", { name: "Exercício", exact: true }).click();
  await page.getByRole("option", { name: "Agachamento livre" }).click();
  await page.getByLabel("Carga (kg, opcional)").fill("30");
  await page
    .getByRole("button", { name: "Salvar treino", exact: true })
    .click();
  await expect(page.getByText("Treino A", { exact: true })).toBeVisible();
  await expect(page.getByText(/Agachamento livre · 3 séries/)).toBeVisible();
  await page.getByRole("link", { name: "Visão geral" }).click();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta" }).last().click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await context.cookies()).find((c) => c.name === "elofit-session"),
  ).toBeUndefined();
});
