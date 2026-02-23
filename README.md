# 🚀 Boilerplate Fullstack - Setup

Plantilla base para desarrollo fullstack utilizando:

- **Backend:** NestJS
- **Frontend:** Vue.js 3
- **ORM:** Prisma 7
- **Base de datos:** PostgreSQL
- **Estilos:** TailwindCSS
- **Autenticación:** JWT
- **Control de acceso:** RBAC (roles: `admin`, `user`)

---

## 🧠 Requisitos Previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v22.22.0 (versión recomendada del equipo)
- npm
- [PostgreSQL](https://www.postgresql.org/download/) v15 o superior

Verificar instalación:

```bash
node -v
npm -v
psql --version
```

---

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_PROYECTO>
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

Edita el `.env` con tus datos:

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/boilerplate_db"
JWT_SECRET="tu_clave_secreta_aqui"
```

> Puedes generar un JWT_SECRET seguro con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Crear la base de datos

```bash
psql -U postgres
```

```sql
CREATE DATABASE boilerplate_db;
\q
```

---

## 🔵 Backend Setup (NestJS)

```bash
cd backend
npm install
```

Ejecutar migraciones para crear las tablas:

```bash
npx prisma migrate dev
```

Cargar datos iniciales (roles y usuario admin):

```bash
npx prisma db seed
```

Iniciar el servidor:

```bash
npm run start:dev
```

El backend estará disponible en: **http://localhost:3000**

---

## 🟢 Frontend Setup (Vue)

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 👤 Usuarios Iniciales

Tras ejecutar el seed estarán disponibles los siguientes usuarios:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@misistema.com` | `admin123` | admin |
| `user@misistema.com` | `user123` | user |

---

## 🔐 Roles y Permisos (RBAC)

| Ruta | `admin` | `user` |
|---|---|---|
| `GET /users` | ✅ | ❌ |
| `POST /auth/login` | ✅ | ✅ |
| `POST /auth/register` | ✅ | ✅ |

---

## 📁 Estructura del Proyecto

```
my-boilerplate/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── common/          # Guards, decorators, filtros reutilizables
│       ├── modules/
│       │   ├── auth/        # Login, registro, JWT
│       │   ├── users/       # CRUD de usuarios
│       │   └── health/      # Health check endpoint
│       ├── prisma/          # Conexión global a la BD
│       └── rbac/            # Roles y guards de acceso
└── frontend/
    └── src/
        ├── components/      # Navbar, Sidebar, ThemeToggle
        ├── layouts/         # Layout principal
        ├── views/           # Login, Register, Dashboard, Users
        ├── stores/          # Auth store, Theme store
        ├── services/        # Axios configurado
        └── composables/     # Lógica reutilizable
```

---

## 🛠️ Scripts Disponibles

### Backend

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo desarrollo con hot-reload |
| `npx prisma migrate dev` | Ejecutar migraciones |
| `npx prisma db seed` | Cargar datos iniciales |
| `npx prisma studio` | Explorador visual de la BD |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run preview` | Preview del build de producción |

---

## 🔗 Endpoints Principales

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Iniciar sesión | No |
| `POST` | `/auth/register` | Registrar usuario | No |
| `GET` | `/users` | Listar usuarios | Admin |

---

## ⚠️ Notas Importantes

- No subir `node_modules` al repositorio
- No subir archivos `.env` al repositorio — usa `.env.example` como referencia
- Si agregas nuevas dependencias, hacer commit del `package.json` y `package-lock.json`
- Todo el equipo debe usar Node v22.22.0 (se recomienda [nvm](https://github.com/nvm-sh/nvm))
- Después de cada cambio en `schema.prisma` correr `npx prisma migrate dev` y `npx prisma generate`
