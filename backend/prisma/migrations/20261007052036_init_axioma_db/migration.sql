-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'PSICOLOGO', 'PACIENTE');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "EstadoPaquete" AS ENUM ('ACTIVO', 'AGOTADO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NivelRiesgo" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMINISTRADOR',
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psicologos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "dni" VARCHAR(15) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "numero_colegiatura" VARCHAR(25),
    "especialidad" VARCHAR(120),
    "tarifa_por_sesion" DECIMAL(10,2),
    "biografia" TEXT,
    "foto_url" VARCHAR(255),
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "psicologos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidades_psicologo" (
    "id" TEXT NOT NULL,
    "psicologo_id" TEXT NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disponibilidades_psicologo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "dni" VARCHAR(15) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(150),
    "fecha_nacimiento" DATE,
    "genero" VARCHAR(20),
    "direccion" VARCHAR(200),
    "nombre_apoderado" VARCHAR(150),
    "dni_apoderado" VARCHAR(15),
    "telefono_apoderado" VARCHAR(20),
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paquetes" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "cantidad_sesiones" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "vigencia_dias" INTEGER NOT NULL DEFAULT 90,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paquetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paquetes_paciente" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "paquete_id" TEXT NOT NULL,
    "sesiones_totales" INTEGER NOT NULL,
    "sesiones_consumidas" INTEGER NOT NULL DEFAULT 0,
    "sesiones_restantes" INTEGER NOT NULL,
    "estado" "EstadoPaquete" NOT NULL DEFAULT 'ACTIVO',
    "fecha_compra" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMPTZ,

    CONSTRAINT "paquetes_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "psicologo_id" TEXT NOT NULL,
    "paquete_paciente_id" TEXT,
    "fecha_hora_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_hora_fin" TIMESTAMPTZ NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "motivo_consulta" VARCHAR(255),
    "nota_cancelacion" TEXT,
    "probabilidad_inasistencia" DECIMAL(5,4),
    "nivel_riesgo_inasistencia" "NivelRiesgo",
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoluciones_clinicas" (
    "id" TEXT NOT NULL,
    "cita_id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "psicologo_id" TEXT NOT NULL,
    "fecha_sesion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo_consulta" TEXT NOT NULL,
    "tecnicas_utilizadas" TEXT,
    "observaciones_conductuales" TEXT,
    "nota_evolucion" TEXT NOT NULL,
    "tareas_casa" TEXT,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "evoluciones_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "psicologos_usuario_id_key" ON "psicologos"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "psicologos_dni_key" ON "psicologos"("dni");

-- CreateIndex
CREATE INDEX "disponibilidades_psicologo_psicologo_id_idx" ON "disponibilidades_psicologo"("psicologo_id");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_usuario_id_key" ON "pacientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_dni_key" ON "pacientes"("dni");

-- CreateIndex
CREATE INDEX "pacientes_dni_idx" ON "pacientes"("dni");

-- CreateIndex
CREATE INDEX "paquetes_paciente_paciente_id_idx" ON "paquetes_paciente"("paciente_id");

-- CreateIndex
CREATE INDEX "citas_psicologo_id_fecha_hora_inicio_idx" ON "citas"("psicologo_id", "fecha_hora_inicio");

-- CreateIndex
CREATE INDEX "citas_paciente_id_idx" ON "citas"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "evoluciones_clinicas_cita_id_key" ON "evoluciones_clinicas"("cita_id");

-- CreateIndex
CREATE INDEX "evoluciones_clinicas_paciente_id_idx" ON "evoluciones_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "evoluciones_clinicas_psicologo_id_idx" ON "evoluciones_clinicas"("psicologo_id");

-- AddForeignKey
ALTER TABLE "psicologos" ADD CONSTRAINT "psicologos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidades_psicologo" ADD CONSTRAINT "disponibilidades_psicologo_psicologo_id_fkey" FOREIGN KEY ("psicologo_id") REFERENCES "psicologos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes_paciente" ADD CONSTRAINT "paquetes_paciente_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paquetes_paciente" ADD CONSTRAINT "paquetes_paciente_paquete_id_fkey" FOREIGN KEY ("paquete_id") REFERENCES "paquetes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_psicologo_id_fkey" FOREIGN KEY ("psicologo_id") REFERENCES "psicologos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paquete_paciente_id_fkey" FOREIGN KEY ("paquete_paciente_id") REFERENCES "paquetes_paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_psicologo_id_fkey" FOREIGN KEY ("psicologo_id") REFERENCES "psicologos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
