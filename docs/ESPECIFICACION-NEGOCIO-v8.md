DOCUMENTO DE DEFINICIÓN DEL NEGOCIO, REGLAS DE NEGOCIO Y PRODUCT BACKLOG
Proyecto: Desarrollo de un sistema web para la gestión de citas presenciales y control de historias clínicas en el Centro Psicológico Axioma
Versión: 8.0 (Unificada Final - Corregida)
Fecha: Octubre 2026
Elaborado por: Joao Moises Inga Gallo (U22308126) y Hector Sebastian Reyes Fatama (U22219725)
Curso: Integrador II - Sistemas
Docente: Mg. Anita Condo Lopez
________________________________________
ÍNDICE
1.	Introducción
2.	Modelo de Negocio
3.	Horario y Capacidad Operativa
4.	Procesos del Negocio
5.	Reglas de Negocio Consolidadas
6.	Roles del Sistema y Permisos
7.	Glosario de Términos
8.	Flujo Completo del Paciente
9.	Product Backlog (MVP + Versiones Posteriores)
10.	Modelo de Datos Propuesto
11.	Plan de Desarrollo en 5 Fases
12.	Preguntas para Validar con el Dueño del Negocio
13.	Supuestos Pendientes de Validación
14.	Conclusión
________________________________________
1. INTRODUCCIÓN
El presente documento describe el funcionamiento operativo, los procesos clave y las reglas de negocio del Centro Psicológico Axioma. El centro ofrece servicios de psicoterapia 100% presencial en su local, con un modelo de negocio basado en la venta de sesiones individuales y paquetes terapéuticos prepagados.
A diferencia de un consultorio médico tradicional, el proceso psicológico tiene 3 fases claramente diferenciadas: (1) Evaluación inicial, (2) Propuesta de tratamiento y venta de paquete, y (3) Sesiones de terapia con seguimiento clínico. El sistema web debe reflejar fielmente este flujo para no generar pérdidas económicas ni errores clínicos.
El proyecto se desarrollará bajo un enfoque de Producto Mínimo Viable (MVP), priorizando las funcionalidades críticas para la operación del centro. Las funcionalidades restantes se documentarán como visión del producto y se implementarán en versiones posteriores.
________________________________________
2. MODELO DE NEGOCIO
2.1. Propuesta de Valor
Brindar servicios de psicoterapia presencial de alta calidad, con un enfoque humano, confidencial y accesible, facilitando a los pacientes el acceso a un tratamiento continuo mediante paquetes de sesiones y recordatorios automatizados.
2.2. Fuentes de Ingresos
1.	Sesión de Evaluación Inicial: Pago único por la primera cita (evaluación clínica).
2.	Sesiones individuales de terapia: Pago por sesión suelta (para pacientes que no compran paquete).
3.	Paquetes terapéuticos: Venta de bloques de sesiones prepagadas (ej. 4, 8 o 12 sesiones) con precio preferencial.
4.	Talleres y charlas grupales: Eventos presenciales (a futuro).
5.	Convenios corporativos: Atención a empresas (a futuro).
2.3. Segmentos de Clientes
•	Personas naturales (adultos, adolescentes, niños).
•	Parejas y familias.
•	Empresas con programas de bienestar laboral.
2.4. Canales de Atención
•	100% Presencial: En el local del Centro Psicológico Axioma.
________________________________________
3. HORARIO Y CAPACIDAD OPERATIVA
3.1. Horario de Atención
Día	Horario	Refrigerio
Lunes a Viernes	9:00 a.m. – 6:00 p.m.	1:00 p.m. – 2:00 p.m.
Sábados	9:00 a.m. – 1:00 p.m.	No aplica
Domingos y feriados	Cerrado	—
3.2. Cálculo de Horas Semanales
Concepto	Cálculo	Total
Horas de apertura L-V	9 horas/día × 5 días	45 horas
Horas de apertura Sábado	4 horas/día × 1 día	4 horas
Total de apertura semanal		49 horas
Refrigerio L-V	1 hora/día × 5 días	-5 horas
Total de horas efectivas		44 horas
3.3. Capacidad Operativa (Máximo Teórico)
Citas por psicólogo:
•	Evaluación: 60 minutos (sin transición).
•	Terapia: 50 minutos de atención + 10 minutos de transición = 60 minutos de bloque reservado.
Lunes a Viernes:
•	Horario: 9:00 a.m. – 6:00 p.m. = 9 horas
•	Menos refrigerio: 1 hora
•	Horas efectivas: 8 horas
•	Cada cita ocupa 1 hora (bloque completo)
•	Citas por psicólogo por día: 8 citas
Sábados:
•	Horario: 9:00 a.m. – 1:00 p.m. = 4 horas
•	Citas por psicólogo por día: 4 citas
Total semanal por psicólogo:
•	Lunes a Viernes: 8 × 5 = 40 citas
•	Sábados: 4 × 1 = 4 citas
•	Total: 44 citas semanales por psicólogo
Si el centro tiene 3 psicólogos:
•	132 citas semanales de capacidad máxima teórica.
Nota: La capacidad de 132 citas es un máximo teórico. No contempla ausencias del personal, permisos, bloqueos extraordinarios ni diferencias entre los horarios de cada psicólogo. La capacidad real será menor y debe medirse con el indicador de ocupación.
________________________________________
4. PROCESOS DEL NEGOCIO
4.1. Proceso de Captación y Registro de Pacientes
Descripción: Es el proceso mediante el cual una persona interesada en los servicios del centro se convierte en paciente.
Flujo:
1.	Contacto inicial: La persona llama, escribe por WhatsApp o acude al centro.
2.	Registro de datos: La recepcionista registra los datos básicos del paciente (nombres, apellidos, DNI, teléfono, email, fecha de nacimiento).
3.	Clasificación: El sistema clasifica al paciente como "Paciente Nuevo" (aún no ha tenido evaluación).
4.	Asignación de psicólogo: Se evalúa el motivo de consulta y se asigna al psicólogo especialista adecuado.
5.	Programación de primera cita: Se agenda la Sesión de Evaluación Inicial.
6.	Confirmación: Se envía un recordatorio al paciente con la fecha y hora de la cita.
Responsable: Recepcionista / Administrador.
Sistema: Módulo de Pacientes y Módulo de Citas.
________________________________________
4.2. Proceso de Evaluación Inicial (Primera Sesión)
Descripción: Es la primera sesión clínica del paciente. Su objetivo es conocer al paciente, entender el motivo de consulta y formular un diagnóstico presuntivo.
Duración: 60 minutos.
Modalidad: Presencial.
Flujo:
1.	Entrevista inicial (Anamnesis): El psicólogo recopila:
o	Motivo de consulta.
o	Historia personal y familiar.
o	Antecedentes médicos, psicológicos y psiquiátricos.
o	Dinámica familiar, social y laboral.
2.	Examen mental: El psicólogo evalúa:
o	Apariencia, actitud, orientación.
o	Estado de ánimo, afecto.
o	Pensamiento, percepción, cognición.
3.	Aplicación de pruebas psicométricas (si aplica):
o	Test de ansiedad (Beck), depresión (Hamilton), personalidad (MMPI), etc.
4.	Diagnóstico presuntivo: El psicólogo formula una hipótesis diagnóstica con código CIE-10 o DSM-5.
5.	Devolución al paciente: Se le explica qué se encontró y se le propone un plan de tratamiento.
6.	Registro en el sistema: El psicólogo completa la Historia Clínica de Evaluación con todos los datos anteriores.
7.	Cobro: La sesión de evaluación se cobra como sesión individual (NO descuenta paquete, porque el paciente aún no tiene uno).
Responsable: Psicólogo.
Sistema: Módulo Clínico (Historia Clínica de Evaluación).
Reglas de Negocio Asociadas:
•	RN-01: La primera sesión siempre es de evaluación y se cobra como sesión individual.
•	RN-02: La sesión de evaluación NO descuenta sesiones de paquete.
•	RN-03: El psicólogo debe registrar un diagnóstico presuntivo (CIE-10 o DSM-5) antes de proponer un plan de tratamiento.
•	RN-04: El psicólogo debe registrar un plan de tratamiento con: objetivos, enfoque terapéutico, frecuencia y número de sesiones recomendadas.
•	RN-05: El paciente debe firmar un Consentimiento Informado antes de iniciar terapia.
________________________________________
4.3. Proceso de Propuesta de Tratamiento y Venta de Paquete
Descripción: Es el proceso mediante el cual el psicólogo propone un plan de tratamiento y el paciente adquiere un paquete de sesiones.
Flujo:
1.	Propuesta del psicólogo: Al finalizar la evaluación, el psicólogo le dice al paciente:
o	"Necesitas terapia con una frecuencia semanal."
o	"Te recomiendo un paquete de 8 sesiones."
2.	Aceptación del paciente: El paciente acepta (o rechaza) la propuesta.
3.	Venta del paquete: La recepcionista registra:
o	Paquete elegido (ej. 8 sesiones).
o	Monto pagado.
o	Método de pago (Yape, Plin, transferencia, efectivo, tarjeta).
o	Vigencia (ej. 90 días).
4.	Asignación del paquete: El sistema vincula el paquete al paciente y habilita las sesiones.
5.	Agendamiento de la primera sesión de terapia: Se agenda la sesión 1 de 8.
6.	Notificación: Se informa al paciente cuántas sesiones tiene disponibles y la vigencia del paquete.
Responsable: Recepcionista / Administrador.
Sistema: Módulo de Paquetes y Módulo de Caja.
Reglas de Negocio Asociadas:
•	RN-06: El paquete de sesiones se asigna solo después de la sesión de evaluación.
•	RN-07: Todo paquete tiene una vigencia de 90 días calendario desde su compra.
•	RN-08: Las sesiones no consumidas dentro de la vigencia no son reembolsables ni transferibles.
•	RN-09: El sistema debe alertar al paciente y a la recepcionista cuando queden 2 sesiones o menos en el paquete.
•	RN-10: El sistema debe permitir pacientes con paquete y pacientes sin paquete (pago por sesión individual).
________________________________________
4.4. Proceso de Agendamiento de Citas Presenciales
Descripción: Es el proceso mediante el cual se reserva un espacio en la agenda de un psicólogo para atender a un paciente en el local.
Flujo:
1.	Solicitud de cita: El paciente solicita una cita (evaluación o terapia).
2.	Verificación de disponibilidad: La recepcionista consulta la agenda del psicólogo asignado.
3.	Validación de horario:
o	El sistema verifica que la fecha no sea domingo ni feriado.
o	El sistema verifica que la hora esté dentro del horario de atención (L-V: 9:00-18:00; Sáb: 9:00-13:00).
o	El sistema verifica que la hora no esté dentro del horario de refrigerio (L-V: 13:00-14:00).
o	El sistema verifica que el psicólogo no tenga otra cita en ese horario.
o	El sistema verifica que el bloque completo (incluida la transición) esté disponible.
4.	Selección de fecha y hora: Se elige un horario disponible.
5.	Confirmación de la cita: Se registra la cita en el sistema.
6.	Notificación: Se envía confirmación al paciente.
7.	Recordatorio automático: El sistema envía un recordatorio 24 horas antes de la cita.
Responsable: Recepcionista / Administrador.
Sistema: Módulo de Citas y Agenda.
Reglas de Negocio Asociadas:
•	RN-11: No se puede agendar una cita si el intervalo completo [horaInicio, horaFin] se solapa con otra cita del mismo psicólogo en la misma fecha. La validación debe ejecutarse en el backend antes de persistir.
•	RN-12: No se puede agendar una cita fuera del horario laboral del psicólogo.
•	RN-13: No se puede agendar una cita en una fecha u hora pasada.
•	RN-14: Toda cita debe estar asociada a un paciente registrado y a un psicólogo activo.
•	RN-15: El sistema debe enviar recordatorios automáticos 24 horas antes de la cita.
•	RN-34: El centro atiende de lunes a viernes de 9:00 a.m. a 6:00 p.m.
•	RN-35: El centro atiende los sábados de 9:00 a.m. a 1:00 p.m.
•	RN-36: El centro no atiende domingos ni feriados.
•	RN-37: El horario de refrigerio es de 1:00 p.m. a 2:00 p.m. (lunes a viernes). No se pueden agendar citas en ese bloque.
•	RN-38: Los psicólogos solo pueden tener citas dentro del horario de atención del centro.
•	RN-39: El sistema debe bloquear automáticamente el horario de refrigerio al agendar citas.
•	RN-40: El sistema debe bloquear automáticamente los domingos y feriados al agendar citas.
•	RN-41: La agenda diaria debe mostrar visualmente el bloque de refrigerio como horario no disponible.
•	RN-42: El sistema debe permitir configurar feriados nacionales y locales para bloquearlos.
•	RN-43: El indicador de ocupación se calcula como: (minutos ocupados / minutos disponibles) × 100. Se usan los minutos reales de cada bloque reservado (60 minutos para terapia, 60 minutos para evaluación). El denominador son los minutos disponibles del psicólogo en el periodo del reporte (44 horas semanales = 2640 minutos).
•	RN-44: La duración total del bloque reservado para una terapia es de 60 minutos (50 de atención + 10 de transición). La transición es un tiempo no disponible para agendar otra cita.
•	RN-45: La duración total del bloque reservado para una evaluación es de 60 minutos (sin transición adicional).
________________________________________
4.5. Proceso de Atención de Sesión de Terapia (Psicólogo)
Descripción: Es el proceso mediante el cual el psicólogo atiende al paciente en el local y registra la evolución clínica.
Duración: 50 minutos de atención + 10 minutos de transición = 60 minutos de bloque.
Modalidad: Presencial.
Flujo:
1.	Revisión de agenda: El psicólogo inicia sesión y visualiza sus citas del día.
2.	Atención presencial: El psicólogo atiende al paciente en el consultorio.
3.	Registro de asistencia: El psicólogo marca la asistencia del paciente en el sistema.
4.	Descuento de sesión: El sistema descuenta automáticamente una sesión del paquete del paciente (si aplica), registrando un movimiento en la tabla MovimientoSesion.
5.	Registro de nota de evolución: El psicólogo redacta la nota clínica en formato SOAP:
o	S: Subjetivo (lo que el paciente reporta).
o	O: Objetivo (lo que el psicólogo observa).
o	A: Análisis (interpretación clínica).
o	P: Plan (tareas, próximos pasos).
6.	Cierre de sesión: Se guarda la nota y se actualiza el estado de la cita a "Atendida".
7.	Agendamiento de la siguiente sesión: Se agenda la siguiente cita (si aplica).
Responsable: Psicólogo.
Sistema: Módulo Clínico (Portal del Psicólogo).
Reglas de Negocio Asociadas:
•	RN-16: Solo el psicólogo tratante puede ver y editar la nota de evolución de su paciente.
•	RN-17: El descuento de una sesión del paquete es automático al marcar la asistencia.
•	RN-18: Si el paciente no tiene paquete activo, el sistema debe registrar la sesión como "Pago Pendiente" o "Sesión Individual".
•	RN-19: La nota de evolución no puede quedar vacía.
•	RN-20: El sistema debe autoguardar la nota cada 2 minutos para evitar pérdida de información.
•	RN-21: No se puede eliminar una nota de evolución una vez guardada. Solo se puede agregar una nota de rectificación.
________________________________________
4.6. Proceso de Inasistencia y Cancelación de Citas Presenciales
Descripción: Es el proceso que se activa cuando un paciente no asiste a su cita presencial o la cancela.
Flujo:
1.	Detección de inasistencia: El psicólogo o la recepcionista marcan la cita como "No Asistió".
2.	Aplicación de política: Se evalúa si la cancelación fue con aviso previo (mínimo 24 horas) o sin aviso.
3.	Registro de penalización: Si no hubo aviso, se descuenta la sesión del paquete (registrando un movimiento en MovimientoSesion) o se genera un cobro pendiente.
4.	Reprogramación: Si el paciente avisó a tiempo, se le permite reprogramar sin penalización.
Responsable: Recepcionista / Psicólogo.
Sistema: Módulo de Citas.
Reglas de Negocio Asociadas:
•	RN-22: Toda cancelación debe realizarse con al menos 24 horas de anticipación. Si el paciente cancela con anticipación, no aplica penalización.
•	RN-22b: Si el paciente cancela con menos de 24 horas o no asiste, sí aplica penalización (descuento de sesión o cobro pendiente, según lo confirme el dueño del centro). El sistema debe permitir registrar la cancelación tardía y aplicar la penalización correspondiente.
•	RN-23: Si el paciente cancela con menos de 24 horas o no asiste, se descuenta la sesión del paquete.
•	RN-24: Si el paciente no tiene paquete, se genera un cobro pendiente por la sesión no asistida.
•	RN-25: Se permite reprogramar una cita sin penalización solo si se avisó con anticipación.
•	RN-44: El descuento de una sesión se registra como un movimiento en la tabla MovimientoSesion.
•	RN-45: Si se revierte una cita (por error), se registra un movimiento de REVERSION que sume la sesión.
•	RN-46: Cada cita debe tener como máximo un movimiento de consumo (CONSUMO o PENALIZACION). Si se cambia el estado de la cita varias veces, el sistema no debe descontar sesiones repetidamente. Solo se permite un movimiento adicional de REVERSION si se corrige un error.
________________________________________
4.7. Proceso de Gestión de Historias Clínicas
Descripción: Es el proceso de creación, actualización y consulta de la historia clínica del paciente.
Flujo:
1.	Apertura de historia clínica: Se crea al registrar al paciente por primera vez.
2.	Registro de evaluación inicial: El psicólogo registra la anamnesis, motivo de consulta, antecedentes, examen mental y diagnóstico presuntivo.
3.	Registro de plan de tratamiento: El psicólogo registra objetivos, enfoque, frecuencia y número de sesiones.
4.	Registro de notas de evolución: En cada sesión, el psicólogo agrega una nota SOAP.
5.	Consulta de historial: El psicólogo puede revisar las notas anteriores antes de una nueva sesión.
6.	Cierre de historia: Al finalizar el tratamiento, el psicólogo emite un Informe de Alta y se archiva la historia clínica.
Responsable: Psicólogo.
Sistema: Módulo Clínico.
Reglas de Negocio Asociadas:
•	RN-26: La historia clínica es confidencial y solo accesible por el psicólogo tratante. El administrador puede acceder a los logs de auditoría (quién, cuándo y qué operación), pero no al contenido clínico de las notas.
•	RN-27: Todo acceso a una historia clínica debe quedar registrado en un log de auditoría (quién, cuándo y qué vio).
•	RN-28: La historia clínica debe conservarse por el plazo que establezca la normativa legal vigente (a validar con el área legal del centro). Como referencia preliminar, se propone un mínimo de 5 años, sujeto a confirmación.
•	RN-29: Al finalizar el tratamiento, el psicólogo debe emitir un Informe de Alta.
•	RN-47: Solo el psicólogo tratante puede crear, leer, actualizar notas de evolución.
•	RN-48: El psicólogo puede descargar sus propias notas clínicas (con marca de agua y registro de auditoría).
•	RN-49: El administrador puede ver logs de auditoría pero no el contenido de las notas.
•	RN-50: El paciente puede solicitar una copia de su historia clínica (derecho de acceso).
•	RN-51: Las notas de evolución no se eliminan; solo se rectifican con una nota adicional.
•	RN-52: La recepcionista puede ver los metadatos de la cita (fecha, hora, nombre del paciente, psicólogo asignado), pero no el contenido clínico (diagnóstico, anamnesis, notas SOAP).
________________________________________
4.8. Proceso de Cierre de Caja y Reportes
Descripción: Es el proceso mediante el cual se cuadran los ingresos del día y se generan reportes de gestión.
Flujo:
1.	Registro de pagos: La recepcionista registra todos los pagos recibidos durante el día.
2.	Arqueo de caja: Al final del día, se compara el dinero físico con lo registrado en el sistema.
3.	Generación de reportes: Se generan reportes de:
o	Citas atendidas.
o	Sesiones consumidas.
o	Paquetes vendidos.
o	Ingresos del día/mes.
o	Pacientes activos.
o	Tasa de inasistencia.
o	Tasa de conversión (evaluación → paquete).
o	Tasa de adherencia (pacientes que completan el paquete).
o	Tasa de ocupación del centro (sobre las 44 horas semanales).
Responsable: Recepcionista / Administrador.
Sistema: Módulo de Caja y Reportes.
Reglas de Negocio Asociadas:
•	RN-30: Todo pago debe estar asociado a un paciente y a un concepto (sesión individual, evaluación o paquete).
•	RN-31: No se puede cerrar la caja si hay pagos pendientes de registrar.
•	RN-32: Los reportes deben poder exportarse en formato PDF y Excel.
•	RN-33: El administrador es el único que puede ver los reportes financieros completos.
________________________________________
5. REGLAS DE NEGOCIO CONSOLIDADAS
ID	Regla de Negocio	Módulo Afectado
RN-01	La primera sesión siempre es de evaluación y se cobra como sesión individual.	Clínico / Caja
RN-02	La sesión de evaluación NO descuenta sesiones de paquete.	Clínico / Paquetes
RN-03	El psicólogo debe registrar un diagnóstico presuntivo (CIE-10 o DSM-5).	Clínico
RN-04	El psicólogo debe registrar un plan de tratamiento.	Clínico
RN-05	El paciente debe firmar un Consentimiento Informado.	Clínico / Legal
RN-06	El paquete se asigna solo después de la sesión de evaluación.	Paquetes
RN-07	Todo paquete tiene una vigencia de 90 días calendario.	Paquetes
RN-08	Las sesiones no consumidas dentro de la vigencia no son reembolsables.	Paquetes
RN-09	El sistema debe alertar cuando queden 2 sesiones o menos.	Paquetes / Notificaciones
RN-10	El sistema debe permitir pacientes con paquete y sin paquete.	Paquetes / Caja
RN-11	No se puede agendar una cita si el intervalo completo [horaInicio, horaFin] se solapa con otra cita del mismo psicólogo.	Citas
RN-12	No se puede agendar una cita fuera del horario laboral del psicólogo.	Citas
RN-13	No se puede agendar una cita en una fecha u hora pasada.	Citas
RN-14	Toda cita debe estar asociada a un paciente registrado y a un psicólogo activo.	Citas
RN-15	El sistema debe enviar recordatorios automáticos 24h antes.	Notificaciones
RN-16	Solo el psicólogo tratante puede ver y editar la nota de evolución.	Clínico / Seguridad
RN-17	El descuento de una sesión del paquete es automático al marcar asistencia.	Clínico / Paquetes
RN-18	Si el paciente no tiene paquete, se registra como "Pago Pendiente".	Clínico / Caja
RN-19	La nota de evolución no puede quedar vacía.	Clínico
RN-20	El sistema debe autoguardar la nota cada 2 minutos.	Clínico
RN-21	No se puede eliminar una nota de evolución; solo rectificar.	Clínico
RN-22	Toda cancelación debe realizarse con al menos 24 horas de anticipación (sin penalización).	Citas
RN-22b	Si el paciente cancela con menos de 24h o no asiste, se aplica penalización.	Citas / Paquetes
RN-23	Si el paciente cancela con menos de 24h o no asiste, se descuenta la sesión.	Citas / Paquetes
RN-24	Si el paciente no tiene paquete, se genera un cobro pendiente.	Citas / Caja
RN-25	Se permite reprogramar sin penalización solo si se avisó con anticipación.	Citas
RN-26	La historia clínica es confidencial y solo accesible por el psicólogo tratante.	Clínico / Seguridad
RN-27	Todo acceso a una historia clínica debe quedar registrado en un log de auditoría.	Seguridad / Auditoría
RN-28	La historia clínica debe conservarse según la normativa legal vigente (a validar).	Clínico
RN-29	Al finalizar el tratamiento, el psicólogo debe emitir un Informe de Alta.	Clínico
RN-30	Todo pago debe estar asociado a un paciente y a un concepto.	Caja
RN-31	No se puede cerrar la caja si hay pagos pendientes de registrar.	Caja
RN-32	Los reportes deben poder exportarse en PDF y Excel.	Reportes
RN-33	El administrador es el único que puede ver los reportes financieros completos.	Reportes / Seguridad
RN-34	El centro atiende de lunes a viernes de 9:00 a.m. a 6:00 p.m.	Citas / Agenda
RN-35	El centro atiende los sábados de 9:00 a.m. a 1:00 p.m.	Citas / Agenda
RN-36	El centro no atiende domingos ni feriados.	Citas / Agenda
RN-37	El horario de refrigerio es de 1:00 p.m. a 2:00 p.m. (lunes a viernes).	Citas / Agenda
RN-38	Los psicólogos solo pueden tener citas dentro del horario de atención del centro.	Citas / Agenda
RN-39	El sistema debe bloquear automáticamente el horario de refrigerio.	Citas / Agenda
RN-40	El sistema debe bloquear automáticamente los domingos y feriados.	Citas / Agenda
RN-41	La agenda diaria debe mostrar visualmente el bloque de refrigerio.	Citas / Agenda
RN-42	El sistema debe permitir configurar feriados nacionales y locales.	Citas / Configuración
RN-43	El indicador de ocupación se calcula como: (minutos ocupados / minutos disponibles) × 100.	Reportes
RN-44	El descuento de una sesión se registra como un movimiento en la tabla MovimientoSesion.	Paquetes / Caja
RN-45	Si se revierte una cita, se registra un movimiento de REVERSION que sume la sesión.	Paquetes / Caja
RN-46	Cada cita debe tener como máximo un movimiento de consumo.	Paquetes / Caja
RN-47	Solo el psicólogo tratante puede crear, leer y actualizar notas de evolución.	Clínico / Seguridad
RN-48	El psicólogo puede descargar sus propias notas clínicas (con marca de agua y auditoría).	Clínico / Seguridad
RN-49	El administrador puede ver logs de auditoría pero no el contenido de las notas.	Seguridad / Auditoría
RN-50	El paciente puede solicitar una copia de su historia clínica (derecho de acceso).	Clínico / Legal
RN-51	Las notas de evolución no se eliminan; solo se rectifican con una nota adicional.	Clínico
RN-52	La recepcionista puede ver los metadatos de la cita pero no el contenido clínico.	Clínico / Seguridad
RN-53	La duración total del bloque reservado para una terapia es de 60 minutos (50 de atención + 10 de transición).	Citas / Agenda
RN-54	La duración total del bloque reservado para una evaluación es de 60 minutos.	Citas / Agenda
________________________________________
6. ROLES DEL SISTEMA Y PERMISOS
6.1. Permisos por Rol y Módulo
Módulo	Administrador	Recepcionista	Psicólogo
Pacientes	CRUD completo	CRUD completo	Solo lectura (sus pacientes)
Psicólogos	CRUD completo	Solo lectura	Solo su propio perfil
Citas	CRUD completo	CRUD completo	Solo lectura (sus citas)
Paquetes	CRUD completo	CRUD completo	Solo lectura (sus pacientes)
Pagos	CRUD completo	CRUD completo	Sin acceso
Historia Clínica (contenido)	Sin acceso	Sin acceso	CRUD (sus pacientes)
Historia Clínica (metadatos: fecha, paciente)	Solo lectura	Solo lectura	CRUD
Logs de Auditoría	Solo lectura	Sin acceso	Sin acceso
Reportes	CRUD completo	Solo reportes operativos	Solo sus reportes
Configuración	CRUD completo	Sin acceso	Sin acceso
________________________________________
7. GLOSARIO DE TÉRMINOS
•	Paciente: Persona que recibe servicios de psicoterapia.
•	Psicólogo: Profesional de la salud mental que atiende a los pacientes.
•	Sesión de Evaluación: Primera cita clínica donde se realiza la anamnesis, examen mental y diagnóstico presuntivo.
•	Plan de Tratamiento: Documento donde el psicólogo define objetivos, enfoque, frecuencia y número de sesiones.
•	Paquete terapéutico: Bloque de sesiones prepagadas con vigencia limitada.
•	Sesión de terapia: Unidad de atención psicológica con duración de 50 minutos + 10 min de transición.
•	Nota de evolución (SOAP): Registro clínico de cada sesión.
•	Historia clínica: Conjunto de documentos y registros de la evolución de un paciente.
•	Consentimiento Informado: Documento legal que el paciente firma antes de iniciar terapia.
•	Informe de Alta: Documento que se emite al finalizar el tratamiento.
•	No-Show: Paciente que no asiste a su cita sin previo aviso.
•	Cruce de horarios: Dos citas programadas en el mismo horario para el mismo psicólogo.
•	Arqueo de caja: Proceso de cuadre de ingresos diarios.
•	CIE-10: Clasificación Internacional de Enfermedades (códigos de diagnóstico).
•	DSM-5: Manual Diagnóstico y Estadístico de los Trastornos Mentales.
•	Refrigerio: Horario de descanso del personal (1:00 p.m. – 2:00 p.m. L-V).
•	Feriado: Día no laborable configurado en el sistema.
•	MovimientoSesion: Registro de cada consumo, penalización o reversión de sesiones.
________________________________________
8. FLUJO COMPLETO DEL PACIENTE (RESUMEN VISUAL)
text
PACIENTE NUEVO
     ↓
