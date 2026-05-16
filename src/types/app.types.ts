export type ShiftType   = 'day' | 'night';
export type EntryType   = 'day_shift' | 'night_shift';
export type EntryStatus = 'open' | 'closed';
export type Role        = 'editor' | 'viewer';

export interface Member {
  id: string;
  name: string;
  shift_type: ShiftType;
  created_at: string;
}

export interface MeterEntry {
  id: string;
  entry_type: EntryType;
  is_auto: boolean;
  is_weekend: boolean;
  status: EntryStatus;
  start_meter: number;
  end_meter: number | null;
  usage_units: number | null;
  opening_at: string;
  closing_at: string | null;
  notes?: string;
  created_at: string;
}

export interface MemberUsage {
  id: string;
  member_id: string;
  meter_entry_id: string;
  units: number;
  cost: number;
}

export interface MemberTotal {
  member: Member;
  total_units: number;
  total_cost: number;
}

export interface OpeningMeterFormData {
  opening_meter: string;
  is_weekend: boolean;
  notes: string;
}

export interface ClosingMeterFormData {
  closing_meter: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface GrandTotals {
  total_units: number;
  total_cost: number;
  entry_count: number;
  open_count: number;
  night_auto_count: number;
}

export interface NightPreview {
  prev_closing_meter: number | null;
  next_opening_meter: number;
  night_units: number | null;
  night_cost: number | null;
}
