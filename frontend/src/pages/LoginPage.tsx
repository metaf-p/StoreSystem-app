import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Input } from "../ui/Input";
import { collectErrors, email as emailRule, hasErrors, required } from "../lib/validation";
import { useAuth } from "../state/AuthContext";

export function LoginPage() {
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setError("");
    setFieldErrors({});
  }, [email, password]);

  if (status === "authenticated") {
    return <Navigate to="/products" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateLoginForm(email, password);
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
      const from = (location.state as { from?: Location } | null)?.from?.pathname || "/products";
      navigate(from, { replace: true });
    } catch {
      setError("Неверный email или пароль.");
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
          <h1 className="text-3xl font-semibold tracking-tight">Вход</h1>
          <p className="mt-2 text-sm text-muted-foreground">Авторизуйтесь, чтобы перейти к управлению продуктами.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="Email"
            required
            value={email}
            error={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            name="password"
            label="Пароль"
            placeholder="Пароль"
            required
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <Checkbox
              name="remember-me"
              aria-label="remember-me"
              data-testid="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <span>Запомнить меня</span>
          </label>

          <Button type="submit" fullWidth disabled={submitting} className="mt-1">
            {submitting ? "Вход..." : "Войти"}
          </Button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive" data-testid="login-error">
            {error}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
    </div>
  );
}

function validateLoginForm(email: string, password: string) {
  const emailRequired = required(email, "Email обязателен для заполнения.");
  return collectErrors([
    ["email", emailRequired || emailRule(email)],
    ["password", required(password, "Пароль обязателен для заполнения.")],
  ]);
}
