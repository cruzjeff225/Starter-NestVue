import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')
  const fontSize = ref(localStorage.getItem('fontSize') || 'medium')

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function setFontSize(size: 'small' | 'medium' | 'large') {
    fontSize.value = size
    localStorage.setItem('fontSize', size)
    document.documentElement.setAttribute('data-font-size', size)
  }

  function init() {
    document.documentElement.classList.toggle('dark', isDark.value)
    document.documentElement.setAttribute('data-font-size', fontSize.value)
  }

  return { isDark, fontSize, toggleDark, setFontSize, init }
})