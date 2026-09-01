export type UserRole = 'CITIZEN' | 'PATROL_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  firstName: string;
  mobileNumber: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterDTO {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
