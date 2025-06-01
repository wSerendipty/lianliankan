import { User } from '../types';

const USERS_KEY = 'lianliankan_users';
const CURRENT_SESSION_KEY = 'lianliankan_current_session';

export const getUsers = (): Record<string, User> => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
};

export const saveUsers = (users: Record<string, User>): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (username: string, password: string): boolean => {
  const users = getUsers();
  if (users[username]) {
    return false;
  }

  users[username] = {
    username,
    maxLevel: 1,
    highScores: {},
  };

  saveUsers(users);
  return true;
};

export const loginUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users[username];
  // Since we don't store passwords in the User type, we need to modify this check
  if (user) {
    // 保存登录会话
    saveSession(user);
    return user;
  }
  return null;
};

export const updateUserProgress = (username: string, level: number, score: number): void => {
  const users = getUsers();
  const user = users[username];
  if (user) {
    user.maxLevel = Math.max(user.maxLevel, level);
    user.highScores[level] = Math.max(score, user.highScores[level] || 0);
    saveUsers(users);
    // 更新当前会话中的用户信息
    saveSession(user);
  }
};

// 新增：保存登录会话
export const saveSession = (user: User): void => {
  const session = {
    user,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
  };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
};

// 新增：获取当前会话
export const getCurrentSession = (): User | null => {
  const sessionJson = localStorage.getItem(CURRENT_SESSION_KEY);
  if (!sessionJson) return null;

  const session = JSON.parse(sessionJson);
  if (Date.now() > session.expiresAt) {
    // 会话已过期，清除它
    localStorage.removeItem(CURRENT_SESSION_KEY);
    return null;
  }

  return session.user;
};

// 新增：登出
export const logout = (): void => {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}; 