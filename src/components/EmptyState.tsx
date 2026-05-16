import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: typeof Inbox;
  heading?: string;
  message?: string;
}

export function EmptyState({ icon: Icon = Inbox, heading = 'Nothing here', message = '' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 border border-white/5">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-300">{heading}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-xs">{message}</p>}
    </div>
  );
}
