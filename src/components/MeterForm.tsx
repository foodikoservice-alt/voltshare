import React, { useState } from 'react';
import type { MeterEntry, OpeningMeterFormData } from '../types/app.types';
import { validateOpeningMeter } from '../utils/validators';
import { NightShiftPreview } from './NightShiftPreview';
import { DayShiftCalcPreview } from './DayShiftCalcPreview';
import { OpenDayEntryCard } from './OpenDayEntryCard';
import { EmptyState } from './EmptyState';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface MeterFormProps {
  openDayEntries: MeterEntry[];
  lastClosedDay: MeterEntry | undefined;
  onAddOpeningMeter: (data: OpeningMeterFormData) => Promise<unknown>;
  onAddClosingMeter: (entry: MeterEntry, closingMeter: number) => Promise<void>;
  onError?: (message: string) => void;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  openDayEntries,
  lastClosedDay,
  onAddOpeningMeter,
  onAddClosingMeter,
  onError,
}) => {
  const [tab, setTab] = useState<'opening' | 'closing'>('opening');
  const [loading, setLoading] = useState(false);

  const [openingMeter, setOpeningMeter] = useState('');
  const [isWeekend, setIsWeekend] = useState(false);
  const [notes, setNotes] = useState('');

  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [closingMeter, setClosingMeter] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedEntry = openDayEntries.find(e => e.id === selectedEntryId);

  const clearForm = () => {
    setErrors({});
  };

  const handleOpeningSubmit = async () => {
    clearForm();
    const data: OpeningMeterFormData = { opening_meter: openingMeter, is_weekend: isWeekend, notes };
    const validation = validateOpeningMeter(data);
    if (validation.length > 0) {
      const errMap: Record<string, string> = {};
      validation.forEach(v => { errMap[v.field] = v.message; });
      setErrors(errMap);
      return;
    }

    setLoading(true);
    try {
      await onAddOpeningMeter(data);
      setOpeningMeter('');
      setIsWeekend(false);
      setNotes('');
      setErrors({});
    } catch (err) {
      console.error(err);
      onError?.('Failed to create entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClosingSubmit = async () => {
    if (!selectedEntry) return;
    clearForm();

    if (!closingMeter || isNaN(parseFloat(closingMeter))) {
      setErrors({ closing_meter: 'Closing Meter reading is required' });
      return;
    }
    if (parseFloat(closingMeter) <= selectedEntry.start_meter) {
      setErrors({ closing_meter: `Must be greater than Opening Meter (${selectedEntry.start_meter})` });
      return;
    }

    setLoading(true);
    try {
      await onAddClosingMeter(selectedEntry, parseFloat(closingMeter));
      setSelectedEntryId('');
      setClosingMeter('');
      setErrors({});
    } catch (err) {
      console.error(err);
      onError?.('Failed to close entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <div className="relative flex p-1 bg-surface-container-lowest rounded-2xl mb-4 sm:mb-6">
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-tertiary rounded-xl transition-all duration-300 ease-out shadow-lg shadow-tertiary/25 ${
            tab === 'opening' ? 'left-1' : 'left-[calc(50%+2px)]'
          }`}
        />
        <button
          onClick={() => setTab('opening')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 text-sm font-bold transition-colors duration-300 min-h-[48px] ${
            tab === 'opening' ? 'text-ink' : 'text-muted hover:text-body-strong'
          }`}
        >
          <Plus className="w-4 h-4" />
          Opening Meter
        </button>
        <button
          onClick={() => setTab('closing')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 text-sm font-bold transition-colors duration-300 min-h-[48px] ${
            tab === 'closing' ? 'text-ink' : 'text-muted hover:text-body-strong'
          }`}
        >
          <Check className="w-4 h-4" />
          Closing Meter
          {openDayEntries.length > 0 && (
            <span className={`ml-1.5 px-2 py-0.5 text-[10px] rounded-full font-bold transition-colors ${
              tab === 'closing' ? 'bg-primary/20 text-primary' : 'bg-tertiary/20 text-tertiary'
            }`}>
              {openDayEntries.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'opening' ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
              Opening Meter Reading
            </label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 1280"
              value={openingMeter}
              onChange={e => setOpeningMeter(e.target.value)}
              className={`input-field text-base ${errors.opening_meter ? 'border-error/50' : ''}`}
            />
            {errors.opening_meter && (
              <p className="text-xs text-error flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.opening_meter}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isWeekend}
              onChange={e => setIsWeekend(e.target.checked)}
              className="rounded"
            />
            <span className="text-body-strong font-medium">Weekend mode (all 4 members share costs equally)</span>
          </label>

          {lastClosedDay && (
            <NightShiftPreview
              prevClosingMeter={lastClosedDay.end_meter!}
              nextOpeningMeter={parseFloat(openingMeter) || null}
              isWeekend={isWeekend}
            />
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Initial reading for the day"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <button
            onClick={handleOpeningSubmit}
            disabled={loading}
            className="btn-primary mt-2 active:scale-[0.97]"
          >
            {loading ? 'Saving...' : 'Log Opening Meter'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {openDayEntries.length === 0 ? (
            <EmptyState
              heading="No open Day Shift sessions"
              message="Log an Opening Meter first"
            />
          ) : (
            <>
              <p className="text-xs text-muted font-medium">
                Select the open session to close:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {openDayEntries.map(entry => (
                  <OpenDayEntryCard
                    key={entry.id}
                    entry={entry}
                    selected={selectedEntryId === entry.id}
                    onClick={() => { setSelectedEntryId(entry.id); setClosingMeter(''); }}
                  />
                ))}
              </div>

              {selectedEntry && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                      Closing Meter Reading
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder={`Must be > ${selectedEntry.start_meter}`}
                      value={closingMeter}
                      onChange={e => setClosingMeter(e.target.value)}
                      className={`input-field text-base ${errors.closing_meter ? 'border-error/50' : ''}`}
                      autoFocus
                    />
                    {errors.closing_meter && (
                      <p className="text-xs text-error flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.closing_meter}
                      </p>
                    )}
                  </div>

                  <DayShiftCalcPreview
                    openingMeter={selectedEntry.start_meter}
                    closingMeter={parseFloat(closingMeter) || null}
                    isWeekend={selectedEntry.is_weekend}
                  />

                  <button
                    onClick={handleClosingSubmit}
                    disabled={loading || !closingMeter}
                    className="btn-primary mt-2 active:scale-[0.97]"
                  >
                    {loading ? 'Saving...' : 'Log Closing Meter'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
