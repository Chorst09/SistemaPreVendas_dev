export type UserRole = 'admin' | 'user';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  permissions?: string[];
  createdAt: string;
}

const USERS_STORAGE_KEY = 'sistema-pre-users-v2';
const SESSION_STORAGE_KEY = 'sistema-pre-current-user-v2';

const ADMIN_EMAIL = 'chorstconsult@gmail.com';
const ADMIN_PASSWORD = 'Double@2026';

function createAdminUser(): SystemUser {
  return {
    id: 'admin-chorstconsult',
    name: 'Administrador Chorst',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    active: true,
    permissions: [],
    createdAt: new Date().toISOString(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function migrateUsersIfNeeded(users: SystemUser[]): SystemUser[] {
  let changed = false;
  const migrated = users.map((u) => {
    if (u.permissions === undefined) {
      changed = true;
      return { ...u, permissions: u.role === 'admin' ? [] : [] };
    }
    return u;
  });
  if (changed) return migrated;
  return users;
}

export class UserAuthService {
  static ensureDefaultUsers(): SystemUser[] {
    if (typeof window === 'undefined') return [createAdminUser()];

    const raw = this.getRawUsers();
    const users = migrateUsersIfNeeded(raw);
    const adminIndex = users.findIndex((user) => normalizeEmail(user.email) === ADMIN_EMAIL);

    if (adminIndex >= 0) {
      const next = [...users];
      next[adminIndex] = {
        ...next[adminIndex],
        name: next[adminIndex].name || 'Administrador Chorst',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        active: true,
        permissions: [],
      };
      this.saveUsers(next);
      return next;
    }

    const next = [createAdminUser(), ...users];
    this.saveUsers(next);
    return next;
  }

  private static getRawUsers(): SystemUser[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        const legacy = window.localStorage.getItem('sistema-pre-users-v1');
        if (legacy) {
          window.localStorage.setItem(USERS_STORAGE_KEY, legacy);
          window.localStorage.removeItem('sistema-pre-users-v1');
          const parsed = JSON.parse(legacy);
          return Array.isArray(parsed) ? parsed : [];
        }
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
  }

  static getUsers(ensureDefault = true): SystemUser[] {
    const users = this.getRawUsers();
    return ensureDefault ? this.ensureUsersIncludeAdmin(users) : users;
  }

  static saveUsers(users: SystemUser[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  static login(email: string, password: string): SystemUser | null {
    const users = this.ensureDefaultUsers();
    const normalizedEmail = normalizeEmail(email);
    const user = users.find(
      (item) => normalizeEmail(item.email) === normalizedEmail && item.password === password && item.active
    );

    if (!user) return null;

    this.setCurrentUser(user);
    return user;
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  static getCurrentUser(): SystemUser | null {
    if (typeof window === 'undefined') return null;

    try {
      this.ensureDefaultUsers();
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;

      const sessionUser = JSON.parse(stored) as SystemUser;
      const users = this.getUsers();
      const current = users.find((user) => user.id === sessionUser.id && user.active);
      return current || null;
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      return null;
    }
  }

  static setCurrentUser(user: SystemUser): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }

  static hasPermission(user: SystemUser | null, moduleId: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(moduleId);
  }

  static canAccessModule(user: SystemUser | null, moduleId: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return this.hasPermission(user, moduleId);
  }

  static upsertUser(user: SystemUser): SystemUser[] {
    const users = this.ensureDefaultUsers();
    const normalizedEmail = normalizeEmail(user.email);
    const duplicate = users.find(
      (item) => normalizeEmail(item.email) === normalizedEmail && item.id !== user.id
    );

    if (duplicate) {
      throw new Error('Já existe um usuário com este e-mail.');
    }

    const nextUser = {
      ...user,
      email: normalizedEmail,
      permissions: user.permissions || [],
    };
    const index = users.findIndex((item) => item.id === user.id);
    const next = [...users];

    if (index >= 0) {
      next[index] = nextUser;
    } else {
      next.push(nextUser);
    }

    this.saveUsers(next);
    return next;
  }

  static deleteUser(userId: string): SystemUser[] {
    const users = this.ensureDefaultUsers();
    const user = users.find((item) => item.id === userId);

    if (user?.role === 'admin' && normalizeEmail(user.email) === ADMIN_EMAIL) {
      throw new Error('O usuário admin padrão não pode ser excluído.');
    }

    const next = users.filter((item) => item.id !== userId);
    this.saveUsers(next);
    return next;
  }

  private static ensureUsersIncludeAdmin(users: SystemUser[]): SystemUser[] {
    const admin = users.find((user) => normalizeEmail(user.email) === ADMIN_EMAIL);
    if (admin?.role === 'admin' && admin.active) return users;

    const next = admin
      ? users.map((user) =>
          normalizeEmail(user.email) === ADMIN_EMAIL
            ? { ...user, password: ADMIN_PASSWORD, role: 'admin' as const, active: true, permissions: [] }
            : user
        )
      : [createAdminUser(), ...users];

    this.saveUsers(next);
    return next;
  }
}
