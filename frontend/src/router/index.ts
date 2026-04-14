import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../views/LoginView.vue") },
    { path: "/register", component: () => import("../views/RegisterView.vue") },
    {
      path: "/",
      component: () => import("../layouts/MainLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", component: () => import("../views/DashboardView.vue") },
        {
          path: "admin/users",
          component: () => import("../views/admin/UsersView.vue"),
          meta: { requiresRole: "admin" },
        },
        {
          path: "/admin/roles-permisos",
          component: () => import("../views/admin/RolesPermisosView.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "/admin/clientes",
          name: "Clientes",
          component: () => import("../views/admin/ClientesView.vue"),
          meta: { requiresAuth: true, permiso: "clientes:leer" },
        },
        {
          path: "/admin/habitaciones",
          name: "Habitaciones",
          component: () => import("../views/admin/HabitacionesView.vue"),
          meta: { requiresAuth: true, permiso: "habitaciones:leer" },
        },
        {
          path: "/admin/reservaciones",
          name: "Reservaciones",
          component: () => import("../views/admin/ReservacionesView.vue"),
          meta: { requiresAuth: true, permiso: "reservaciones:leer" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) return "/login";
  if (to.meta.requiresRole === "admin" && !auth.isAdmin) return "/";
});

export default router;
