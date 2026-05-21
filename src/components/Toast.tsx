import { type ReactNode } from 'react';
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
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-300 ${
        toast.type === 'success'
          ? 'bg-success/90 border-success/50 text-on-primary'
          : 'bg-error/90 border-error/50 text-on-primary'
      }`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="w-5 h-5 shrink-0 text-on-primary" />
        : <XCircle className="w-5 h-5 shrink-0 text-on-primary" />
      }
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="p-1 hover:bg-ink/10 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
