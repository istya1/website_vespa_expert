// src/services/bengkel-service.ts
import ApiService from './api-service';

const BengkelService = {
  getAll: async () => {
    return await ApiService.get('/bengkel');
  },

  getById: async (id: number) => {
    return await ApiService.get(`/bengkel/${id}`);
  },

  create: async (data: FormData) => {
    return await ApiService.post('/bengkel', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: async (id: number, data: FormData) => {
    return await ApiService.post(`/bengkel/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: async (id: number) => {
    return await ApiService.delete(`/bengkel/${id}`);
  },
};

export default BengkelService;