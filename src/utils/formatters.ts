export const formatUnits = (n: number) => `${n.toFixed(1)} units`;
export const formatCost  = (n: number) => `₹${n.toFixed(2)}`;

export const formatDate  = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

export const formatDateShort = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export const formatTimestamp = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: '2-digit',
    month: 'short'
  });

