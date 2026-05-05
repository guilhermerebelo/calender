export type TravelEvent = {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  title: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
};

export type EventDraft = {
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  comments: string;
};

export type PaintColor = {
  id: string;
  name: string;
  value: string;
};

export type PaintedPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  color: string;
  colorName: string;
  createdAt: string;
};

export type PaintDraft = {
  startDate: string;
  endDate: string;
  color: string;
  colorName: string;
};