[1] Registro de datos (Recepcionista)
     ↓
[2] Agendar cita de EVALUACIÓN (60 min, presencial) → Cobro individual
     ↓
[3] Psicólogo realiza evaluación → Historia Clínica de Evaluación
     ↓
[4] Psicólogo registra diagnóstico (CIE-10) y PLAN DE TRATAMIENTO
     ↓
[5] Paciente firma CONSENTIMIENTO INFORMADO
     ↓
[6] Psicólogo propone PAQUETE (ej. 8 sesiones)
     ↓
[7] Paciente acepta → Recepcionista vende PAQUETE
     ↓
[8] Agendar sesión 1 de 8 → Presencial (bloque de 60 min: 50 atención + 10 transición)
     ↓
[9] Psicólogo atiende → Marca asistencia → Descuenta 1 sesión (MovimientoSesion)
     ↓
[10] Psicólogo registra NOTA DE EVOLUCIÓN (SOAP)
     ↓
[11] Repetir pasos 8-10 hasta agotar paquete
     ↓
[12] Alerta: "Quedan 2 sesiones" → ¿Renovar?
     ↓
[13] Fin del tratamiento → Informe de Alta
________________________________________
9. PRODUCT BACKLOG (MVP + VERSIONES POSTERIORES)
9.1. Visión del Producto
El sistema web para el Centro Psicológico Axioma tiene como visión ser una plataforma integral que gestione de forma segura y eficiente las citas, los paquetes terapéuticos y las historias clínicas, garantizando la confidencialidad de la información y la optimización de los procesos administrativos y clínicos.
9.2. MVP (Producto Mínimo Viable) - Lo que se entregará en el curso
Fase 1: Fundamentos y Seguridad (Sprint 1)
ID	Como...	Quiero...	Para...	Prioridad	Estimación
HU-01	Administrador	Iniciar sesión en el sistema	Acceder de forma segura al panel administrativo	Alta	8
HU-02	Psicólogo	Iniciar sesión en el sistema	Acceder al módulo clínico restringido	Alta	8
HU-03	Administrador	Gestionar roles y permisos	Controlar el acceso a los módulos del sistema	Alta	8
Fase 2: Pacientes y Horarios (Sprint 2)
ID	Como...	Quiero...	Para...	Prioridad	Estimación
HU-04	Administrador	Registrar a los psicólogos	Añadir un nuevo usuario que ingresa a laborar	Alta	16
HU-05	Administrador	Modificar datos de psicólogos	Corregir información desactualizada	Media	8
HU-06	Administrador	Ver lista de psicólogos activos	Controlar el personal disponible	Alta	4
HU-07	Administrador	Configurar horarios de psicólogos	Definir su disponibilidad respetando el horario del centro	Alta	16
HU-08	Administrador	Registrar a un nuevo paciente	Agregar los datos de las personas que inician terapia	Alta	16
HU-09	Administrador	Modificar datos del paciente	Mantener su información de contacto actualizada	Media	8
HU-10	Administrador	Buscar paciente por DNI	Encontrar rápidamente su historial administrativo	Alta	8
HU-40	Administrador	Configurar el horario de atención del centro	Definir los bloques disponibles	Alta	8
HU-41	Administrador	Configurar el horario de refrigerio	Bloquear automáticamente ese horario	Alta	4
Fase 3: Agendamiento y Paquetes (Sprint 3)
ID	Como...	Quiero...	Para...	Prioridad	Estimación
HU-15	Administrador	Registrar "paquetes de sesiones"	Ingresar los tipos de paquetes terapéuticos y sus precios	Alta	16
HU-16	Administrador	Asignar un paquete a un paciente	Controlar la venta y contabilizar las sesiones	Alta	16
HU-17	Administrador	Ver estado de paquetes activos	Saber cuántas sesiones quedan y cuándo vencen	Alta	8
HU-19	Administrador	Registrar una cita médica	Reservar un espacio validando horario, refrigerio, domingos y feriados	Alta	16
HU-20	Administrador	Reprogramar una cita médica	Liberar el espacio actual y asignarlo a una nueva fecha	Media	16
HU-21	Administrador	Ver la agenda diaria	Visualizar las citas del día y el bloque de refrigerio	Alta	8
HU-22	Administrador	Cancelar una cita	Registrar la cancelación y aplicar la política de penalización	Media	8
HU-29	Recepcionista	Registrar el pago de una sesión individual	Llevar el control de ingresos por sesión suelta	Alta	8
HU-30	Recepcionista	Registrar el pago de un paquete	Llevar el control de ingresos por paquetes prepagados	Alta	8
HU-42	Administrador	Configurar los feriados del año	Bloquear automáticamente esos días	Media	8
Fase 4: Atención Clínica (Sprint 4)
ID	Como...	Quiero...	Para...	Prioridad	Estimación
HU-11	Psicólogo	Registrar la Historia Clínica de Evaluación	Documentar la anamnesis, examen mental y diagnóstico presuntivo	Alta	16
HU-12	Psicólogo	Registrar el Plan de Tratamiento	Definir objetivos, enfoque, frecuencia y número de sesiones	Alta	16
HU-13	Recepcionista	Registrar el Consentimiento Informado	Cumplir con la normativa legal antes de iniciar terapia	Alta	8
HU-24	Psicólogo	Ver mis citas del día	Conocer qué pacientes voy a atender	Alta	8
HU-25	Psicólogo	Marcar la asistencia de un paciente	Descontar automáticamente una sesión del paquete	Alta	8
HU-26	Psicólogo	Crear nota de evolución clínica (SOAP)	Registrar el resumen de la terapia realizada	Alta	16
HU-28	Psicólogo	Registrar la inasistencia de un paciente	Aplicar la política de penalización	Alta	8
Fase 5: Automatización y Reportes (Sprint 5) - Versiones Posteriores
ID	Como...	Quiero...	Para...	Prioridad	Estimación
HU-14	Psicólogo	Emitir el Informe de Alta	Cerrar el tratamiento del paciente de forma documentada	Media	16
HU-18	Sistema	Alertar cuando queden 2 sesiones o menos	Notificar al paciente y a la recepcionista	Alta	8
HU-23	Sistema	Enviar recordatorios automáticos	Reducir el ausentismo	Alta	8
HU-27	Psicólogo	Ver el historial de notas clínicas	Revisar la evolución pasada del paciente	Alta	12
HU-31	Recepcionista	Realizar el arqueo de caja	Cuadrar los ingresos del día	Media	8
HU-32	Administrador	Generar reporte de citas atendidas	Conocer el volumen de atenciones del mes	Alta	16
HU-33	Administrador	Generar reporte de ingresos	Conocer la situación financiera	Alta	16
HU-34	Administrador	Generar reporte de tasa de inasistencia	Medir el impacto de los recordatorios	Media	8
HU-35	Administrador	Ver log de auditoría de historias clínicas	Saber quién accedió a qué información	Alta	16
HU-36	Administrador	Ver tasa de ocupación del centro	Medir qué porcentaje de las 44 horas semanales se usa	Media	8
HU-37	Sistema	Enviar recordatorio 24h antes de la cita	Reducir el ausentismo	Alta	8
HU-38	Sistema	Enviar alerta de paquete por agotarse	Notificar al paciente y recepcionista	Alta	8
HU-39	Sistema	Enviar alerta de pago pendiente	Recordar al paciente que tiene un saldo por pagar	Media	8
________________________________________
10. MODELO DE DATOS PROPUESTO
10.1. Entidades Principales
Entidad	Descripción
Usuario	Personas que acceden al sistema.
Rol	Roles del sistema (ADMIN, RECEPCIONISTA, PSICOLOGO).
Psicologo	Datos del profesional de salud mental.
HorarioPsicologo	Disponibilidad laboral del psicólogo.
ConfiguracionHorario	Horario de atención del centro (L-V 9-18, Sáb 9-13).
Feriado	Días no laborables configurados.
Paciente	Datos personales del paciente.
HistoriaClinicaEvaluacion	Registro de la primera sesión.
PlanTratamiento	Objetivos, enfoque, frecuencia y número de sesiones.
Diagnostico	Código CIE-10/DSM-5 y descripción.
ConsentimientoInformado	Documento firmado por el paciente.
Paquete	Catálogo de paquetes.
PaquetePaciente	Asignación de paquete a un paciente.
MovimientoSesion	Registro de cada consumo, penalización o reversión.
Cita	Cita agendada (fecha, hora, estado, paciente, psicólogo).
EvolucionClinica	Nota SOAP de cada sesión.
Pago	Registro de pagos.
InformeAlta	Documento de cierre del tratamiento.
LogAuditoria	Registro de accesos a historias clínicas.
Recordatorio	Notificaciones enviadas a los pacientes.
10.2. Tabla ConfiguracionHorario
Campo	Tipo	Descripción
id	INT (PK)	Identificador
diaSemana	ENUM	LUNES a DOMINGO
horaInicio	TIME	Hora de apertura
horaFin	TIME	Hora de cierre
tieneRefrigerio	BOOLEAN	Si aplica refrigerio
horaInicioRefrigerio	TIME	Inicio del refrigerio (nullable)
horaFinRefrigerio	TIME	Fin del refrigerio (nullable)
activo	BOOLEAN	Si el día está activo
10.3. Tabla Feriado
Campo	Tipo	Descripción
id	INT (PK)	Identificador
fecha	DATE	Fecha del feriado
descripcion	VARCHAR(100)	Descripción
activo	BOOLEAN	Si está activo
10.4. Tabla MovimientoSesion
Campo	Tipo	Descripción
id	INT (PK)	Identificador
paquetePacienteId	INT (FK)	Paquete afectado
citaId	INT (FK)	Cita asociada (nullable)
tipo	ENUM	CONSUMO, PENALIZACION, REVERSION, COMPRA, AJUSTE
cantidad	INT	Sesiones afectadas (+/-)
fecha	TIMESTAMP	Fecha del movimiento
motivo	VARCHAR(200)	Descripción del movimiento
Restricción UNIQUE: UNIQUE(citaId, tipo) para evitar duplicados.
10.5. Restricciones e Índices
Entidad	Restricción / Índice	Propósito
Usuario	UNIQUE(correo)	Evitar correos duplicados.
Paciente	UNIQUE(dni)	Evitar pacientes duplicados.
MovimientoSesion	UNIQUE(citaId, tipo)	Evitar descuentos duplicados.
Paciente	INDEX(dni)	Búsqueda rápida.
Cita	INDEX(fecha)	Consultas por día.
LogAuditoria	INDEX(usuarioId, entidadAfectada, entidadId)	Auditoría eficiente.
Nota sobre cruce de citas: No se puede usar un UNIQUE simple en Cita(psicologoId, fecha, horaInicio) porque no detecta solapamientos con horas de inicio diferentes. La validación debe hacerse en el backend con una consulta de solapamiento:
sql
SELECT * FROM Cita
WHERE psicologoId = ?
  AND fecha = ?
  AND estado NOT IN ('CANCELADA', 'REPROGRAMADA')
  AND (horaInicio < nuevoHoraFin AND horaFin > nuevoHoraInicio)
