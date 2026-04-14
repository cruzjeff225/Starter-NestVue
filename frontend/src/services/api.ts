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

// Habitaciones
export const habitacionesApi = {
  getAll: (params?: { search?: string; estado?: string; tipoId?: number }) =>
    api.get("/habitaciones", { params }),
  getById: (id: number) => api.get(`/habitaciones/${id}`),
  create: (data: any) => api.post("/habitaciones", data),
  update: (id: number, data: any) => api.patch(`/habitaciones/${id}`, data),
  cambiarEstado: (id: number, estado: string) =>
    api.patch(`/habitaciones/${id}/estado`, { estado }),
  toggleActivo: (id: number) => api.patch(`/habitaciones/${id}/toggle-activo`),
  getDisponibles: (search?: string) =>
    api.get("/habitaciones/disponibles", { params: search ? { search } : {} }),

  // Tipos
  getTipos: () => api.get("/habitaciones/tipos/lista"),
  createTipo: (data: any) => api.post("/habitaciones/tipos", data),
  updateTipo: (id: number, data: any) =>
    api.patch(`/habitaciones/tipos/${id}`, data),
  deleteTipo: (id: number) => api.delete(`/habitaciones/tipos/${id}`),
};

export const reservacionesApi = {
  getAll: (params?: {
    search?: string;
    estado?: string;
    clienteId?: number;
    habitacionId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }) => api.get("/reservaciones", { params }),
  getById: (id: number) => api.get(`/reservaciones/${id}`),
  create: (data: any) => api.post("/reservaciones", data),
  update: (id: number, data: any) => api.patch(`/reservaciones/${id}`, data),
  cambiarEstado: (
    id: number,
    data: { estado: string; motivoCancelacion?: string },
  ) => api.patch(`/reservaciones/${id}/estado`, data),
};

export default api;
