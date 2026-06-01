import { User } from '@/types';
import usersData from '@/data/users.json';

export const validateCredentials = (emailOrUsername: string, password: string): User | null => {
  const login = emailOrUsername.trim();
  const user = usersData.find(
    (u) =>
      u.password === password &&
      (u.email === login ||
        u.email.toLowerCase() === login.toLowerCase() ||
        ('username' in u && (u as User & { username?: string }).username === login))
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
