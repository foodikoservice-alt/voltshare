import { AuthProvider, useAuthContext } from './context/AuthContext';
import { useMembers } from './hooks/useMembers';
import { useMeterEntries } from './hooks/useMeterEntries';
import { useMemberTotals } from './hooks/useMemberTotals';
import { useToast } from './hooks/useToast';
import { useDarkMode } from './hooks/useDarkMode';
import { calculateGrandTotals } from './utils/calculations';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { MemberCards } from './components/MemberCards';
import { MeterForm } from './components/MeterForm';
import { HistoryTable } from './components/HistoryTable';
import { LoginScreen } from './components/LoginScreen';
import { ViewOnlyNotice } from './components/ViewOnlyNotice';
import { ToastContainer } from './components/Toast';
import { LoadingSpinner } from './components/LoadingSpinner';

function AppContent() {
  const { role, isEditor, login, logout, loading: authLoading } = useAuthContext();
  const { members, loading: membersLoading } = useMembers();
  const { entries, loading: entriesLoading, openDayEntries, lastClosedDay, addOpeningMeter, addClosingMeter, deleteEntry } = useMeterEntries(members);
  const { totals: memberTotals, loading: totalsLoading, refresh: refreshTotals } = useMemberTotals(members);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const { dark, toggle: toggleDark } = useDarkMode();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!role) {
    return <LoginScreen onLogin={login} />;
  }

  const grandTotals = calculateGrandTotals(entries);
  const isLoading = membersLoading || entriesLoading || totalsLoading;

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    showToast('Entry deleted', 'success');
  };

  return (
    <ToastContainer toasts={toasts} onDismiss={dismissToast}>
      <div className="min-h-screen bg-surface text-slate-100 pb-12">
        <Header
          role={role}
          totalUnits={grandTotals.total_units}
          totalCost={grandTotals.total_cost}
          dark={dark}
          onToggleDark={toggleDark}
          onLogout={logout}
        />

        <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">
          {isLoading && entries.length === 0 ? (
            <LoadingSpinner message="Loading electricity data..." />
          ) : (
            <>
              <section>
                <SummaryBar totals={grandTotals} />
              </section>

              {!isEditor && <ViewOnlyNotice />}

              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Members</h2>
                  <span className="text-xs text-slate-500 font-medium">{memberTotals.length} active</span>
                </div>
                <MemberCards memberTotals={memberTotals} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {isEditor && (
                  <section className="lg:col-span-5 space-y-3">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Meter Controls</h2>
                    <MeterForm
                      openDayEntries={openDayEntries}
                      lastClosedDay={lastClosedDay}
                      onAddOpeningMeter={async (data) => {
                        const result = await addOpeningMeter(data);
                        await refreshTotals();
                        if (result?.nightEntryCreated) {
                          showToast(`Opening Meter logged · Night Shift auto-entry created (${result.nightUnits.toFixed(1)} units)`, 'success');
                        } else {
                          showToast('Opening Meter logged successfully', 'success');
                        }
                      }}
                      onAddClosingMeter={async (entry, closingMeter) => {
                        await addClosingMeter(entry, closingMeter);
                        await refreshTotals();
                        showToast('Closing Meter logged & Day Shift usage saved', 'success');
                      }}
                      onError={(msg) => showToast(msg, 'error')}
                    />
                  </section>
                )}

                <section className={`${isEditor ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
                  <HistoryTable
                    entries={entries}
                    role={role}
                    onDelete={handleDelete}
                  />
                </section>
              </div>
            </>
          )}
        </main>

        <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      </div>
    </ToastContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
