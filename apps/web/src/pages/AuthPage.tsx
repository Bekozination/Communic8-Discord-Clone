import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import { connectSocket } from "../lib/socket";
import { cn } from "../lib/utils";
import { MessageCircle, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  login: z.string().min(1, "Gerekli"),
  password: z.string().min(1, "Gerekli"),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "En az 3 karakter")
      .max(32)
      .regex(/^[a-z0-9_.]+$/, "Sadece küçük harf, rakam, nokta ve alt çizgi"),
    displayName: z.string().min(1, "Gerekli").max(64),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z.string().min(8, "En az 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler uyuşmuyor",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function handleLogin(data: LoginForm) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      connectSocket(res.data.accessToken);
      navigate("/app");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Giriş yapılamadı");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(data: RegisterForm) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      connectSocket(res.data.accessToken);
      navigate("/app");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Kayıt oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-fuchsia/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-fuchsia mb-4 shadow-lg shadow-brand-primary/25">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Comunic8</h1>
        </div>

        <div className="bg-surface-600/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-surface-400/20">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              {mode === "login" ? "Tekrar Hoş Geldin!" : "Hesap Oluştur"}
            </h2>
            <p className="text-text-muted text-sm mt-1">
              {mode === "login"
                ? "Arkadaşlarınla konuşmaya devam et"
                : "Topluluğa katıl"}
            </p>
          </div>

          {mode === "login" ? (
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  E-posta veya Kullanıcı Adı
                </label>
                <input
                  {...loginForm.register("login")}
                  className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                  placeholder="ornek@email.com"
                />
                {loginForm.formState.errors.login && (
                  <p className="text-brand-red text-xs mt-1">
                    {loginForm.formState.errors.login.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    {...loginForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-brand-red text-xs mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200",
                  "bg-gradient-to-r from-brand-primary to-brand-primary/80",
                  "hover:from-brand-primary/90 hover:to-brand-primary/70",
                  "active:scale-[0.98] shadow-lg shadow-brand-primary/25",
                  loading && "opacity-60 cursor-not-allowed",
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Kullanıcı Adı
                  </label>
                  <input
                    {...registerForm.register("username")}
                    className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                    placeholder="kullanici_adi"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-brand-red text-xs mt-1">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Görünen Ad
                  </label>
                  <input
                    {...registerForm.register("displayName")}
                    className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                    placeholder="Ad Soyad"
                  />
                  {registerForm.formState.errors.displayName && (
                    <p className="text-brand-red text-xs mt-1">
                      {registerForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                  E-posta
                </label>
                <input
                  {...registerForm.register("email")}
                  className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                  placeholder="ornek@email.com"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-brand-red text-xs mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                  Şifre
                </label>
                <input
                  {...registerForm.register("password")}
                  type="password"
                  className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                  placeholder="••••••••"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-brand-red text-xs mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                  Şifre Tekrar
                </label>
                <input
                  {...registerForm.register("confirmPassword")}
                  type="password"
                  className="w-full bg-surface-900/50 border border-surface-400/30 text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-muted"
                  placeholder="••••••••"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-brand-red text-xs mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200",
                  "bg-gradient-to-r from-brand-primary to-brand-fuchsia/80",
                  "hover:from-brand-primary/90 hover:to-brand-fuchsia/70",
                  "active:scale-[0.98] shadow-lg shadow-brand-primary/25",
                  loading && "opacity-60 cursor-not-allowed",
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Hesap oluşturuluyor...
                  </span>
                ) : (
                  "Hesap Oluştur"
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-3 text-sm text-brand-red mt-4 animate-fade-in">
              {error}
            </div>
          )}

          <p className="text-center text-text-muted text-sm mt-6">
            {mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-brand-primary hover:underline font-medium"
            >
              {mode === "login" ? "Kayıt ol" : "Giriş yap"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
