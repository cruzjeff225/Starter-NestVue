import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

export const getRooms = () => api.get('/rooms')

export const createRoom = (data: any) => api.post('/rooms', data)

export const updateRoom = (id: string, data: any) =>
  api.patch(`/rooms/${id}`, data)

export const deleteRoom = (id: string) =>
  api.delete(`/rooms/${id}`)