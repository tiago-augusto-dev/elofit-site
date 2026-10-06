import { test, expect } from "@playwright/test";
type Message = { ID: string; Subject: string; To: { Address: string }[] };
test("verification and recovery links complete the real Mailpit flow", async ({
  page,
  request,
  baseURL,
}) => {
  if (!process.env.E2E_ALLOW_WRITE || !process.env.E2E_PASSWORD)
    throw new Error("Configure an isolated backend and E2E credentials.");
  const email = `recovery-${Date.now()}@example.test`;
  const password = process.env.E2E_PASSWORD;
  const headers = { Origin: baseURL! };
  expect(
    (
      await request.post("/api/auth/register", {
        headers,
        data: { name: "Personal de recuperação", email, password },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/confirmar-email");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText(/Se o cadastro estiver elegível/)).toBeVisible();
  async function mailToken(subject: string) {
    let message: Message | undefined;
    await expect
      .poll(
        async () => {
          const result = await request.get(
            "http://127.0.0.1:8025/api/v1/messages",
          );
          const data = await result.json();
          message = (data.messages as Message[]).find(
            (m) =>
              m.To.some((to) => to.Address === email) &&
              m.Subject.includes(subject),
          );
          return !!message;
        },
        { timeout: 15000 },
      )
      .toBe(true);
    const detail = await request.get(
      `http://127.0.0.1:8025/api/v1/message/${message!.ID}`,
    );
    const token = (await detail.json()).Text.match(
      /token=([A-Za-z0-9_-]+)/,
    )?.[1];
    if (!token)
      throw new Error("Mailpit message did not contain the expected link.");
    return token as string;
  }
  const verification = await mailToken("Confirme");
  await page.goto(`/verify-email?token=${verification}`);
  await page
    .getByRole("button", { name: "Confirmar e-mail", exact: true })
    .click();
  await expect(
    page.getByText("E-mail confirmado. Você já pode entrar."),
  ).toBeVisible();
  expect(
    (
      await request.post("/api/auth/verify-email", {
        headers,
        data: { token: verification },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/recuperar-senha");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByText(/Se o cadastro estiver elegível/)).toBeVisible();
  const reset = await mailToken("Recuperação");
  await page.goto(`/reset-password?token=${reset}`);
  await page.getByLabel("Senha", { exact: true }).fill(`${password}-updated`);
  await page.getByRole("button", { name: "Atualizar senha" }).click();
  await expect(
    page.getByText("Senha atualizada. Entre novamente com sua nova senha."),
  ).toBeVisible();
  expect(
    (
      await request.post("/api/auth/reset-password", {
        headers,
        data: { token: reset, password: `${password}-updated` },
      })
    ).status(),
  ).toBe(401);
  const loggedIn = await request.post("/api/auth/login", {
    headers,
    data: { email, password: `${password}-updated` },
  });
  expect(loggedIn.status()).toBe(200);
  expect(await loggedIn.json()).toEqual({ ok: true });
});
