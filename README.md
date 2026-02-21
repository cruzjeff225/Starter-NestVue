# 🚀 Boilerplate – Setup Inicial

Plantilla base utilizando:

- **Backend:** NestJS
- **Frontend:** Vue.js
- **ORM:** Prisma
- **Estilos:** TailwindCSS

---

## Requisitos Previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v22 o superior
- npm

Verificar instalación:

```bash
node -v
npm -v
```

---

## ⚙️ Configuración del Proyecto

Clonar el repositorio:

```bash
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_PROYECTO>
```

---

## 🔵 Backend Setup (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

El backend estará disponible en: **http://localhost:3000**

> Si todo está correcto, el servidor debería iniciar sin errores.

---

## 🟢 Frontend Setup (Vue)

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 📌 Flujo de Trabajo para el Equipo

Cada vez que clones el proyecto:

1. Clonar el repositorio
2. Entrar a `backend` → `npm install`
3. Entrar a `frontend` → `npm install`
4. Ejecutar ambos servidores

---

## 🛠️ Scripts Disponibles

### Backend

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar build de producción |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Preview del build de producción |

---

## ⚠️ Notas Importantes

- No subir `node_modules` al repositorio
- No subir archivos `.env` al repositorio
- Si agregas nuevas dependencias, hacer commit del `package.json` y `package-lock.json`
- Se recomienda que como equipo usemos la misma versión de Node (v22.22.0)
