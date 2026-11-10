import type { ReactNode } from 'react';

export function MetricCard({ icon, title, value, context }: { icon: ReactNode; title: string; value: string | number; context: string }) {
  return <section className="metric-card" aria-label={title}><div className="metric-label"><span>{title}</span><span className="metric-icon">{icon}</span></div><p className="metric-value">{value}</p><p className="metric-context">{context}</p></section>;
}
