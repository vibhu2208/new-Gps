import { User } from '@/types';
import usersData from '@/data/users.json';

export const validateCredentials = (email: string, password: string): User | null => {
  const user = usersData.find(
    (u) => u.email === email && u.password === password
  );
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
  
  return null;
};

export const saveAuthToken = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
};

export const getAuthToken = (): User | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user');
  }
};
