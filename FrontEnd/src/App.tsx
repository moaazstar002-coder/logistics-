import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Command,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { ApiError, authApi, type AuthUser, shipmentApi } from "./api";
import AuthPage from "./components/AuthPage";
import NotificationPopover from "./components/NotificationPopover";
import ShipmentCharts from "./components/ShipmentCharts";
import ShipmentModal from "./components/ShipmentModal";
import ShipmentTable from "./components/ShipmentTable";
import StatsCards from "./components/StatsCards";
import type { Shipment, ShipmentInput } from "./types";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [path, setPath] = useState(window.location.pathname);

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState(null, "", nextPath);
    setPath(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let active = true;
    void authApi
      .me()
      .then((authenticatedUser) => {
        if (active) {
          setUser(authenticatedUser);
          setAuthError("");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          return;
        }
        setAuthError(
          error instanceof Error
            ? error.message
            : "تعذر التحقق من جلسة تسجيل الدخول.",
        );
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    navigate("/login");
  }, [navigate]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d19]">
        <LoaderCircle
          aria-label="جارٍ التحقق من الجلسة"
          className="animate-spin text-violet-400"
          size={28}
        />
      </div>
    );
  }

  if (user) {
    return (
      <Dashboard
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
        user={user}
      />
    );
  }

  return (
    <AuthPage
      key={path}
      initialError={authError}
      mode={path === "/register" ? "register" : "login"}
      onAuthenticated={(authenticatedUser) => {
        setAuthError("");
        setUser(authenticatedUser);
        navigate("/");
      }}
      onNavigate={navigate}
    />
  );
}

