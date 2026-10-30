import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CirclePlus,
  MapPin,
  Pencil,
  Search,
  Trash2,
  Weight,
} from "lucide-react";
import type { Shipment, ShipmentStatus } from "../types";

interface ShipmentTableProps {
  shipments: Shipment[];
  onAdd: () => void;
  onEdit: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
  deletingId: number | null;
}

type StatusFilter = ShipmentStatus | "All";

const statusInfo: Record<
  ShipmentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  Pending: {
    label: "قيد الانتظار",
    className: "badge-pending",
    dotClassName: "bg-amber-400",
  },
  "In Transit": {
    label: "في الطريق",
    className: "badge-transit",
    dotClassName: "bg-sky-400",
  },
  Delivered: {
    label: "تم التسليم",
    className: "badge-delivered",
    dotClassName: "bg-emerald-400",
  },
  Cancelled: {
    label: "ملغاة",
    className: "badge-cancelled",
    dotClassName: "bg-rose-400",
  },
};

const filterLabels: Record<StatusFilter, string> = {
  All: "كل الحالات",
  Pending: "قيد الانتظار",
  "In Transit": "في الطريق",
  Delivered: "تم التسليم",
  Cancelled: "ملغاة",
};

const pageSize = 8;

export default function ShipmentTable({
  shipments,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
}: ShipmentTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = () => searchInputRef.current?.focus();
    const filterByStatus = (event: Event) => {
      const status = (event as CustomEvent<ShipmentStatus>).detail;
      setQuery("");
      setStatusFilter(status);
      setPage(1);
    };
    window.addEventListener("shipment-search-focus", focusSearch);
    window.addEventListener("shipment-filter-status", filterByStatus);
    return () => {
      window.removeEventListener("shipment-search-focus", focusSearch);
      window.removeEventListener("shipment-filter-status", filterByStatus);
    };
  }, []);

  const filteredShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return shipments.filter((shipment) => {
      const matchesSearch =
        !normalizedQuery ||
        shipment.tracking_number.toLocaleLowerCase().includes(normalizedQuery) ||
        shipment.recipient_name.toLocaleLowerCase().includes(normalizedQuery);
      return (
        matchesSearch &&
        (statusFilter === "All" || shipment.status === statusFilter)
      );
    });
  }, [query, shipments, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstItem = filteredShipments.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const lastItem = Math.min(currentPage * pageSize, filteredShipments.length);

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const changeFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setFilterOpen(false);
    setPage(1);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111827]/90">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white">قائمة الشحنات</h2>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400">
              {filteredShipments.length.toLocaleString("ar")} شحنة
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            متابعة وإدارة جميع الشحنات المسجلة
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <label className="search-field">
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="ابحث برقم التتبع أو اسم المستلم"
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="ابحث عن شحنة..."
              ref={searchInputRef}
              value={query}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="relative">
            <button
              aria-expanded={filterOpen}
              className="filter-button"
              onClick={() => setFilterOpen((open) => !open)}
              type="button"
            >
              {filterLabels[statusFilter]}
              <ChevronDown size={15} />
            </button>
            {filterOpen && (
              <>
                <button
                  aria-label="إغلاق قائمة الحالات"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setFilterOpen(false)}
                  type="button"
                />
                <div className="filter-menu absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#1a2333] p-1.5 shadow-xl">
                  {(Object.keys(filterLabels) as StatusFilter[]).map(
                    (status) => (
                      <button
                        className={`filter-option ${statusFilter === status ? "filter-option-active" : ""}`}
                        key={status}
                        onClick={() => changeFilter(status)}
                        type="button"
                      >
                        {filterLabels[status]}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
          <button className="primary-button shrink-0" onClick={onAdd}>
            <CirclePlus size={17} />
            <span>إضافة شحنة</span>
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[790px] text-right">
          <thead>
            <tr className="table-heading">
              <th scope="col">
                <span className="inline-flex items-center gap-1.5">
                  رقم التتبع <ChevronsUpDown size={13} />
                </span>
              </th>
              <th scope="col">المستلم</th>
              <th scope="col">الوجهة</th>
              <th scope="col">الوزن</th>
              <th scope="col">الحالة</th>
              <th className="text-center" scope="col">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleShipments.map((shipment) => {
              const status = statusInfo[shipment.status];
              return (
                <tr className="table-row" key={shipment.id}>
                  <td>
                    <span className="font-mono text-sm font-medium text-slate-200" dir="ltr">
                      {shipment.tracking_number}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="avatar">
                        {shipment.recipient_name.trim().charAt(0) || "؟"}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {shipment.recipient_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                      <MapPin size={14} className="text-slate-500" />
                      {shipment.destination}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                      <Weight size={14} className="text-slate-500" />
                      {Number(shipment.weight).toLocaleString("ar")} كجم
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${status.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        aria-label={`تعديل الشحنة ${shipment.tracking_number}`}
                        className="row-action"
                        onClick={() => onEdit(shipment)}
                        title="تعديل"
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`حذف الشحنة ${shipment.tracking_number}`}
                        className="row-action row-action-delete"
                        disabled={deletingId === shipment.id}
                        onClick={() => onDelete(shipment)}
                        title="حذف"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleShipments.length === 0 && (
              <tr>
                <td className="px-6 py-16 text-center" colSpan={6}>
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="empty-icon">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-medium text-slate-200">
                      {shipments.length
                        ? "لا توجد شحنات مطابقة"
                        : "لا توجد شحنات حتى الآن"}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-500">
                      {shipments.length
                        ? "جرّب تغيير كلمات البحث أو فلتر الحالة."
                        : "أضف أول شحنة لتبدأ متابعة عمليات التوصيل."}
                    </p>
                    {!shipments.length && (
                      <button
                        className="primary-button mt-5"
                        onClick={onAdd}
                        type="button"
                      >
                        <CirclePlus size={16} />
                        إضافة شحنة جديدة
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-500">
          عرض{" "}
          <span className="font-medium text-slate-300">{firstItem}–{lastItem}</span>{" "}
          من{" "}
          <span className="font-medium text-slate-300">
            {filteredShipments.length.toLocaleString("ar")}
          </span>{" "}
          شحنة
        </p>
        <div className="flex items-center gap-2">
          <button
            aria-label="الصفحة السابقة"
            className="pagination-button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
          <span className="px-2 text-xs text-slate-400">
            صفحة {currentPage.toLocaleString("ar")} من{" "}
            {pageCount.toLocaleString("ar")}
          </span>
          <button
            aria-label="الصفحة التالية"
            className="pagination-button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