10.6. Diagrama de Clases (Simplificado)
text
Usuario (id, correo, contraseñaHash, rol, estaActivo)
    ↓
Rol (id, nombre)
    ↓
Psicologo (id, usuarioId, dni, nombres, apellidos, especialidad, numeroColegiatura)
    ↓
HorarioPsicologo (id, psicologoId, diaSemana, horaInicio, horaFin)
    ↓
ConfiguracionHorario (id, diaSemana, horaInicio, horaFin, tieneRefrigerio, horaInicioRefrigerio, horaFinRefrigerio, activo)
    ↓
Feriado (id, fecha, descripcion, activo)
    ↓
Paciente (id, dni, nombres, apellidos, telefono, email, fechaNacimiento)
    ↓
HistoriaClinicaEvaluacion (id, pacienteId, psicologoId, fecha, anamnesis, examenMental, diagnosticoId)
    ↓
Diagnostico (id, codigoCIE10, descripcion)
    ↓
PlanTratamiento (id, pacienteId, psicologoId, objetivos, enfoque, frecuencia, numSesiones)
    ↓
ConsentimientoInformado (id, pacienteId, fechaFirma, documentoUrl)
    ↓
Paquete (id, nombre, numSesiones, precio, vigenciaDias)
    ↓
PaquetePaciente (id, pacienteId, paqueteId, sesionesRestantes, fechaInicio, fechaFin, estado)
    ↓
