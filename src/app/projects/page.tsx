'use client';

import ProjectManagementApp from '@/components/project-management/App';
import { AuthGate } from '@/components/auth/AuthGate';

export default function ProjectsPage() {
    return (
        <AuthGate>
            <ProjectManagementApp onBack={() => window.location.href = '/'} />
        </AuthGate>
    );
}
