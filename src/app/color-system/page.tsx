import { ColorSystemShowcase } from '@/components/examples/color-system-showcase';
import { AuthGate } from '@/components/auth/AuthGate';

export default function ColorSystemPage() {
  return (
    <AuthGate>
      <ColorSystemShowcase />
    </AuthGate>
  );
}

export const metadata = {
  title: 'Sistema de Cores - Pre-Sales Ally',
  description: 'Showcase completo do sistema de cores e componentes da aplicação',
};
