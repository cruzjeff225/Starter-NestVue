import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Agrega el token automáticamente en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clientes
export const clientesApi = {
  getAll: (search?: string) =>
    api.get("/clientes", { params: search ? { search } : {} }),
  getById: (id: number) => api.get(`/clientes/${id}`),
  create: (data: any) => api.post("/clientes", data),
  update: (id: number, data: any) => api.patch(`/clientes/${id}`, data),
  toggleActivo: (id: number) => api.patch(`/clientes/${id}/toggle-activo`),
};

export default api;
