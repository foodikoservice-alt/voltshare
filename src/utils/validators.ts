import type { OpeningMeterFormData, ClosingMeterFormData, MeterEntry, ValidationError } from '../types/app.types';

export function validateOpeningMeter(data: OpeningMeterFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  const val = parseFloat(data.opening_meter);

  if (data.opening_meter === '' || isNaN(val) || val < 0)
    errors.push({ field: 'opening_meter', message: 'Valid Opening Meter reading is required' });

  return errors;
}

export function validateClosingMeter(data: ClosingMeterFormData, openEntry: MeterEntry): ValidationError[] {
  const errors: ValidationError[] = [];
  const val = parseFloat(data.closing_meter);

  if (data.closing_meter === '' || isNaN(val))
    errors.push({ field: 'closing_meter', message: 'Closing Meter reading is required' });
  else if (val <= openEntry.start_meter)
    errors.push({ field: 'closing_meter', message: `Must be greater than Opening Meter (${openEntry.start_meter})` });

  return errors;
}
