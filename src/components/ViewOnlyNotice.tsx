import { Eye } from 'lucide-react';

export function ViewOnlyNotice() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
      <div className="bg-primary/20 p-2 rounded-xl shrink-0">
        <Eye className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium">
        View-only Mode
      </p>
    </div>
  );
}
