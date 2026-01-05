import { API_BASE_URL } from './api';

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
  async getAllUsers(page: number = 1, limit: number = 10): Promise<UsersResponse> {
    const response = await fetch(
      `${API_BASE_URL}/users?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  async changePassword(id: number, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Change password error:', response.status, errorText);
      throw new Error(`Failed to change password: ${response.statusText}`);
    }
  },
};
