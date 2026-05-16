import { useEffect, type ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  children?: ReactNode;
}

export function ToastContainer({ toasts, onDismiss, children }: ToastContainerProps) {
  return (
    <>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-300 ${
        toast.type === 'success'
          ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-200'
          : 'bg-rose-900/90 border-rose-700/50 text-rose-200'
      }`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
        : <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
      }
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
