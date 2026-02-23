<template>
  <div class="min-h-screen flex bg-slate-100">

    <!-- SIDEBAR -->
    <aside
      :class="[
        'bg-slate-900 text-slate-200 flex flex-col shadow-xl transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      ]"
    >

      <!-- Logo + Toggle -->
      <div class="p-6 text-2xl font-bold tracking-wide border-b border-slate-700 flex items-center justify-between">
        <span v-if="isOpen">🚀 AdminPro</span>

        <button @click="toggleSidebar" class="text-slate-300 hover:text-white">
          <Menu size="22" />
        </button>
      </div>

      <!-- Menu -->
      <nav class="flex-1 p-4 space-y-2">

        <router-link
          to="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
          :class="isActive('/') 
            ? 'bg-indigo-600 text-white' 
            : 'hover:bg-slate-800'"
        >
          <LayoutDashboard size="20"/>
          <span v-if="isOpen">Dashboard</span>
        </router-link>

        <router-link
          to="/users"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
          :class="isActive('/users') 
            ? 'bg-indigo-600 text-white' 
            : 'hover:bg-slate-800'"
        >
          <Users size="20"/>
          <span v-if="isOpen">Usuarios</span>
        </router-link>

      </nav>

      <!-- Footer Sidebar -->
      <div class="p-4 text-sm text-slate-400 border-t border-slate-700 text-center">
        <span v-if="isOpen">© 2026 AdminPro</span>
      </div>

    </aside>

    <!-- CONTENIDO -->
    <div class="flex-1 flex flex-col transition-all duration-300">

      <!-- NAVBAR -->
      <header class="bg-white shadow-sm px-10 py-5 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-slate-700">
          Panel Principal
        </h2>

        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition">
          Cerrar sesión
        </button>
      </header>

      <!-- CONTENIDO -->
      <main class="flex-1 p-10">
        <router-view />
      </main>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, Users, Menu } from 'lucide-vue-next'

const route = useRoute()

const isOpen = ref(true)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const isActive = (path) => route.path === path
</script>