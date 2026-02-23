<script setup lang="ts">
import { useThemeStore } from '../stores/themeStore'

const theme = useThemeStore()
</script>

<template>
  <div class="theme-controls">
    <!-- Dark mode toggle -->
    <button
      class="theme-btn"
      :title="theme.isDark ? 'Modo claro' : 'Modo oscuro'"
      @click="theme.toggleDark()"
    >
      <!-- Sun icon -->
      <svg v-if="theme.isDark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <!-- Moon icon -->
      <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>

    <!-- Font size selector -->
    <div class="font-selector">
      <button
        v-for="size in ['small', 'medium', 'large'] as const"
        :key="size"
        class="font-btn"
        :class="{ active: theme.fontSize === size }"
        :title="`Fuente ${size}`"
        @click="theme.setFontSize(size)"
      >
        <span :style="{ fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px' }">A</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

:global(.dark) .theme-btn {
  background: #312e81;
  border-color: #4338ca;
  color: #a5b4fc;
}

.theme-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
}

:global(.dark) .theme-btn:hover {
  background: #4338ca;
  color: white;
}

.font-selector {
  display: flex;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

:global(.dark) .font-selector { border-color: #4338ca; }

.font-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.15s;
  border-right: 1px solid #f1f5f9;
}

.font-btn:last-child { border-right: none; }

:global(.dark) .font-btn {
  background: #312e81;
  color: #94a3b8;
  border-right-color: #4338ca;
}

.font-btn:hover {
  background: #f8fafc;
  color: #6366f1;
}

:global(.dark) .font-btn:hover {
  background: #4338ca;
  color: #a5b4fc;
}

.font-btn.active {
  background: #eef2ff;
  color: #6366f1;
}

:global(.dark) .font-btn.active {
  background: #4338ca;
  color: white;
}
</style>