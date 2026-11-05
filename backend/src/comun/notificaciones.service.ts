import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  private async enviarPorBrevo(params: {
    correoDestino: string;
    nombreDestino: string;
    asunto: string;
    htmlContenido: string;
    etiquetaLog: string;
  }): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    const remitenteEmail = process.env.EMAIL_USER || 'mpea.reyeshector@gmail.com';
    const remitenteNombre = 'Centro Psicológico Axioma';

    if (!apiKey || apiKey === 'tu_api_key_de_brevo_aqui') {
      console.log(
        `[SIMULACIÓN CORREO - ${params.etiquetaLog}] Correo no enviado a ${params.correoDestino} (Asunto: "${params.asunto}") porque BREVO_API_KEY no está configurada.`,
      );
      return;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: remitenteNombre,
            email: remitenteEmail,
          },
          to: [
            {
              email: params.correoDestino,
              name: params.nombreDestino,
            },
          ],
          subject: params.asunto,
          htmlContent: params.htmlContenido,
        }),
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      this.logger.log(
        `[${params.etiquetaLog}] Correo enviado vía Brevo API a ${params.correoDestino}. ID: ${data?.messageId || 'OK'}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[ERROR BREVO API - ${params.etiquetaLog}] No se pudo enviar el correo a ${params.correoDestino}: ${error.message}`,
      );
      console.log(
        `[RESPALDO CONSOLA - ${params.etiquetaLog}] Destinatario: ${params.correoDestino} | Asunto: "${params.asunto}"`,
      );
    }
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
    `;

    // 4. Envío mediante la API HTTP de Brevo
    await this.enviarPorBrevo({
      correoDestino,
      nombreDestino: nombresPaciente,
      asunto: 'Confirmación de Cita - Centro Psicológico Axioma',
      htmlContenido,
      etiquetaLog: 'CORREO ENVIADO',
    });
  }

  async enviarConfirmacionObligatoria(paciente: any, cita: any) {
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
    const nombresPaciente = `${paciente?.nombres || 'Paciente'} ${paciente?.apellidos || ''}`.trim();
    const correoDestino = paciente?.correo || paciente?.usuario?.correo;
    const urlConfirmacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paciente?confirmarCita=${cita.id}`;

    console.log(
      `[ALERTA ML NO-SHOW ALTO - CONFIRMACIÓN OBLIGATORIA] Paciente: ${nombresPaciente} | Correo: ${correoDestino || 'N/A'} | Cita: ${fechaCapitalizada} (${horaInicio})`,
    );

    if (!correoDestino) {
      this.logger.warn(
        `El paciente ${nombresPaciente} no tiene correo registrado. Confirmación obligatoria omitida.`,
      );
      return;
    }

    const htmlContenido = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08); border: 1px solid #fde68a; }
          .header { background-color: #8b3d53; color: #ffffff; padding: 26px 24px; text-align: center; border-bottom: 3px solid #d97706; }
          .header h1 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.92; }
          .content { padding: 30px 28px; }
          .alert-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 18px; margin: 18px 0; color: #92400e; font-size: 14px; line-height: 1.6; }
          .card-details { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .cta-wrap { text-align: center; margin: 26px 0; }
          .cta-btn { background-color: #8b3d53; color: #ffffff !important; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirmación de Asistencia Requerida</h1>
            <p>Centro Psicológico Axioma</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; color: #0f172a;">Estimado(a) <strong>${nombresPaciente}</strong>,</p>
            <div class="alert-box">
              Hemos notado que tu cita está próxima. Por favor, confirma tu asistencia haciendo clic en el siguiente botón. Si no puedes asistir, reprograma tu cita con 24 horas de anticipación.
            </div>
            <div class="card-details">
              <div class="detail-row">
                <span><strong>Fecha:</strong></span>
                <span>${fechaCapitalizada}</span>
              </div>
              <div class="detail-row">
                <span><strong>Horario:</strong></span>
                <span>${horaInicio} - ${horaFin}</span>
              </div>
              <div class="detail-row">
                <span><strong>Terapeuta:</strong></span>
                <span>${nombresPsicologo}</span>
              </div>
            </div>
            <div class="cta-wrap">
              <a href="${urlConfirmacion}" target="_blank" class="cta-btn">
                Confirmar Asistencia
              </a>
            </div>
          </div>
          <div class="footer">
            Centro Psicológico Axioma • Av. Arequipa 2450, Lince, Lima • Tel: (01) 456-7890
          </div>
        </div>
      </body>
      </html>
    `;

    await this.enviarPorBrevo({
      correoDestino,
      nombreDestino: nombresPaciente,
      asunto: `⚠️ Confirma tu asistencia a tu cita del ${fechaCapitalizada}`,
      htmlContenido,
      etiquetaLog: 'CORREO CONFIRMACIÓN OBLIGATORIA ENVIADO',
    });
  }

  // Alias retrocompatible
  async enviarConfirmacionWhatsApp(paciente: any, cita: any) {
    return this.enviarConfirmacion(paciente, cita);
  }
}
