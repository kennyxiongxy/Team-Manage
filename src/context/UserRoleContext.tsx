import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'manager' | 'employee';

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  email?: string;
}

interface UserRoleContextType {
  user: UserInfo;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUserInfo: (updates: Partial<UserInfo>) => void;
  isManager: boolean;
  isEmployee: boolean;
  loading: boolean;
}

const defaultManager: UserInfo = {
  id: 'm1',
  name: '管理者',
  role: 'manager',
  avatar: '',
  department: '管理层',
};

const defaultEmployee: UserInfo = {
  id: 'e1',
  name: '员工',
  role: 'employee',
  avatar: '',
  department: '',
};

const UserRoleContext = createContext<UserRoleContextType | null>(null);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo>(defaultManager);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as UserInfo;
        setToken(storedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserInfo) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(defaultManager);
  };

  const switchRole = (role: UserRole) => {
    const next = role === 'manager' ? defaultManager : defaultEmployee;
    setUser(next);
    if (token) {
      localStorage.setItem('user', JSON.stringify(next));
    }
  };

  const updateUserInfo = (updates: Partial<UserInfo>) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      if (token) {
        localStorage.setItem('user', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <UserRoleContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        switchRole,
        updateUserInfo,
        isManager: user.role === 'manager',
        isEmployee: user.role === 'employee',
        loading,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRole must be used within UserRoleProvider');
  return ctx;
}
