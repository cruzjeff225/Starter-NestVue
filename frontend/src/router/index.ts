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
          meta: { permiso: "usuarios:leer" },
        },
        {
          path: "/admin/roles-permisos",
          component: () => import("../views/admin/RolesPermisosView.vue"),
          meta: { permiso: "roles:leer" },
        },
        {
          path: "/admin/clientes",
          name: "Clientes",
          component: () => import("../views/admin/ClientesView.vue"),
          meta: { permiso: "clientes:leer" },
        },
        {
          path: "/admin/habitaciones",
          name: "Habitaciones",
          component: () => import("../views/admin/HabitacionesView.vue"),
          meta: { permiso: "habitaciones:leer" },
        },
        {
          path: "/admin/reservaciones",
          name: "Reservaciones",
          component: () => import("../views/admin/ReservacionesView.vue"),
          meta: { permiso: "reservaciones:leer" },
        },
        {
          path: "/admin/facturacion",
          name: "Facturacion",
          component: () => import("../views/admin/FacturacionView.vue"),
          meta: { permiso: "facturacion:leer" },
        },
        {
          path: "/admin/pagos",
          name: "Pagos",
          component: () => import("../views/admin/PagosView.vue"),
          meta: { permiso: "pagos:leer" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) return "/login";

  // Unified permission guard — superadmin bypasses all
  if (to.meta.permiso) {
    if (!auth.tienePermiso(to.meta.permiso as string)) return "/";
  }
});

export default router;
