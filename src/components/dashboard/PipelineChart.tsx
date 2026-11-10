import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/dashboard';

export function PipelineChart({ data }: { data: { name: string; value: number; amount: number }[] }) {
  const max = Math.max(1, ...data.map(item => item.value));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return <Card className="h-full min-w-0"><CardHeader><CardTitle>Carteira por status</CardTitle><CardDescription>Quantidade de orçamentos criados no período</CardDescription></CardHeader><CardContent><div className="status-chart">{data.map(item => <div key={item.name}><div className="status-chart-label"><span>{item.name}</span><strong>{item.value}<span> · {formatMoney(item.amount)}</span></strong></div><div className="status-chart-track" role="img" aria-label={`${item.name}: ${item.value} orçamento(s), ${formatMoney(item.amount)}`}><span style={{ width: `${item.value / max * 100}%` }} /></div></div>)}</div>{!total && <p className="mt-4 text-xs text-muted-foreground">Nenhum registro neste intervalo.</p>}</CardContent></Card>;
}
