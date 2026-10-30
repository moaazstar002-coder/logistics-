import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ApiError, authApi, type AuthUser } from "../api";

interface AuthPageProps {
  mode: "login" | "register";
  initialError?: string;
  onAuthenticated: (user: AuthUser) => void;
  onNavigate: (path: string) => void;
}

export default function AuthPage({
  mode,
  initialError = "",
  onAuthenticated,
  onNavigate,
}: AuthPageProps) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isRegister && password !== confirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    try {
      const user = isRegister
        ? await authApi.register(email, password)
        : await authApi.login(email, password);
      onAuthenticated(user);
    } catch (authError) {
      if (authError instanceof ApiError) {
        setError(authError.message);
      } else {
        setError("تعذر الاتصال بالخادم. تحقق من تشغيل الـBackend وحاول مجدداً.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page min-h-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <header className="relative z-10 flex h-[78px] items-center justify-between px-5 sm:px-10 lg:px-14">
        <a
          aria-label="مسار"
          className="flex items-center gap-3"
          href="/login"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("/login");
          }}
        >
          <span className="brand-mark">
            <Truck size={20} strokeWidth={2} />
          </span>
          <span>
            <span className="block text-base font-bold tracking-wide text-white">
              مَسار
            </span>
            <span className="mt-0.5 block text-[10px] tracking-[0.13em] text-slate-500">
              LOGISTICS SUITE
            </span>
          </span>
        </a>
        <span className="hidden items-center gap-2 text-xs text-slate-500 sm:inline-flex">
          <ShieldCheck size={15} className="text-emerald-400" />
          اتصال آمن ومشفّر
        </span>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-78px)] max-w-6xl items-center gap-12 px-5 pb-12 pt-5 lg:grid-cols-[1fr_440px] lg:px-10 lg:pb-20">
        <section className="hidden lg:block">
          <div className="auth-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
            منصة لوجستية متكاملة
          </div>
          <h1 className="mt-6 max-w-xl text-[46px] font-semibold leading-[1.4] tracking-tight text-white">
            كل شحناتك،
            <br />
            <span className="auth-heading-gradient">في مسار واحد.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-400">
            تابع عمليات التوصيل، وأدر الشحنات، وابقَ على اطلاع كامل من لوحة
            تحكم واحدة مصممة لفريقك.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="auth-feature-icon">
              <LockKeyhole size={19} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                مساحة عمل خاصة بك
              </p>
              <p className="mt-1 text-xs text-slate-500">
                بيانات شحناتك لا تظهر إلا لأعضاء حسابك
              </p>
            </div>
          </div>
          <div className="mt-11 grid max-w-lg grid-cols-2 gap-3">
            <div className="auth-benefit-card">
              <ShieldCheck size={17} />
              <span>خصوصية لكل حساب</span>
            </div>
            <div className="auth-benefit-card">
              <Truck size={17} />
              <span>متابعة من مكان واحد</span>
            </div>
          </div>
        </section>

        <section className="auth-card mx-auto w-full max-w-[440px] rounded-3xl border border-white/[0.09] bg-[#111827]/95 p-6 shadow-2xl shadow-black/30 sm:p-9">
          <div className="auth-form-mark">
            <LockKeyhole size={20} />
          </div>
          <p className="mt-6 text-xs font-medium text-violet-300">
            مرحباً بك في مسار
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isRegister ? "أنشئ حسابك" : "سجّل الدخول"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isRegister
              ? "أنشئ مساحة عمل خاصة لبدء إدارة شحناتك."
              : "أدخل بيانات حسابك للوصول إلى لوحة الشحنات."}
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>البريد الإلكتروني</span>
              <span className="auth-input-wrap">
                <Mail aria-hidden="true" size={16} />
                <input
                  autoComplete="email"
                  autoFocus
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </span>
            </label>
            <label className="form-field">
              <span>كلمة المرور</span>
              <span className="auth-input-wrap">
                <LockKeyhole aria-hidden="true" size={16} />
                <input
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  maxLength={128}
                  minLength={isRegister ? 12 : 1}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? "12 حرفاً على الأقل" : "أدخل كلمة المرور"}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                  className="password-toggle"
                  onClick={() => setShowPassword((shown) => !shown)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {isRegister && (
              <label className="form-field">
                <span>تأكيد كلمة المرور</span>
                <span className="auth-input-wrap">
                  <LockKeyhole aria-hidden="true" size={16} />
                  <input
                    autoComplete="new-password"
                    maxLength={128}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmation}
                  />
                </span>
              </label>
            )}

            {error && (
              <p
                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-200"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="primary-button min-h-[46px] w-full !text-sm"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <ArrowLeft size={17} />
              )}
              {submitting
                ? "جارٍ التحقق..."
                : isRegister
                  ? "إنشاء الحساب"
                  : "دخول إلى لوحة التحكم"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
            <button
              className="font-medium text-violet-300 transition hover:text-violet-200"
              onClick={() => onNavigate(isRegister ? "/login" : "/register")}
              type="button"
            >
              {isRegister ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </button>
          </p>
          <p className="mt-6 border-t border-white/[0.06] pt-5 text-center text-[11px] leading-5 text-slate-600">
            بإنشاء حساب جديد، ستحصل على مساحة مستقلة عن حسابات المستخدمين
            الآخرين.
          </p>
        </section>
      </div>
    </main>
  );
}
