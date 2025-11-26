import { z } from 'zod';

// Service Desk Schemas
export const ServiceDeskDimensionSchema = z.object({
  agents: z.number().min(1),
  erlangC: z.number().min(0).max(1),
  serviceLevel: z.number().min(0).max(100),
  averageHandleTime: z.number().min(0),
  callsPerHour: z.number().min(0),
});

// Edital Analysis Schemas
export const EditalAnalysisSchema = z.object({
  fileName: z.string().min(1),
  content: z.string().min(1),
});

// Proposal Schemas
export const ProposalSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

// User Schemas
export const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'viewer']),
});
