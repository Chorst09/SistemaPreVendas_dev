import React, { useEffect, useMemo, useState } from 'react';
import { mockUsers } from '../data';
import {
  Mail, MoreHorizontal, Search, UserPlus, Shield, Activity, Users,
  Send, X, CheckCircle2, Settings, Copy, AtSign, Building2
} from 'lucide-react';

type EmailProvider = 'Gmail' | 'Google Workspace' | 'Outlook' | 'Microsoft 365' | 'Zoho Mail' | 'SMTP proprio';
type TeamRole = 'Admin' | 'Gerente' | 'Membro' | 'Convidado';

interface TeamInvite {
  id: string;
  emails: string[];
  provider: EmailProvider;
  role: TeamRole;
  message: string;
  status: 'Pendente' | 'Enviado';
  createdAt: string;
}

const providerOptions: Array<{
  name: EmailProvider;
  description: string;
  accent: string;
}> = [
  { name: 'Gmail', description: 'Conta Google individual', accent: '#ff7a00' },
  { name: 'Google Workspace', description: 'Domínio corporativo Google', accent: '#22c55e' },
  { name: 'Outlook', description: 'Conta Microsoft pessoal', accent: '#18c8df' },
  { name: 'Microsoft 365', description: 'Tenant corporativo Microsoft', accent: '#3b82f6' },
  { name: 'Zoho Mail', description: 'Conta Zoho corporativa', accent: '#f6b40b' },
  { name: 'SMTP proprio', description: 'Servidor de e-mail configurável', accent: '#a855f7' }
];

const defaultInviteMessage = 'Voce foi convidado para participar da equipe do projeto no Nexos.';

function parseEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function TeamView() {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [provider, setProvider] = useState<EmailProvider>('Google Workspace');
  const [role, setRole] = useState<TeamRole>('Membro');
  const [message, setMessage] = useState(defaultInviteMessage);
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<TeamInvite[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('pm_team_invites_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pm_team_invites_v1', JSON.stringify(invites));
  }, [invites]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mockUsers;
    return mockUsers.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  }, [search]);

  const selectedProvider = providerOptions.find(item => item.name === provider) || providerOptions[0];
  const pendingInvites = invites.filter(invite => invite.status === 'Pendente').length;
  const parsedEmails = parseEmails(inviteEmails);
  const inviteLink = `https://nexos.chorstconsult.com.br/projetos?invite=${encodeURIComponent(provider)}&role=${encodeURIComponent(role)}`;

  const resetInvite = () => {
    setInviteEmails('');
    setProvider('Google Workspace');
    setRole('Membro');
    setMessage(defaultInviteMessage);
    setInviteError('');
    setCopied(false);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    resetInvite();
  };

  const sendInvite = () => {
    const invalidEmails = parsedEmails.filter(email => !isValidEmail(email));

    if (parsedEmails.length === 0) {
      setInviteError('Informe ao menos um e-mail para enviar o convite.');
      return;
    }

    if (invalidEmails.length > 0) {
      setInviteError(`Revise estes e-mails: ${invalidEmails.join(', ')}`);
      return;
    }

    const nextInvite: TeamInvite = {
      id: `invite-${Date.now()}`,
      emails: parsedEmails,
      provider,
      role,
      message,
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };

    setInvites(prev => [nextInvite, ...prev]);
    window.location.href = `mailto:${parsedEmails.join(',')}?subject=${encodeURIComponent('Convite para equipe do projeto')}&body=${encodeURIComponent(`${message}\n\nAcesse: ${inviteLink}`)}`;
    closeInvite();
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setInviteError('Nao foi possivel copiar o link automaticamente.');
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto p-8 text-foreground custom-scrollbar">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Equipe do Projeto
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar membro..."
                className="bg-card border border-border text-sm text-foreground rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-primary w-64"
              />
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary hover:text-primary-foreground px-4 py-1.5 rounded-md transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" /> Convidar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[linear-gradient(140deg,rgba(255,122,0,0.15),rgba(17,24,39,0.98))] border border-border rounded-md p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="text-muted-foreground text-sm font-medium">Membros Totais</div>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{mockUsers.length}</div>
          </div>
          <div className="bg-[linear-gradient(140deg,rgba(34,197,94,0.14),rgba(17,24,39,0.98))] border border-border rounded-md p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="text-muted-foreground text-sm font-medium">Ativos Agora</div>
              <Activity className="w-4 h-4 text-accent-green" />
            </div>
            <div className="text-2xl font-bold text-foreground">2</div>
          </div>
          <div className="bg-[linear-gradient(140deg,rgba(246,180,11,0.14),rgba(17,24,39,0.98))] border border-border rounded-md p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="text-muted-foreground text-sm font-medium">Convites Pendentes</div>
              <Mail className="w-4 h-4 text-accent-yellow" />
            </div>
            <div className="text-2xl font-bold text-foreground">{pendingInvites}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground bg-card">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Membro</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Função</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Último Acesso</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1423]">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-muted transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-foreground shadow-inner ${user.color}`}>
                          {user.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 w-fit">
                        {user.role === 'Admin' && <Shield className="w-3 h-3 text-accent-green" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${idx < 2 ? 'bg-accent-green' : 'bg-slate-600'}`}></span>
                        <span className="text-foreground text-xs">{idx < 2 ? 'Online' : 'Offline'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                      {idx === 0 ? 'Agora mesmo' : idx === 1 ? 'Há 5 min' : 'Há 2 dias'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
            <div className="rounded-md border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Integrações de e-mail</h2>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {providerOptions.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setProvider(item.name);
                      setInviteOpen(true);
                    }}
                    className="w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.accent, boxShadow: `0 0 12px ${item.accent}88` }} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Convites recentes</h2>
                <Mail className="h-4 w-4 text-accent-yellow" />
              </div>
              <div className="space-y-3">
                {invites.slice(0, 5).map(invite => (
                  <div key={invite.id} className="rounded-md border border-border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{invite.provider}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(invite.createdAt)}</span>
                    </div>
                    <p className="truncate text-xs font-semibold text-foreground">{invite.emails.join(', ')}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{invite.role} · {invite.status}</p>
                  </div>
                ))}
                {invites.length === 0 && (
                  <div className="rounded-md border border-dashed border-border bg-background p-5 text-center text-sm text-muted-foreground">
                    Nenhum convite enviado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
            <div className="relative border-b border-border bg-[radial-gradient(circle_at_15%_0%,rgba(255,122,0,0.24),transparent_30%),linear-gradient(120deg,#111827,#070b16)] px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Send className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-accent-green/40 bg-accent-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-green">
                      Convite de equipe
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">Enviar convite</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Selecione o provedor, defina permissões e envie para um ou vários e-mails.</p>
                </div>
                <button onClick={closeInvite} className="rounded-md border border-border p-2 text-muted-foreground hover:border-primary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-6">
              {inviteError && (
                <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                  {inviteError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><AtSign className="h-4 w-4" /> Provedor</span>
                  <select value={provider} onChange={(e) => setProvider(e.target.value as EmailProvider)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                    {providerOptions.map(item => <option key={item.name}>{item.name}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Shield className="h-4 w-4" /> Permissão</span>
                  <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                    <option>Admin</option>
                    <option>Gerente</option>
                    <option>Membro</option>
                    <option>Convidado</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Mail className="h-4 w-4" /> E-mails</span>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => {
                    setInviteEmails(e.target.value);
                    setInviteError('');
                  }}
                  placeholder="ana@empresa.com; joao@empresa.com"
                  className="min-h-[88px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Building2 className="h-4 w-4" /> Mensagem</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[96px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </label>

              <div className="rounded-md border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedProvider.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedProvider.description}</p>
                  </div>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedProvider.accent }} />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{inviteLink}</p>
                  <button onClick={copyInviteLink} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent-yellow">
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
              <button onClick={closeInvite} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground">
                Cancelar
              </button>
              <button onClick={sendInvite} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Send className="h-4 w-4" /> Enviar convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
