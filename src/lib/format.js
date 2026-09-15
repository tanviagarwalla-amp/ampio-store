export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const clock = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const titleCase = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
