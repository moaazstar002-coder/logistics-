import { useEffect, useRef } from "react";
import { Bell, ChevronLeft, Clock3, Package, X } from "lucide-react";
import type { Shipment, ShipmentStatus } from "../types";

interface NotificationPopoverProps {
  shipments: Shipment[];
  onClose: () => void;
}

const statusMessage: Record<"Pending" | "Cancelled", string> = {
  Pending: "بانتظار التجهيز",
  Cancelled: "تحتاج إلى مراجعة",
};

const statusStyle: Record<"Pending" | "Cancelled", string> = {
  Pending: "notification-status-pending",
  Cancelled: "notification-status-cancelled",
};

export default function NotificationPopover({
  shipments,
  onClose,
}: NotificationPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const alerts = shipments
    .filter(
      (shipment): shipment is Shipment & {
        status: "Pending" | "Cancelled";
      } =>
        shipment.status === "Pending" || shipment.status === "Cancelled",
    )
    .sort((left, right) => {
      const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightDate - leftDate;
    });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const openShipments = (status: ShipmentStatus) => {
    window.dispatchEvent(
      new CustomEvent<ShipmentStatus>("shipment-filter-status", {
        detail: status,
      }),
    );
    onClose();
    window.setTimeout(
      () =>
        document
          .getElementById("shipments")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };

  return (
    <div
      className="notification-popover absolute left-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50"
      ref={rootRef}
      role="dialog"
      aria-label="تنبيهات الشحنات"
    >
      <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="notification-heading-icon">
            <Bell size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-100">
              تنبيهات الشحنات
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {alerts.length
                ? `${alerts.length.toLocaleString("ar")} شحنات تحتاج إلى متابعة`
                : "كل الشحنات ضمن المتابعة"}
            </span>
          </span>
        </div>
        <button
          aria-label="إغلاق التنبيهات"
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </header>

      <div className="max-h-[390px] overflow-y-auto p-2">
        {alerts.length ? (
          alerts.slice(0, 8).map((shipment) => {
            const status = shipment.status;
            return (
              <button
                className="notification-item"
                key={shipment.id}
                onClick={() => openShipments(status)}
                type="button"
              >
                <span className={`notification-item-icon ${statusStyle[status]}`}>
                  <Package size={16} />
                </span>
                <span className="min-w-0 flex-1 text-right">
                  <span className="block truncate text-xs font-medium text-slate-200">
                    {statusMessage[status]} · {shipment.recipient_name}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-mono" dir="ltr">
                      {shipment.tracking_number}
                    </span>
                    <span>·</span>
                    <Clock3 size={11} />
                    {shipment.created_at
                      ? new Intl.DateTimeFormat("ar", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(shipment.created_at))
                      : "تاريخ غير متوفر"}
                  </span>
                </span>
                <ChevronLeft size={15} className="shrink-0 text-slate-600" />
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <span className="empty-icon">
              <Bell size={18} />
            </span>
            <p className="mt-3 text-xs font-medium text-slate-300">
              لا توجد تنبيهات حالياً
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">
              سنعرض هنا الشحنات المعلقة أو التي تحتاج إلى مراجعة.
            </p>
          </div>
        )}
      </div>

      {alerts.length > 8 && (
        <footer className="border-t border-white/[0.07] px-4 py-3 text-center text-[11px] text-slate-500">
          يتم عرض أحدث 8 تنبيهات
        </footer>
      )}
    </div>
  );
}