function Dashboard({
  user,
  onLogout,
  onSessionExpired,
}: {
  user: AuthUser;
  onLogout: () => Promise<void>;
  onSessionExpired: () => void;
}) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalShipment, setModalShipment] = useState<Shipment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setShipments(await shipmentApi.list());
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        onSessionExpired();
        return;
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "تعذر تحميل بيانات الشحنات.",
      );
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const openNewShipment = () => {
    setModalShipment(null);
    setModalOpen(true);
  };

  const openEditShipment = (shipment: Shipment) => {
    setModalShipment(shipment);
    setModalOpen(true);
  };

  const saveShipment = async (input: ShipmentInput) => {
    if (modalShipment) {
      const updated = await shipmentApi.update(modalShipment.id, input);
      setShipments((current) =>
        current.map((shipment) =>
          shipment.id === updated.id ? updated : shipment,
        ),
      );
      setNotice("تم تحديث بيانات الشحنة بنجاح");
    } else {
      const created = await shipmentApi.create(input);
      setShipments((current) => [created, ...current]);
      setNotice("تمت إضافة الشحنة بنجاح");
    }
    setModalOpen(false);
  };

  const deleteShipment = async (shipment: Shipment) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الشحنة ${shipment.tracking_number}؟`,
    );
    if (!confirmed) return;

    setDeletingId(shipment.id);
    setError("");
    try {
      await shipmentApi.remove(shipment.id);
      setShipments((current) =>
        current.filter((item) => item.id !== shipment.id),
      );
      setNotice("تم حذف الشحنة بنجاح");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "تعذر حذف الشحنة.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogoutClick = async () => {
    setLoggingOut(true);
    setError("");
    try {
      await onLogout();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "تعذر تسجيل الخروج.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const alertsCount = shipments.filter(
    (shipment) =>
      shipment.status === "Pending" || shipment.status === "Cancelled",
  ).length;
  const navigation = [
    { label: "نظرة عامة", icon: LayoutDashboard, href: "#overview" },
    { label: "التحليلات", icon: Activity, href: "#analytics" },
    { label: "الشحنات", icon: Package, href: "#shipments" },
  ];

  return (
    <div className="app-shell min-h-screen bg-[#080d19] text-slate-100">
      <aside
        className={`sidebar fixed inset-y-0 right-0 z-40 flex w-[260px] flex-col border-l border-white/[0.06] bg-[#0c1220] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-6">
          <a className="flex items-center gap-3" href="/" aria-label="مسار">
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
          <button
            aria-label="إغلاق القائمة"
            className="icon-button lg:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="sidebar-label">القائمة الرئيسية</p>
          <nav aria-label="القائمة الرئيسية" className="mt-3 space-y-1">
            {navigation.map(({ label, icon: Icon, href }) => (
              <a
                aria-current={label === "نظرة عامة" ? "page" : undefined}
                className={`nav-item ${label === "نظرة عامة" ? "nav-item-active" : ""}`}
                href={href}
                key={label}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {label === "الشحنات" && (
                  <span className="mr-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                    {shipments.length.toLocaleString("ar")}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="upgrade-card rounded-2xl border border-violet-400/15 p-4">
            <span className="mb-3 inline-flex rounded-lg bg-violet-400/10 p-2 text-violet-300">
              <ShieldCheck size={18} />
            </span>
            <p className="text-sm font-semibold text-slate-100">
              مساحة عمل خاصة
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              بيانات الشحنات معزولة عن الحسابات الأخرى.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-3">
            <span className="profile-avatar">
              {user.email.charAt(0).toLocaleUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-200">
                {user.email}
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                مساحة العمل الخاصة بك
              </span>
            </span>
            <button
              aria-label="تسجيل الخروج"
              className="icon-button"
              disabled={loggingOut}
              onClick={() => void handleLogoutClick()}
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="إغلاق القائمة الجانبية"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}

      <div className="min-h-screen lg:mr-[260px]">
        <header className="topbar sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#080d19]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              aria-label="فتح القائمة"
              className="icon-button lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-slate-500">مساحة العمل</span>
              <span className="text-slate-700">/</span>
              <span className="font-medium text-slate-200">نظرة عامة</span>
            </div>
            <span className="text-sm font-medium text-slate-200 sm:hidden">
              لوحة التحكم
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-label="البحث السريع عن شحنة"
              className="topbar-action hidden items-center gap-2 sm:flex"
              onClick={() =>
                window.dispatchEvent(new Event("shipment-search-focus"))
              }
              type="button"
            >
              <Search size={15} />
              <span>بحث سريع</span>
              <kbd>
                <Command size={11} /> K
              </kbd>
            </button>
            <div className="relative">
              <button
                aria-label={`الإشعارات${alertsCount ? `، ${alertsCount} تنبيه` : ""}`}
                aria-expanded={notificationsOpen}
                className="icon-button relative"
                onClick={() => setNotificationsOpen((open) => !open)}
                type="button"
              >
                <Bell size={18} />
                {alertsCount > 0 && (
                  <span className="notification-count">
                    {alertsCount > 9 ? "9+" : alertsCount.toLocaleString("ar")}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <NotificationPopover
                  onClose={() => setNotificationsOpen(false)}
                  shipments={shipments}
                />
              )}
            </div>
            <span className="hidden h-7 w-px bg-white/[0.08] sm:block" />
            <span className="profile-avatar profile-avatar-small">
              {user.email.charAt(0).toLocaleUpperCase()}
            </span>
          </div>
        </header>

        <main
          className="mx-auto max-w-[1500px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 lg:px-9"
          id="overview"
        >
          <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                النظام يعمل بشكل طبيعي
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
                نظرة عامة
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                أهلاً بك، إليك ملخص عمليات الشحن والتوصيل.
              </p>
            </div>
            <div className="date-chip">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              {new Intl.DateTimeFormat("ar", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </div>
          </div>

          {error && (
            <div
              className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3.5 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <span>{error}</span>
              <button
                className="shrink-0 font-medium text-rose-100 underline decoration-rose-300/40 underline-offset-4"
                onClick={() => void loadShipments()}
                type="button"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#111827]/60">
              <LoaderCircle
                className="animate-spin text-violet-400"
                size={28}
              />
              <p className="mt-4 text-sm text-slate-400">
                جارٍ تحميل بيانات الشحنات...
              </p>
            </div>
          ) : (
            <>
              <StatsCards shipments={shipments} />
              <div className="mt-7" id="analytics">
                <ShipmentCharts shipments={shipments} />
              </div>
              <div className="mt-7" id="shipments">
                <ShipmentTable
                  deletingId={deletingId}
                  onAdd={openNewShipment}
                  onDelete={deleteShipment}
                  onEdit={openEditShipment}
                  shipments={shipments}
                />
              </div>
            </>
          )}

          <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.05] pt-5 text-xs text-slate-600 sm:flex-row">
            <span>
              © {new Date().getFullYear()} مَسار لإدارة الخدمات اللوجستية
            </span>
            <span>صُممت لتبسيط عملياتك اليومية</span>
          </footer>
        </main>
      </div>

      {modalOpen && (
        <ShipmentModal
          onClose={() => setModalOpen(false)}
          onSave={saveShipment}
          shipment={modalShipment}
        />
      )}

      {notice && (
        <div
          className="toast fixed bottom-5 left-5 z-[60] flex items-center gap-2.5 rounded-xl border border-emerald-400/20 bg-[#12251f] px-4 py-3 text-sm text-emerald-200 shadow-xl shadow-black/30"
          role="status"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {notice}
        </div>
      )}
    </div>
  );
}
