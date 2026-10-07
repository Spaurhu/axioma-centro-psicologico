# 🧠 Centro Psicológico Axioma — Sistema Integral de Gestión Clínica & Teleterapia

> Proyecto desarrollado para el curso **Curso Integrador II - Sistemas** (Universidad Tecnológica del Perú - UTP).  
> **Autores:** Joao Moises Inga Gallo & Hector Sebastian Reyes Fatama  
> **Docente:** Mg. Anita Condo  

---

## 🌟 Descripción General

**Axioma** es una plataforma clínica web para centros de atención psicológica que unifica la gestión operativa, agenda médica centralizada sin cruces de horarios, control de paquetes de sesiones con deducción atómica de saldo, registro de evoluciones clínicas bajo formato **SOAP** y un motor de **Inteligencia Artificial / Machine Learning** que predice en tiempo real el riesgo de inasistencia (*No-Show*) de los pacientes.

El sistema cuenta con una arquitectura de dos portales:
1. **Portal Público y de Pacientes:** Landing page informativa, catálogo de paquetes con descuento, registro de usuarios, portal de citas y control de saldo de sesiones.
2. **Panel de Dirección & Staff Clínico:** Agenda centralizada con predicción ML, gestión de terapeutas colegiados (C.Ps.P.), directorio de pacientes, asignación de paquetes y registro confidencial de evoluciones SOAP.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | **Next.js 15 (App Router)**, React 19, TypeScript, **Tailwind CSS**, Lucide Icons |
| **Backend** | **NestJS 10**, TypeScript, JWT Auth con control de acceso basado en roles (**RBAC**), Class-Validator |
| **Base de Datos** | **PostgreSQL** con **Prisma ORM** (tablas, columnas y relaciones normalizadas en español) |
| **Machine Learning** | **Regresión Logística multivariable** (precisión 84.6%, ROC-AUC 0.87) inferida en runtime |

---

## 🚀 Guía de Instalación y Ejecución Rápida

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd "Curso Integrador 2"
```

---

### 2. Configurar y Levantar la Base de Datos (PostgreSQL)

Tienes dos opciones para la base de datos:

#### Opción A: PostgreSQL Local (Recomendado)
Asegúrate de tener PostgreSQL ejecutándose localmente (puerto `5432`) y crea una base de datos llamada `axioma_psicologia_db`:
```sql
CREATE DATABASE axioma_psicologia_db;
```

#### Opción B: Con Docker Compose
Si tienes Docker instalado, puedes iniciar el contenedor incluido:
```bash
docker compose up -d
```
*(Inicia PostgreSQL en el puerto `5433` con usuario `postgres` y contraseña `postgres`).*

---

### 3. Configurar y Ejecutar el Backend (NestJS)

1. Ingresa a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea tu archivo de variables de entorno `.env` copiando el ejemplo:
   ```bash
   cp .env.example .env
   ```
   *Verifica que `DATABASE_URL` apunte a tu PostgreSQL (ejemplo: `postgresql://postgres:root@localhost:5432/axioma_psicologia_db?schema=public`).*

4. Ejecuta las migraciones de Prisma y la siembra inicial de datos (*Seed*):
   ```bash
   npx prisma migrate dev --name init_axioma_db
   npx prisma db seed
   ```

5. Inicia el servidor backend en modo desarrollo:
   ```bash
   npm run start:dev
   ```
   El backend estará disponible en: **`http://localhost:4000/api`**

---

### 4. Configurar y Ejecutar el Frontend (Next.js)

1. En una nueva terminal, ingresa a la carpeta `frontend`:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea tu archivo de entorno `.env.local` (opcional si usas los defaults):
   ```bash
   cp .env.example .env.local
   ```

4. Inicia el servidor frontend en modo desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en: **`http://localhost:3000`**

---

## 👥 Credenciales de Prueba Pre-Cargadas (Seed)

El comando `npx prisma db seed` crea automáticamente tres usuarios para probar todos los roles del sistema (con botones de 1-clic en la pantalla de inicio de sesión):

| Rol | Correo Electrónico | Contraseña | Permisos y Alcance |
|---|---|---|---|
| **Administrador** | `admin@axioma.pe` | `admin123` | Control total del sistema, gestión de psicólogos, agenda central, catálogo de paquetes y pacientes. |
| **Psicólogo** | `psicologo@axioma.pe` | `psico123` | Portal clínico, visualización de citas asignadas, registro de asistencia y notas de evolución SOAP. |
| **Paciente** | `cliente@axioma.pe` | `cliente123` | Portal del paciente, visualización de paquete activo (4 sesiones), agendamiento de citas y saldo. |

---

## 📊 Módulo de Machine Learning (Predicción de Inasistencias)

El sistema integra un modelo de **Machine Learning** entrenado para predecir la probabilidad de que un paciente no asista a su sesión programada (*No-Show*).

- **Script de Entrenamiento:** [`ml/entrenar_modelo.py`](ml/entrenar_modelo.py) (simulación estadística con 1,500 historiales clínicos).
- **Pesos Exportados:** [`ml/modelo_coeficientes.json`](ml/modelo_coeficientes.json).
- **Inferencia en Backend:** [`backend/src/modulos/ml/ml.service.ts`](backend/src/modulos/ml/ml.service.ts).
- **Variables Analizadas:**
  1. Horas de anticipación con las que se reservó la cita.
  2. Día de la semana (ej. mayor ausentismo en fines de semana).
  3. Horario del turno (mañana vs. tarde/noche).
  4. Historial previo de inasistencias del paciente.
  5. Total de citas previas atendidas.
  6. Posesión de un paquete prepagado (reduce drásticamente el ausentismo).
- **Métricas del Modelo:**
  - **Exactitud (Accuracy):** 84.6%
  - **Área bajo la curva (ROC-AUC):** 0.87
  - **Categorización:** `BAJO` (< 20%), `MEDIO` (20% - 40%), `ALTO` (> 40%).

---

## 📁 Estructura del Proyecto

```text
Curso Integrador 2/
├── backend/                  # Servidor API NestJS
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos y esquemas en español
│   │   ├── seed.ts           # Datos semilla para pruebas inmediatas
│   │   └── migrations/       # Historial de migraciones SQL
│   ├── src/
│   │   ├── modulos/          # Módulos: auth, citas, pacientes, paquetes, psicologos, ml
│   │   └── comun/            # Guards, decoradores RBAC y utilidades
│   └── package.json
├── frontend/                 # Aplicación web Next.js 15
│   ├── src/
│   │   ├── app/              # App Router: /, /login, /registro, /panel, /paciente
│   │   └── lib/              # Cliente fetch y manejo de tokens
│   ├── tailwind.config.js    # Paleta Deep Slate Navy & Terracotta Sand
│   └── package.json
├── ml/                       # Módulo de Machine Learning
│   ├── entrenar_modelo.py    # Script de entrenamiento
│   └── modelo_coeficientes.json # Coeficientes para inferencia
├── docker-compose.yml        # PostgreSQL contenerizado
├── .gitignore                # Exclusión de node_modules, .env y compilados
└── README.md                 # Documentación técnica del proyecto
```

---

## 📄 Licencia y Derechos

Desarrollado con fines académicos para la Universidad Tecnológica del Perú (UTP) - 2026. Todos los derechos reservados.
