import { useMemo } from "react";
import { Activity, CalendarDays, PackageCheck, Truck } from "lucide-react";
import type { Shipment, ShipmentStatus } from "../types";

const statuses: Array<{
  value: ShipmentStatus;
  label: string;
  color: string;
}> = [
  {
    value: "In Transit",
    label: "في الطريق",
    color: "#38bdf8",
  },
  {
    value: "Pending",
    label: "قيد الانتظار",
    color: "#fbbf24",
  },
  {
    value: "Delivered",
    label: "تم التسليم",
    color: "#34d399",
  },
  {
    value: "Cancelled",
    label: "ملغاة",
    color: "#fb7185",
  },
];

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ShipmentCharts({
  shipments,
}: {
  shipments: Shipment[];
}) {
  const distribution = statuses.map((status) => ({
    ...status,
    count: shipments.filter((shipment) => shipment.status === status.value)
      .length,
  }));
  const total = shipments.length;
  let accumulated = 0;
  const gradientStops = distribution.map((status) => {
    const start = accumulated;
    accumulated += total ? (status.count / total) * 100 : 0;
    return `${status.color} ${start}% ${accumulated}%`;
  });
  const donutStyle = {
    background:
      total === 0
        ? "conic-gradient(#293345 0% 100%)"
        : `conic-gradient(${gradientStops.join(", ")})`,
  };

  const dailyShipments = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const key = localDateKey(date);
      const count = shipments.filter((shipment) => {
        if (!shipment.created_at) return false;
        const createdAt = new Date(shipment.created_at);
        return !Number.isNaN(createdAt.getTime()) && localDateKey(createdAt) === key;
      }).length;
      return {
        key,
        label: new Intl.DateTimeFormat("ar", { weekday: "short" }).format(date),
        count,
      };
    });
  }, [shipments]);

  const peak = Math.max(...dailyShipments.map((day) => day.count), 1);
  const weeklyTotal = dailyShipments.reduce((sum, day) => sum + day.count, 0);
  const transitCount = distribution.find(
    (status) => status.value === "In Transit",
  )?.count ?? 0;

  return (
    <section
      aria-label="تحليلات الشحنات"
      className="grid gap-4 xl:grid-cols-[1.45fr_1fr]"
    >
      <article className="chart-card rounded-2xl border border-white/[0.07] bg-[#111827]/90 p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <span className="chart-kicker">
              <Activity size={14} />
              التحليلات
            </span>
            <h2 className="mt-2 text-base font-semibold text-white">
              حركة الشحنات
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              الشحنات المسجلة خلال آخر 7 أيام
            </p>
          </div>
          <span className="chart-summary">
            <CalendarDays size={14} />
            {weeklyTotal.toLocaleString("ar")} شحنات
          </span>
        </header>
        <div className="weekly-chart mt-7" role="img" aria-label="عدد الشحنات لكل يوم خلال الأيام السبعة الماضية">
          <div className="chart-grid-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="chart-bars">
            {dailyShipments.map((day) => (
              <div className="chart-bar-column" key={day.key}>
                <span className="chart-bar-value">
                  {day.count > 0 ? day.count.toLocaleString("ar") : ""}
                </span>
                <div className="chart-bar-track">
                  <span
                    className={`chart-bar ${day.count > 0 ? "chart-bar-active" : ""}`}
                    style={{
                      height: `${day.count ? Math.max((day.count / peak) * 100, 8) : 3}%`,
                    }}
                  />
                </div>
                <span className="chart-bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
        <footer className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500">
          <span>متوسط الشحنات اليومي</span>
          <span className="font-medium text-slate-300">
            {(weeklyTotal / 7).toLocaleString("ar", {
              maximumFractionDigits: 1,
            })}{" "}
            شحنة
          </span>
        </footer>
      </article>

      <article className="chart-card rounded-2xl border border-white/[0.07] bg-[#111827]/90 p-5 sm:p-6">
        <header>
          <span className="chart-kicker">
            <PackageCheck size={14} />
            التوزيع
          </span>
          <h2 className="mt-2 text-base font-semibold text-white">
            الشحنات حسب الحالة
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            نظرة فورية على حالة عملياتك
          </p>
        </header>
        <div className="mt-6 flex items-center justify-center gap-7 sm:gap-9 xl:gap-5 2xl:gap-9">
          <div
            aria-label={`إجمالي الشحنات ${total}`}
            className="shipment-donut"
            role="img"
            style={donutStyle}
          >
            <div className="shipment-donut-hole">
              <span className="text-2xl font-semibold text-white">
                {total.toLocaleString("ar")}
              </span>
              <span className="mt-1 text-[10px] text-slate-500">شحنة</span>
            </div>
          </div>
          <div className="min-w-[118px] flex-1 space-y-3">
            {distribution.map((item) => (
              <div
                className="flex items-center justify-between gap-3"
                key={item.value}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs text-slate-400">
                    {item.label}
                  </span>
                </span>
                <span className="text-xs font-medium text-slate-200">
                  {item.count.toLocaleString("ar")}
                </span>
              </div>
            ))}
          </div>
        </div>
        <footer className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Truck size={14} />
            في الطريق
          </span>
          <span className="font-medium text-slate-300">
            {transitCount.toLocaleString("ar")} شحنة
          </span>
        </footer>
      </article>
    </section>
  );
}
