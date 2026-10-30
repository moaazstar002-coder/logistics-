import {
  ArrowUpLeft,
  Box,
  Clock3,
  PackageCheck,
  Truck,
} from "lucide-react";
import type { Shipment } from "../types";

interface StatsCardsProps {
  shipments: Shipment[];
}

export default function StatsCards({ shipments }: StatsCardsProps) {
  const delivered = shipments.filter(
    (shipment) => shipment.status === "Delivered",
  ).length;
  const active = shipments.filter((shipment) =>
    ["Pending", "In Transit"].includes(shipment.status),
  ).length;
  const inTransit = shipments.filter(
    (shipment) => shipment.status === "In Transit",
  ).length;
  const pending = shipments.filter(
    (shipment) => shipment.status === "Pending",
  ).length;

  const cards = [
    {
      label: "إجمالي الشحنات",
      value: shipments.length,
      icon: Box,
      tone: "violet",
      detail: "جميع الشحنات المسجلة",
    },
    {
      label: "الشحنات النشطة",
      value: active,
      icon: Truck,
      tone: "blue",
      detail: `${inTransit} في الطريق الآن`,
    },
    {
      label: "تم التسليم",
      value: delivered,
      icon: PackageCheck,
      tone: "green",
      detail: "شحنات وصلت لوجهتها",
    },
    {
      label: "بانتظار المعالجة",
      value: pending,
      icon: Clock3,
      tone: "amber",
      detail: "تحتاج إلى متابعة",
    },
  ] as const;

  return (
    <section
      aria-label="إحصائيات الشحنات"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map(({ label, value, icon: Icon, tone, detail }) => (
        <article
          key={label}
          className="stat-card rounded-2xl border border-white/[0.07] bg-[#111827]/90 p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">{label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {value.toLocaleString("ar")}
              </p>
            </div>
            <span className={`stat-icon stat-icon-${tone}`}>
              <Icon size={20} strokeWidth={1.8} />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpLeft size={14} className="text-slate-400" />
            <span>{detail}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
