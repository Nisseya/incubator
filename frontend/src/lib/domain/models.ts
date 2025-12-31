export type UUID = string;
export type ISODate = string;       // "YYYY-MM-DD"
export type ISOTimestamp = string;  // ISO

export type BatchStatus = "incubating" | "hatched" | "failed" | "archived";
export type NotificationStatus =
  | "scheduled"
  | "processing"
  | "sent"
  | "failed"
  | "canceled";

export type Incubator = {
  id: UUID;
  userId: UUID;
  model: string | null;
  traysAmt: number | null;
  position: number;
  createdAt: ISOTimestamp;
};

export type Tray = {
  id: UUID;
  incubatorId: UUID;
  capacity: number;
  floor: number;
  createdAt: ISOTimestamp;
};

export type Species = {
  id: string;
  name: string;
  incubationDays: number;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
};

export type Batch = {
  id: UUID;
  trayId: UUID;
  speciesId: string;
  eggsQty: number;
  startAt: ISODate;
  expectedHatchAt: ISODate;
  status: BatchStatus;
  notes: string | null;
  createdAt: ISOTimestamp;
};

export type IncubatorWithTrays = Incubator & {
  trays: Tray[];
};


// export type ScheduledNotification = {
//   id: UUID;
//   userId: UUID;
//   batchId: UUID | null;
//   scheduledAt: ISOTimestamp;
//   title: string;
//   body: string;
//   status: NotificationStatus;
//   attempts: number;
//   lastError: string | null;
//   sentAt: ISOTimestamp | null;
//   createdAt: ISOTimestamp;
// };
