import { apiFetch } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'IT' | 'ADMIN';
  department?: string;
  phoneNumber?: string;
  lineId?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tickets: number;
    assigned: number;
  };
}

export interface UsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  async getAllUsers(params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<UsersResponse> {
    const { page = 1, limit = 10, search, role } = params;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) query.append('search', search);
    if (role && role !== 'all') query.append('role', role);

    return apiFetch(`/users?${query.toString()}`);
  },

  async getUserById(id: number): Promise<User> {
    return apiFetch(`/users/${id}`);
  },

  async createUser(data: Partial<User>): Promise<User> {
    return apiFetch('/users', 'POST', data);
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return apiFetch(`/users/${id}`, 'PUT', data);
  },

  async deleteUser(id: number): Promise<void> {
    return apiFetch(`/users/${id}`, 'DELETE');
  },

  async searchUsers(query: string): Promise<User[]> {
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async changePassword(id: number, newPassword: string): Promise<void> {
    return apiFetch(`/users/${id}/change-password`, 'POST', { newPassword });
  },
};
