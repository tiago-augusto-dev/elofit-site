"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { authAction, messageFor } from "@/lib/api/client";
export type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "request-email-verification"
  | "activate";
const copy: Record<AuthMode, [string, string, string]> = {
  login: [
    "Bem-vindo de volta",
    "Entre no seu espaço de acompanhamento.",
    "Entrar",
  ],
  register: [
    "Comece seu próximo passo",
    "Crie sua conta de personal no EloFit.",
    "Criar conta",
  ],
  "forgot-password": [
    "Recuperar acesso",
    "Enviaremos um link para você criar uma nova senha.",
    "Enviar instruções",
  ],
  "reset-password": [
    "Crie uma nova senha",
    "Use uma senha única com pelo menos 8 caracteres.",
    "Atualizar senha",
  ],
  "request-email-verification": [
    "Confirmar seu e-mail",
    "Solicite um novo link de confirmação.",
    "Enviar link",
  ],
  activate: [
    "Seu acompanhamento começa aqui",
    "Crie uma senha para ativar o convite do seu personal.",
    "Ativar conta",
  ],
};
export function AuthForm({
  mode,
  token = "",
}: {
  mode: AuthMode;
  token?: string;
}) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState<"personal" | "student">("personal");
  const choosesRole = [
    "login",
    "forgot-password",
    "request-email-verification",
  ].includes(mode);
  const router = useRouter();
  const cache = useQueryClient();
  const hasPassword = [
    "login",
    "register",
    "reset-password",
    "activate",
  ].includes(mode);
  const hasEmail = !["reset-password", "activate"].includes(mode);
  const schema = z.object({
    name:
      mode === "register"
        ? z.string().trim().min(1, "Informe seu nome.").max(150)
        : z.string(),
    email: hasEmail
      ? z.string().trim().email("Informe um e-mail válido.").max(254)
      : z.string(),
    password: hasPassword
      ? z
          .string()
          .min(
            mode === "login" ? 1 : 8,
            mode === "login"
              ? "Informe sua senha."
              : "Use pelo menos 8 caracteres.",
          )
          .max(128)
      : z.string(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const submit = handleSubmit(async (data) => {
    setError("");
    try {
      const payload =
        mode === "register"
          ? data
          : mode === "login"
            ? { email: data.email, password: data.password, role }
            : ["activate", "reset-password"].includes(mode)
              ? { token, password: data.password }
              : { email: data.email, role };
      await authAction(mode, payload);
      if (mode === "login") {
        cache.clear();
        router.replace(role === "student" ? "/area-aluno" : "/painel");
        router.refresh();
        return;
      }
      if (mode === "register") {
        // Account creation already succeeded; verification failure must not invite
        // the user to submit the registration again.
        try {
          await authAction("request-email-verification", { email: data.email });
        } catch {
          /* explicit resend remains available */
        }
        setSuccess(
          "Conta criada. Solicite ou consulte o e-mail de confirmação e entre para começar.",
        );
      } else if (mode === "reset-password")
        setSuccess("Senha atualizada. Entre novamente com sua nova senha.");
      else if (mode === "activate")
        setSuccess(
          "Conta ativada. Entre escolhendo o perfil Aluno para acessar seus treinos.",
        );
      else
        setSuccess(
          "Se o cadastro estiver elegível, enviaremos as instruções para o e-mail informado.",
        );
    } catch (cause) {
      setError(messageFor(cause));
    }
  });
  const [title, description, button] = copy[mode];
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography
          variant="overline"
          sx={{ color: "#456B20", fontWeight: 700 }}
        >
          ELOFIT ·{" "}
          {mode === "activate" || (choosesRole && role === "student")
            ? "ALUNO"
            : "PERSONAL"}
        </Typography>
        <Typography component="h1" variant="h3">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
      {success ? (
        <>
          <Alert severity="success" role="status">
            {success}
          </Alert>
          <Button component={Link} href="/login" variant="contained">
            Voltar para entrar
          </Button>
          {mode === "register" && (
            <Button component={Link} href="/confirmar-email">
              Reenviar confirmação
            </Button>
          )}
        </>
      ) : (
        <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
          {choosesRole && (
            <TextField
              select
              label="Perfil"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as "personal" | "student");
                setError("");
              }}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="student">Aluno</MenuItem>
            </TextField>
          )}
          {mode === "register" && (
            <TextField
              label="Seu nome"
              autoComplete="name"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
          {hasEmail && (
            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
          {hasPassword && (
            <TextField
              label="Senha"
              type={show ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              {...register("password")}
              error={!!errors.password}
              helperText={
                errors.password?.message ??
                (mode === "login" ? undefined : "Entre 8 e 128 caracteres.")
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShow(!show)}
                        edge="end"
                      >
                        {show ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          {mode === "login" && (
            <Typography
              component={Link}
              href="/recuperar-senha"
              variant="body2"
              sx={{ alignSelf: "flex-end", fontWeight: 700 }}
            >
              Esqueci minha senha
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            disabled={
              isSubmitting ||
              (["activate", "reset-password"].includes(mode) && !token)
            }
          >
            {isSubmitting ? "Aguarde…" : button}
          </Button>
          {["activate", "reset-password"].includes(mode) && !token && (
            <Alert severity="warning">
              Abra esta página pelo link recebido. O código não foi informado.
            </Alert>
          )}
        </Stack>
      )}
      {!success &&
        (mode === "login" ? (
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2">
              Novo por aqui?{" "}
              <Link href="/cadastro">Criar conta de personal</Link>
            </Typography>
            <Typography variant="body2">
              <Link href="/confirmar-email">Preciso confirmar meu e-mail</Link>
            </Typography>
          </Stack>
        ) : (
          <Typography component={Link} href="/login" variant="body2">
            Voltar para entrar
          </Typography>
        ))}
    </Stack>
  );
}
