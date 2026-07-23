import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTabModule } from '../DataTabModule';
import { CoverageType, ProjectData, ServiceType } from '@/lib/types/service-desk-pricing';

const createProjectData = (coverageType: CoverageType): ProjectData => ({
  id: 'project-test',
  name: 'Projeto Teste',
  client: {
    name: 'Cliente Teste',
    document: '00.000.000/0001-00',
    email: 'cliente@teste.com',
    phone: '(11) 99999-9999',
    address: {
      street: 'Rua Teste',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '00000-000',
      country: 'Brasil'
    },
    contactPerson: 'Contato Teste'
  },
  contractPeriod: {
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    durationMonths: 12,
    renewalOptions: []
  },
  description: 'Teste',
  currency: 'BRL',
  location: 'Sao Paulo',
  serviceType: ServiceType.STANDARD,
  additionalServices: {
    needsSoftware: false,
    needs0800: false,
    needsDirectCall: false,
    needsInfrastructure: false
  },
  generalInfo: {
    userQuantity: 1003,
    monthlyCalls: 1505
  },
  dimensioning: {
    incidentsPerUser: 1.5,
    tmaMinutes: 10,
    occupancyRate: 80,
    n1Distribution: 80,
    n1Capacity: 100,
    n1Capacity6h: 75,
    n2Capacity: 75,
    n1SixHourShift: false,
    coverageType,
    suggestedN1: 0,
    suggestedN2: 0
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
});

describe('DataTabModule coverage dimensioning', () => {
  it('increases N1 when coverage changes from 8x5 to 24x7', async () => {
    const user = userEvent.setup();
    const onDimensionTeam = vi.fn();
    const onUpdate = vi.fn();
    const onAutoSave = vi.fn();

    const { rerender } = render(
      <DataTabModule
        data={createProjectData(CoverageType.BUSINESS_HOURS)}
        onUpdate={onUpdate}
        onAutoSave={onAutoSave}
        onDimensionTeam={onDimensionTeam}
      />
    );

    await user.click(screen.getByRole('button', { name: /dimensionar equipe/i }));
    const firstCallTeam = onDimensionTeam.mock.calls[0][1] as Array<{ jobPositionId: string; quantity: number }>;
    const n1BusinessHours = firstCallTeam.find((member) => member.jobPositionId === 'pos-1')?.quantity ?? 0;

    rerender(
      <DataTabModule
        data={createProjectData(CoverageType.FULL_TIME)}
        onUpdate={onUpdate}
        onAutoSave={onAutoSave}
        onDimensionTeam={onDimensionTeam}
      />
    );

    await user.click(screen.getByRole('button', { name: /dimensionar equipe/i }));
    const secondCallTeam = onDimensionTeam.mock.calls[1][1] as Array<{ jobPositionId: string; quantity: number }>;
    const n124x7 = secondCallTeam.find((member) => member.jobPositionId === 'pos-1')?.quantity ?? 0;

    expect(n1BusinessHours).toBeGreaterThan(0);
    expect(n124x7).toBeGreaterThan(n1BusinessHours);
  });

  it('adds reserve staff (folguista) into N1 when coverage is 24x7', async () => {
    const user = userEvent.setup();
    const onDimensionTeam = vi.fn();

    render(
      <DataTabModule
        data={createProjectData(CoverageType.FULL_TIME)}
        onUpdate={vi.fn()}
        onAutoSave={vi.fn()}
        onDimensionTeam={onDimensionTeam}
      />
    );

    await user.click(screen.getByRole('button', { name: /dimensionar equipe/i }));
    const updatedProject = onDimensionTeam.mock.calls[0][0] as ProjectData;
    const dimensionedTeam = onDimensionTeam.mock.calls[0][1] as Array<{ jobPositionId: string; notes?: string }>;
    const n1Entry = dimensionedTeam.find((member) => member.jobPositionId === 'pos-1');

    expect(updatedProject.dimensioning?.suggestedFolguistas).toBeGreaterThan(0);
    expect(n1Entry?.notes || '').toContain('folguistas');
  });

  it('generates scale assignments using real dimensioned team member ids', async () => {
    const user = userEvent.setup();
    const onDimensionTeam = vi.fn();

    render(
      <DataTabModule
        data={createProjectData(CoverageType.BUSINESS_HOURS)}
        onUpdate={vi.fn()}
        onAutoSave={vi.fn()}
        onDimensionTeam={onDimensionTeam}
      />
    );

    await user.click(screen.getByRole('button', { name: /dimensionar equipe/i }));

    const dimensionedTeam = onDimensionTeam.mock.calls[0][1] as Array<{ jobPositionId: string; id: string; quantity: number }>;
    const schedules = onDimensionTeam.mock.calls[0][2] as Array<{ shifts: Array<{ teamMembers: string[] }> }>;
    const n1Entry = dimensionedTeam.find((member) => member.jobPositionId === 'pos-1');
    const n2Entry = dimensionedTeam.find((member) => member.jobPositionId === 'pos-2');
    const assignedIds = schedules.flatMap((schedule) => schedule.shifts.flatMap((shift) => shift.teamMembers));

    expect(assignedIds).not.toContain('n1-agent-1');
    expect(assignedIds).toContain(`${n1Entry?.id}-0`);
    expect(assignedIds).toContain(`${n2Entry?.id}-0`);
  });
});
