import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import {
  collectErrors,
  email as emailRule,
  hasErrors,
  lengthBetween,
  noLeadingSpace,
  required,
} from "../lib/validation";
import { getErrorMessage } from "../lib/http";
import { useAuth } from "../state/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess(false);

    const validationErrors = validateRegisterForm(name, email, password);
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-8 shadow-2xl shadow-slate-900/5 backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            StoreSystem
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Регистрация</h1>
          <p className="mt-2 text-sm text-muted-foreground">Создайте учетную запись для входа в систему.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            type="text"
            name="username"
            label="Имя пользователя"
            placeholder="Имя пользователя"
            required
            value={name}
            error={fieldErrors.name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldErrors((current) => ({ ...current, name: "" }));
            }}
          />
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="Email"
            required
            value={email}
            error={fieldErrors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: "" }));
            }}
          />
          <Input
            type="password"
            name="password"
            label="Пароль"
            placeholder="Пароль"
            required
            value={password}
            error={fieldErrors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: "" }));
            }}
          />
          <Button type="submit" fullWidth disabled={submitting} className="mt-1">
            {submitting ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>

        {success ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            Регистрация прошла успешно!
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">{error}</div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Есть аккаунт?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

function validateRegisterForm(name: string, email: string, password: string) {
  const nameRequired = required(name, "Имя пользователя обязательно для заполнения.");
  const emailRequired = required(email, "Email обязателен для заполнения.");
  const passwordRequired = required(password, "Пароль обязателен для заполнения.");

  return collectErrors([
    [
      "name",
      nameRequired ||
        noLeadingSpace(name, "Имя должно содержать от 3 до 50 символов и не начинаться с пробела.") ||
        lengthBetween(name, 3, 50, "Имя должно содержать от 3 до 50 символов и не начинаться с пробела."),
    ],
    ["email", emailRequired || emailRule(email)],
    [
      "password",
      passwordRequired ||
        noLeadingSpace(password, "Пароль должен быть от 8 до 50 символов и не начинаться с пробела.") ||
        lengthBetween(password, 8, 50, "Пароль должен быть от 8 до 50 символов и не начинаться с пробела."),
    ],
  ]);
}
