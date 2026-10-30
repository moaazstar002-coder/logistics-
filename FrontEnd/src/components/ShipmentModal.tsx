import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, PackagePlus, X } from "lucide-react";
import {
  shipmentStatuses,
  type Shipment,
  type ShipmentInput,
  type ShipmentStatus,
} from "../types";

interface ShipmentModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onSave: (shipment: ShipmentInput) => Promise<void>;
}

const emptyForm: ShipmentInput = {
  tracking_number: "",
  recipient_name: "",
  destination: "",
  weight: 1,
  status: "Pending",
};

const statusNames: Record<ShipmentStatus, string> = {
  Pending: "قيد الانتظار",
  "In Transit": "في الطريق",
  Delivered: "تم التسليم",
  Cancelled: "ملغاة",
};

export default function ShipmentModal({
  shipment,
  onClose,
  onSave,
}: ShipmentModalProps) {
  const [form, setForm] = useState<ShipmentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(
      shipment
        ? {
            tracking_number: shipment.tracking_number,
            recipient_name: shipment.recipient_name,
            destination: shipment.destination,
            weight: shipment.weight,
            status: shipment.status,
          }
        : emptyForm,
    );
    setError("");
  }, [shipment]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const updateField = <K extends keyof ShipmentInput>(
    key: K,
    value: ShipmentInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        tracking_number: form.tracking_number.trim(),
        recipient_name: form.recipient_name.trim(),
        destination: form.destination.trim(),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "تعذر حفظ الشحنة. حاول مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="shipment-modal-title"
        aria-modal="true"
        className="modal-panel my-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50"
        role="dialog"
      >
        <header className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="stat-icon stat-icon-violet">
              <PackagePlus size={20} />
            </span>
            <div>
              <h2
                className="text-lg font-semibold text-white"
                id="shipment-modal-title"
              >
                {shipment ? "تعديل بيانات الشحنة" : "إضافة شحنة جديدة"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                أدخل بيانات الشحنة بشكل صحيح
              </p>
            </div>
          </div>
          <button
            aria-label="إغلاق النافذة"
            className="icon-button"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <form className="space-y-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-field">
              <span>رقم التتبع</span>
              <input
                autoFocus
                autoComplete="off"
                maxLength={60}
                onChange={(event) =>
                  updateField("tracking_number", event.target.value)
                }
                placeholder="مثال: MS-2025-001"
                required
                value={form.tracking_number}
              />
            </label>
            <label className="form-field">
              <span>اسم المستلم</span>
              <input
                autoComplete="name"
                maxLength={120}
                onChange={(event) =>
                  updateField("recipient_name", event.target.value)
                }
                placeholder="الاسم الكامل"
                required
                value={form.recipient_name}
              />
            </label>
            <label className="form-field">
              <span>الوجهة</span>
              <input
                autoComplete="address-level2"
                maxLength={160}
                onChange={(event) =>
                  updateField("destination", event.target.value)
                }
                placeholder="المدينة أو العنوان"
                required
                value={form.destination}
              />
            </label>
            <label className="form-field">
              <span>الوزن (كجم)</span>
              <input
                max="100000"
                min="0.01"
                onChange={(event) =>
                  updateField("weight", Number(event.target.value))
                }
                required
                step="0.01"
                type="number"
                value={form.weight}
              />
            </label>
            <label className="form-field sm:col-span-2">
              <span>حالة الشحنة</span>
              <select
                onChange={(event) =>
                  updateField("status", event.target.value as ShipmentStatus)
                }
                value={form.status}
              >
                {shipmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusNames[status]} · {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p
              className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
            <button
              className="secondary-button"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              إلغاء
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <PackagePlus size={17} />
              )}
              {saving ? "جارٍ الحفظ..." : "حفظ الشحنة"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
