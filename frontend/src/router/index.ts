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
          path: "admin/habitaciones",
          component: () => import("../views/rooms/RoomsView.vue"),
          meta: { requiresAuth: true },
        },

        {path: "admin/Clientes",
           component: () => import("../views/customers/CustomersView.vue"),
           meta: { requiresAuth: true },
        },
        
        {path: "admin/Facturacion",
           component: () => import("../views/Billing/BillingView.vue"),
           meta: { requiresAuth: true },
        }
        
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) return "/login";
  if (to.meta.requiresRole === "admin" && !auth.isAdmin) return "/";

  return true;
});

export default router;