MovimientoSesion (id, paquetePacienteId, citaId, tipo, cantidad, fecha, motivo)
    ↓
Cita (id, pacienteId, psicologoId, paquetePacienteId, fecha, horaInicio, horaFin, duracionAtencion, duracionBloque, estado)
    ↓
EvolucionClinica (id, citaId, pacienteId, psicologoId, subjetivo, objetivo, analisis, plan, fecha)
    ↓
Pago (id, pacienteId, concepto, monto, metodoPago, fecha)
    ↓
InformeAlta (id, pacienteId, psicologoId, fecha, motivoAlta, recomendaciones)
    ↓
LogAuditoria (id, usuarioId, accion, entidadAfectada, entidadId, fecha)
    ↓
Recordatorio (id, citaId, pacienteId, tipo, fechaEnvio, estado)
________________________________________
11. PLAN DE DESARROLLO EN 5 FASES
Fase	Sprint	Módulo	Dependencias	Entregable
Fase 1: Fundamentos y Seguridad	Sprint 1	Usuarios, login, roles, permisos, BD	Ninguna	Cada usuario accede únicamente a las funcionalidades autorizadas.
Fase 2: Pacientes y Horarios	Sprint 2	CRUD pacientes, psicólogos, horarios, configuración	Fase 1	El centro puede registrar pacientes y configurar horarios.
Fase 3: Agendamiento y Paquetes	Sprint 3	Citas, agenda, paquetes, pagos	Fase 2	El centro puede agendar citas y vender paquetes. No consume sesiones.
Fase 4: Atención Clínica	Sprint 4	Evaluación, plan, notas SOAP, consumo de sesiones	Fase 3	El psicólogo puede atender y registrar la evolución clínica.
Fase 5: Automatización y Reportes	Sprint 5	Recordatorios, reportes, auditoría	Fase 4	Versión completa con automatización y reportes.
________________________________________
12. PREGUNTAS PARA VALIDAR CON EL DUEÑO DEL NEGOCIO
12.1. Preguntas críticas (bloquean el diseño de la BD)
#	Pregunta	Supuesto actual	Estado
1	¿Cuál es el precio de la evaluación inicial?	S/ 80 (supuesto)	Pendiente
2	¿Cuánto cuesta una sesión de terapia individual?	S/ 70 (supuesto)	Pendiente
3	¿Cuál es el precio de los paquetes (4, 8, 12 sesiones)?	S/ 280, S/ 520, S/ 720 (supuestos)	Pendiente
4	¿Se puede pagar sesión por sesión sin comprar paquete?	Sí (supuesto)	Pendiente
5	¿Qué ocurre exactamente cuando un paciente cancela tarde o no asiste?	Se descuenta la sesión (supuesto)	Pendiente
6	¿Todos los psicólogos comparten el mismo horario y refrigerio?	Sí (supuesto)	Pendiente
7	¿Cuántos psicólogos y consultorios tiene realmente el centro?	3 psicólogos, 3 consultorios (supuesto)	Pendiente
8	¿Cuál es el plazo legal aplicable para conservar las historias clínicas?	5 años (referencia, a validar)	Pendiente
9	¿La transición de 10 minutos entre pacientes es real?	Sí (supuesto del equipo)	Pendiente
10	¿El administrador debe poder leer las notas clínicas o solo auditar los accesos?	Solo auditar (supuesto)	Pendiente
12.2. Preguntas secundarias (afectan el diseño, pero no bloquean)
#	Pregunta	Supuesto actual	Estado
11	¿El psicólogo es quien vende el paquete o la recepcionista?	Recepcionista (supuesto)	Pendiente
12	¿Los psicólogos trabajan por comisión o sueldo fijo?	Sueldo fijo (supuesto)	Pendiente
13	¿Qué pasa si el paciente abandona la terapia?	Se archiva la historia clínica (supuesto)	Pendiente
14	¿Se atiende a pacientes nuevos los sábados?	Sí (supuesto)	Pendiente
15	¿El centro maneja un solo local o varias sedes?	Un solo local (supuesto)	Pendiente
16	¿El horario de refrigerio es el mismo para todos los psicólogos o se turnan?	Mismo horario (supuesto)	Pendiente
17	¿Qué pasa si un psicólogo necesita salir antes de su horario?	Se bloquea su agenda (supuesto)	Pendiente
________________________________________
13. SUPUESTOS PENDIENTES DE VALIDACIÓN
Los siguientes supuestos se han utilizado para completar el documento, pero deben ser validados con el dueño del negocio antes de implementarlos:
#	Supuesto	Impacto si es incorrecto	Módulo afectado
1	El precio de la evaluación inicial es S/ 80.	Afecta el módulo de caja y reportes.	Caja
2	El precio de una sesión de terapia es S/ 70.	Afecta el módulo de caja y reportes.	Caja
3	Los paquetes tienen precios preferenciales (S/ 280, S/ 520, S/ 720).	Afecta el módulo de paquetes y caja.	Paquetes
4	Se permite pago por sesión individual.	Afecta el módulo de caja.	Caja
5	La cancelación tardía descuenta la sesión del paquete.	Afecta el módulo de citas y paquetes.	Citas
6	Todos los psicólogos comparten el mismo horario y refrigerio.	Afecta la configuración de horarios.	Configuración
7	El centro tiene 3 psicólogos y 3 consultorios.	Afecta la capacidad operativa y reportes.	Reportes
8	El plazo legal de conservación es 5 años.	Afecta el módulo de historias clínicas.	Clínico
9	La transición de 10 minutos es real.	Afecta la duración de los bloques de cita.	Citas
10	El administrador NO puede leer las notas clínicas.	Afecta el módulo de seguridad y auditoría.	Seguridad
Acción requerida: Enviar esta lista al dueño del negocio y obtener confirmación por escrito antes de la Fase 4 (Atención Clínica).
________________________________________
14. CONCLUSIÓN
Este documento establece las bases del funcionamiento del Centro Psicológico Axioma y las reglas que regirán el desarrollo del sistema web. Es importante que el equipo de desarrollo revise y valide estas reglas con el dueño del negocio antes de continuar con los siguientes Sprints, ya que cualquier cambio en las reglas de negocio impactará directamente en el diseño de la base de datos, la lógica de negocio y la interfaz de usuario.
La inclusión del horario de atención (L-V 9-18 con refrigerio de 13-14, Sáb 9-13), la regla de duración de citas (evaluación 60 min, terapia 50 min + 10 min de transición), la separación entre auditoría y acceso clínico, y la tabla MovimientoSesion son fundamentales para garantizar la consistencia, la seguridad y la trazabilidad del sistema.
El proyecto se desarrollará bajo un enfoque de MVP, priorizando las funcionalidades críticas para la operación del centro. Las funcionalidades restantes se documentarán como visión del producto y se implementarán en versiones posteriores.
________________________________________
Elaborado por: Equipo de Desarrollo (Joao Moises Inga Gallo y Hector Sebastian Reyes Fatama)
Revisado por: Mg. Anita Condo Lopez
Aprobado por: Teresa Sanchez Pinilla (Dueño del Negocio)

