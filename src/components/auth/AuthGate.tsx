"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserAuthService } from '@/lib/services/user-auth-service';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = UserAuthService.getCurrentUser();
    setAllowed(Boolean(user));
    setChecked(true);

    if (!user) {
      router.replace('/');
    }
  }, [router]);

  if (!checked || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">Validando acesso...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
