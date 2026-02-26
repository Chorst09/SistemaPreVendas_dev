// Common types shared between frontend and backend

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ServiceDeskDimension {
  id: string;
  agents: number;
  erlangC: number;
  serviceLevel: number;
  averageHandleTime: number;
  callsPerHour: number;
}

export interface EditalAnalysis {
  id: string;
  fileName: string;
  content: string;
  analysis: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
}
