import { Eye } from 'lucide-react';

export function ViewOnlyNotice() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
      <div className="bg-blue-500/20 p-2 rounded-xl shrink-0">
        <Eye className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium">
        View-only access — contact an editor to add or remove entries.
      </p>
    </div>
  );
}
