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
   npm run prisma:seed
   ```

5. Inicia el servidor backend en modo desarrollo:
   ```bash
   npm run start:dev
   ```
   El backend estará disponible en: **`http://localhost:4000/api`**

6. *(Opcional)* Abrir el panel visual de base de datos **Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Prisma Studio estará disponible en: **`http://localhost:5555`**

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

El comando `npm run prisma:seed` crea automáticamente cuatro usuarios para probar todos los roles del sistema (con botones de 1-clic en la pantalla de inicio de sesión):

| Rol | Correo Electrónico | Contraseña | Permisos y Alcance |
|---|---|---|---|
| **Administrador** | `admin@axioma.pe` | `admin123` | Control total del sistema (`/panel`): gestión de psicólogos con horarios, agenda central, catálogo de paquetes, directorio y reversión administrativa. |
| **Psicólogo Colegiado** | `psicologo@axioma.pe` | `psico123` | Portal Clínico (`/psicologo`): agenda médica propia, predicción ML de riesgo, registro de asistencia, no-show y evolución confidencial SOAP. |
| **Recepcionista** | `recepcion@axioma.pe` | `recepcion123` | Módulo de Recepción (`/recepcion`): gestión operativa de citas, agendamiento, asistencia, edición de fichas de pacientes y asignación de paquetes (HU-09). |
| **Paciente** | `cliente@axioma.pe` | `cliente123` | Mi Portal (`/paciente`): visualización de paquete prepagado activo (consumo y saldo en vivo), agendamiento de sesiones y seguimiento. |

---

## 🛡️ Reglas de Negocio Implementadas (RN-01 a RN-54)

El sistema incorpora las siguientes validaciones automatizadas a nivel de arquitectura y base de datos:

1. **Gestión de Horarios y Disponibilidad (RN-11, RN-12, RN-34 a RN-42):**
   - **Atención Hábil:** Lunes a Viernes de 09:00 a 18:00 y Sábados de 09:00 a 13:00.
   - **Descanso Dominical (RN-36):** Rechazo automático de reservas en domingo.
   - **Refrigerio Obligatorio (RN-37):** Bloqueo de citas entre 13:00 y 14:00 (L-V).
   - **Feriados Nacionales (RN-40, RN-42):** Bloqueo automático para los 16 feriados oficiales del Perú (2026).
   - **Prevención de Cruces (RN-11):** Validación atómica contra citas simultáneas del psicólogo y del paciente.
   - **Disponibilidad por Terapeuta (RN-12, RN-35):** Solo se agendan sesiones en los días y rangos horarios registrados para el profesional.

2. **Kardex Atómico y Paquetes de Sesiones (RN-02, RN-22, RN-23, RN-44 a RN-46):**
   - **Evaluación vs. Terapia (RN-01, RN-02):** Las citas de `EVALUACION` nunca descuentan sesiones de paquete.
   - **Anti-Doble Descuento (RN-46):** Registro de `MovimientoSesion(tipo: CONSUMO, cantidad: -1)` con restricción `@@unique([citaId, tipo])`.
   - **Inasistencia / No-Show (RN-23):** Penalización de 1 sesión en caso de inasistencia a terapia.
   - **Cancelación Anticipada vs. Tardía (RN-22, RN-23):** Cancelación $\ge$ 24h libera el cupo sin costo; cancelación tardía (< 24h) penaliza la sesión.
   - **Reversión Administrativa:** Exclusiva para el Administrador, restituye el saldo consumido (`+1`) y registra auditoría.

3. **Control de Acceso Basado en Roles - RBAC (RN-49):**
   - Controladores protegidos con `JwtAuthGuard` y `RolesGuard`.
   - Filtrado en base de datos para que psicólogos y pacientes solo accedan a sus registros.
   - Confidencialidad médica: Notas SOAP accesibles únicamente por el psicólogo tratante y el Administrador.

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
