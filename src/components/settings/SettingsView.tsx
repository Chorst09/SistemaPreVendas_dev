"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUploader } from '@/components/ui/logo-uploader';
import { useLogo } from '@/hooks/use-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Image, Palette, User, ShieldCheck, Plus, Save, Trash2, X, Lock, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { SystemUser, UserAuthService, UserRole } from '@/lib/services/user-auth-service';
import { MODULE_DEFINITIONS, getModulesByCategory, ALL_MODULE_IDS } from '@/lib/modules';

interface SettingsViewProps {
  currentUser?: SystemUser | null;
}

const emptyUserForm = {
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole,
  active: true,
  permissions: [] as string[],
};

export function SettingsView({ currentUser }: SettingsViewProps) {
  const { logoSrc, updateLogo } = useLogo();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [feedback, setFeedback] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const isAdmin = currentUser?.role === 'admin';
  const modulesByCategory = useMemo(() => getModulesByCategory(), []);

  useEffect(() => {
    setUsers(UserAuthService.ensureDefaultUsers());
  }, []);

  const resetUserForm = (clearFeedback = true) => {
    setUserForm(emptyUserForm);
    if (clearFeedback) setFeedback('');
  };

  const handleEditUser = (user: SystemUser) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.active,
      permissions: user.permissions || [],
    });
    setFeedback('');
  };

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setFeedback('Preencha nome, e-mail e senha.');
      return;
    }

    try {
      const user: SystemUser = {
        id: userForm.id || `user-${Date.now()}`,
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password,
        role: userForm.role,
        active: userForm.active,
        permissions: userForm.role === 'admin' ? [] : userForm.permissions,
        createdAt: users.find((item) => item.id === userForm.id)?.createdAt || new Date().toISOString(),
      };

      const next = UserAuthService.upsertUser(user);
      setUsers(next);
      setFeedback('Usuário salvo com sucesso.');
      resetUserForm(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao salvar usuário.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    try {
      const next = UserAuthService.deleteUser(userId);
      setUsers(next);
      setFeedback('Usuário removido.');
      if (userForm.id === userId) resetUserForm();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao remover usuário.');
    }
  };

  const toggleModulePermission = (moduleId: string) => {
    setUserForm((prev) => {
      const has = prev.permissions.includes(moduleId);
      return {
        ...prev,
        permissions: has ? prev.permissions.filter((id) => id !== moduleId) : [...prev.permissions, moduleId],
      };
    });
  };

  const toggleCategoryModules = (categoryModules: { id: string }[]) => {
    setUserForm((prev) => {
      const allIds = categoryModules.map((m) => m.id);
      const allSelected = allIds.every((id) => prev.permissions.includes(id));
      return {
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter((id) => !allIds.includes(id))
          : [...new Set([...prev.permissions, ...allIds])],
      };
    });
  };

  const toggleAllModules = () => {
    setUserForm((prev) => {
      const allSelected = ALL_MODULE_IDS.every((id) => prev.permissions.includes(id));
      return { ...prev, permissions: allSelected ? [] : [...ALL_MODULE_IDS] };
    });
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getModuleCount = (permissions: string[]) => {
    return permissions.filter((id) => ALL_MODULE_IDS.includes(id)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize a aparência, usuários e permissões do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Aparência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Image className="h-5 w-5" />
                <span>Logo da Empresa</span>
              </h3>
              <LogoUploader currentLogo={logoSrc} onLogoChange={updateLogo} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Usuários e Acessos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isAdmin ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Apenas usuários administradores podem gerenciar acessos.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do usuário" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="usuario@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Senha de acesso" />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil de Acesso</Label>
                    <Select value={userForm.role} onValueChange={(v: UserRole) => setUserForm((p) => ({ ...p, role: v, permissions: v === 'admin' ? [] : p.permissions }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Administrador</span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Usuário</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {userForm.role === 'admin' ? 'Acesso total a todos os módulos do sistema.' : 'Acesso restrito aos módulos selecionados abaixo.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={userForm.active ? 'active' : 'inactive'} onValueChange={(v) => setUserForm((p) => ({ ...p, active: v === 'active' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {userForm.role === 'user' && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Permissões de Módulos</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={toggleAllModules} type="button">
                        {ALL_MODULE_IDS.every((id) => userForm.permissions.includes(id)) ? 'Desmarcar Todos' : 'Marcar Todos'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selecione os módulos que este usuário poderá acessar. Módulos não marcados ficarão ocultos na barra lateral.
                    </p>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {Object.entries(modulesByCategory).map(([category, modules]) => {
                        const catIds = modules.flatMap((m) => [m.id, ...(m.subModules?.map((s) => s.id) || [])]);
                        const catSelected = catIds.filter((id) => userForm.permissions.includes(id)).length;
                        const catOpen = openCategories[category] ?? false;

                        return (
                          <div key={category} className="rounded-md border bg-background/80">
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {catOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <span>{category}</span>
                                <Badge variant="secondary" className="text-xs">{catSelected}/{catIds.length}</Badge>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleCategoryModules(modules.flatMap((m) => [m.id, ...(m.subModules?.map((s) => s.id) || [])])); }}
                                className="text-xs text-primary hover:underline"
                              >
                                {catSelected === catIds.length ? 'Desmarcar' : 'Marcar'}
                              </button>
                            </button>
                            {catOpen && (
                              <div className="border-t px-3 py-2 space-y-1">
                                {modules.map((mod) => (
                                  <div key={mod.id}>
                                    <label className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-muted/20 rounded px-1">
                                      {userForm.permissions.includes(mod.id) ? (
                                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                      ) : (
                                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={userForm.permissions.includes(mod.id)}
                                        onChange={() => toggleModulePermission(mod.id)}
                                      />
                                      <span>{mod.label}</span>
                                    </label>
                                    {mod.subModules && (
                                      <div className="ml-6 space-y-0.5">
                                        {mod.subModules.map((sub) => (
                                          <label key={sub.id} className="flex items-center gap-2 py-0.5 text-xs cursor-pointer hover:bg-muted/20 rounded px-1 text-muted-foreground">
                                            {userForm.permissions.includes(sub.id) ? (
                                              <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                            ) : (
                                              <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            )}
                                            <input
                                              type="checkbox"
                                              className="sr-only"
                                              checked={userForm.permissions.includes(sub.id)}
                                              onChange={() => toggleModulePermission(sub.id)}
                                            />
                                            <span>{sub.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">
                      <strong>{userForm.permissions.length}</strong> de <strong>{ALL_MODULE_IDS.length}</strong> módulos selecionados
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveUser}>
                    {userForm.id ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {userForm.id ? 'Salvar Alterações' : 'Adicionar Usuário'}
                  </Button>
                  {userForm.id && (
                    <Button variant="outline" onClick={resetUserForm}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar edição
                    </Button>
                  )}
                </div>

                {feedback && (
                  <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">{feedback}</div>
                )}

                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{user.name}</p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                          <Badge variant={user.active ? 'secondary' : 'destructive'}>
                            {user.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {user.role === 'user' && user.permissions && user.permissions.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getModuleCount(user.permissions)} módulos
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.role === 'user' && user.permissions && user.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.permissions.slice(0, 5).map((p) => (
                              <span key={p} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p}</span>
                            ))}
                            {user.permissions.length > 5 && (
                              <span className="text-[10px] text-muted-foreground">+{user.permissions.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)} disabled={user.email === 'chorstconsult@gmail.com'}>
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Usuário atual</p>
                  <p className="text-muted-foreground">{currentUser?.email || 'Não identificado'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Perfil: <span className="font-medium">{currentUser?.role === 'admin' ? 'Administrador (acesso total)' : 'Usuário (acesso restrito)'}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-muted-foreground">Versão</p>
              <p>1.0.0</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Última Atualização</p>
              <p>{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Desenvolvido por</p>
              <p>Chorst Consultoria</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
