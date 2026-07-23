'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-medium">Abrindo tela de login...</span>
      </div>
    </div>
  );
}
