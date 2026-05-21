/** Format units with 2 decimal places for billing precision */
export const formatUnits = (n: number) => `${n.toFixed(2)} units`;

/** Format cost in Indian Rupees with proper en-IN locale (lakhs grouping) */
export const formatCost = (n: number) =>
  n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

