export const shipmentStatuses = [
  "Pending",
  "In Transit",
  "Delivered",
  "Cancelled",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export interface Shipment {
  id: number;
  tracking_number: string;
  recipient_name: string;
  destination: string;
  weight: number;
  status: ShipmentStatus;
  created_at?: string;
}

export type ShipmentInput = Omit<Shipment, "id" | "created_at">;
