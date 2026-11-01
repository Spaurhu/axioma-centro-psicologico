import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private transporter: nodemailer.Transporter | null = null;

  private obtenerTransporter(): nodemailer.Transporter | null {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT) || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Si falta la contraseña o es la plantilla de prueba, no falla la app
    if (!user || !pass || pass === 'tu_contraseña_de_aplicacion_aqui') {
      return null;
    }

    if (!this.transporter) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true para 465, false para 587
          auth: {
            user,
            pass,
          },
        });
        this.logger.log('Transporter de Nodemailer inicializado correctamente.');
      } catch (error: any) {
        this.logger.warn(`Error al inicializar transporter de correo: ${error.message}`);
        return null;
      }
    }

    return this.transporter;
  }

  async enviarConfirmacion(paciente: any, cita: any) {
    const inicio = new Date(cita.fechaHoraInicio);
    const fin = new Date(cita.fechaHoraFin);

    const fechaFormateada = inicio.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima',
    });
    const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

    const horaInicio = inicio.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Lima',
    });

    const horaFin = fin.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Lima',
    });

    const nombresPsicologo = cita.psicologo
      ? `${cita.psicologo.nombres} ${cita.psicologo.apellidos || ''}`.trim()
      : 'Terapeuta Asignado';
    const especialidad = cita.psicologo?.especialidad ? ` (${cita.psicologo.especialidad})` : '';
    const esVirtual = cita.modalidad === 'VIRTUAL' || Boolean(cita.enlaceVideo);
    const consultorio = esVirtual
      ? 'Sesión Virtual (Videollamada Google Meet)'
      : 'Consultorio 101 - Sede Principal (Av. Arequipa 2450, Lince)';
    const nombresPaciente = `${paciente?.nombres || 'Paciente'} ${paciente?.apellidos || ''}`.trim();
    const correoDestino = paciente?.correo || paciente?.usuario?.correo;
    const telefono = paciente?.telefono || 'Sin teléfono';

    // 1. Registro en consola (siempre activo para trazabilidad y auditoría)
    console.log(
      `[SIMULACIÓN NOTIFICACIÓN] Paciente: ${nombresPaciente} | Tel: ${telefono} | Correo: ${correoDestino || 'N/A'} | Cita con: ${nombresPsicologo} el ${fechaCapitalizada} a las ${horaInicio}`,
    );

    // 2. Si el paciente no tiene correo registrado, solo se emite el aviso en consola
    if (!correoDestino) {
      this.logger.warn(
        `El paciente ${nombresPaciente} no tiene correo registrado. Notificación omitida.`,
      );
      return;
    }

    // 3. Plantilla HTML profesional y responsive para el correo
    const htmlContenido = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
          .header { background-color: #0f766e; color: #ffffff; padding: 28px 24px; text-align: center; border-bottom: 3px solid #0d9488; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 400; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 15px; margin-bottom: 18px; line-height: 1.5; color: #0f172a; }
          .card-details { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 22px 0; }
          .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #475569; }
          .value { font-weight: 700; color: #0f172a; text-align: right; }
          .badge-confirmed { display: inline-block; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.5px; }
          .virtual-box { text-align: center; margin: 24px 0; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px; }
          .virtual-btn { background-color: #0f766e; color: #ffffff !important; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block; letter-spacing: 0.3px; }
          .notice { background: #fffbeb; border-left: 4px solid #d97706; padding: 14px 16px; border-radius: 4px; font-size: 12px; color: #92400e; margin-top: 24px; line-height: 1.5; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Centro Psicológico Axioma</h1>
            <p>Atención Clínica y Psicoterapéutica Especializada</p>
          </div>
          <div class="content">
            <p class="greeting">Estimado(a) <strong>${nombresPaciente}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
              Le informamos que su sesión terapéutica ha sido programada y registrada con éxito en nuestra agenda institucional. Le compartimos los detalles de su consulta:
            </p>

            <div class="card-details">
              <div class="detail-row">
                <span class="label">Fecha programada:</span>
                <span class="value">${fechaCapitalizada}</span>
              </div>
              <div class="detail-row">
                <span class="label">Horario de atención:</span>
                <span class="value">${horaInicio} - ${horaFin}</span>
              </div>
              <div class="detail-row">
                <span class="label">Terapeuta tratante:</span>
                <span class="value">${nombresPsicologo}${especialidad}</span>
              </div>
              <div class="detail-row">
                <span class="label">Sede / Ubicación:</span>
                <span class="value">${consultorio}</span>
              </div>
              <div class="detail-row">
                <span class="label">Modalidad:</span>
                <span class="value">${esVirtual ? '<span style="color: #0f766e; font-weight: 700;">VIRTUAL (En Línea)</span>' : '<span style="color: #334155; font-weight: 700;">PRESENCIAL</span>'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Estado de la cita:</span>
                <span class="value"><span class="badge-confirmed">CONFIRMADA</span></span>
              </div>
            </div>

            ${cita.enlaceVideo ? `
            <div class="virtual-box">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #0f766e;">
                Acceso a la Sala Virtual de Consulta
              </p>
              <a href="${cita.enlaceVideo}" target="_blank" class="virtual-btn">
                Unirse a la Videollamada
              </a>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">
                Enlace directo: <a href="${cita.enlaceVideo}" style="color: #0f766e; text-decoration: underline;">${cita.enlaceVideo}</a>
              </p>
            </div>
            ` : ''}

            <div class="notice">
              <strong>Lineamientos de la consulta:</strong><br>
              ${esVirtual 
                ? '• Por favor conéctese 5 minutos antes de la hora acordada, en un ambiente privado y con cámara activa.<br>' 
                : '• Le solicitamos presentarse 10 minutos antes del inicio de su sesión en recepción.<br>'}
              • Toda reprogramación o cancelación debe comunicarse con un mínimo de 24 horas de anticipación para evitar la penalización de la sesión.
            </div>

            <p style="font-size: 13px; color: #475569; margin: 24px 0 0 0;">
              Atentamente,<br>
              <strong>Dirección Médica y Asistencia al Paciente</strong><br>
              Centro Psicológico Axioma
            </p>
          </div>
          <div class="footer">
            Centro Psicológico Axioma • Av. Arequipa 2450, Lince, Lima<br>
            Central Telefónica: (01) 456-7890 • Correo Institucional: contacto@axioma.pe<br>
            Documento emitido electrónicamente por el Sistema Clínico Axioma.
          </div>
        </div>
      </body>
      </html>
    `;;

    // 4. Envío con nodemailer
    const transporter = this.obtenerTransporter();
    if (!transporter) {
      console.log(
        `[SIMULACIÓN CORREO] Correo no enviado a ${correoDestino} porque EMAIL_PASS aún tiene la plantilla por defecto o no está configurado.`,
      );
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"Centro Psicológico Axioma" <${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: `Confirmación de Cita - Centro Psicológico Axioma`,
        html: htmlContenido,
      });
      this.logger.log(`[CORREO ENVIADO] Mensaje enviado a ${correoDestino}. ID: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(
        `[ERROR CORREO] No se pudo enviar el correo a ${correoDestino}: ${error.message}`,
      );
    }
  }

  // Alias retrocompatible
  async enviarConfirmacionWhatsApp(paciente: any, cita: any) {
    return this.enviarConfirmacion(paciente, cita);
  }
}
