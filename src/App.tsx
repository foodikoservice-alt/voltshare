import { useState } from 'react';
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
import { LoginModal } from './components/LoginModal';
import { ViewOnlyNotice } from './components/ViewOnlyNotice';
import { Charts } from './components/Charts';
import { ToastContainer } from './components/Toast';
import { LoadingSpinner } from './components/LoadingSpinner';

function AppContent() {
  const { role, isEditor, login, logout, loading: authLoading } = useAuthContext();
  const { members, loading: membersLoading } = useMembers();
  const { entries, loading: entriesLoading, openDayEntries, lastClosedDay, addOpeningMeter, addClosingMeter, deleteEntry } = useMeterEntries(members);
  const { totals: memberTotals, loading: totalsLoading, refresh: refreshTotals } = useMemberTotals(members);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const grandTotals = calculateGrandTotals(entries);
  const isLoading = membersLoading || entriesLoading || totalsLoading || authLoading;

  const handleLogin = async (username: string, passcode: string) => {
    const success = await login(username, passcode);
    if (success) {
      setShowLoginModal(false);
      showToast('Signed in as editor', 'success');
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    showToast('Entry deleted', 'success');
  };

  return (
    <ToastContainer toasts={toasts} onDismiss={dismissToast}>
      <div className="min-h-screen bg-surface text-body pb-12">
        <Header
          role={role}
          totalUnits={grandTotals.total_units}
          totalCost={grandTotals.total_cost}
          dark={dark}
          onToggleDark={toggleDark}
          onLogout={handleLogout}
          onEditorLogin={() => setShowLoginModal(true)}
        />

        <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">
          {isLoading && entries.length === 0 ? (
            <LoadingSpinner message="Loading electricity data..." />
          ) : (
            <>
              <section>
                <SummaryBar totals={grandTotals} />
              </section>

              <Charts members={members} />

              {!isEditor && <ViewOnlyNotice />}

              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-muted uppercase tracking-widest">Members</h2>
                  <span className="text-xs text-muted font-medium">{memberTotals.length} active</span>
                </div>
                <MemberCards memberTotals={memberTotals} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {isEditor && (
                  <section className="lg:col-span-5 space-y-3">
                    <h2 className="text-sm font-bold text-muted uppercase tracking-widest px-1">Meter Controls</h2>
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

      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
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
