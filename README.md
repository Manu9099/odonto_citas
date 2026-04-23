# Dental Clinic Backend

Backend base en **Java + Spring Boot + Maven** para una clínica odontológica con:

- autenticación JWT
- pacientes y odontólogos
- horarios del odontólogo
- creación y gestión de citas
- agenda diaria estilo calendario
- pagos desacoplados por pasarela
- recordatorios automáticos 24 horas antes
- frontend pensado para React

## Arquitectura sugerida

```text
src/main/java/com/clinica/dental
├── api
│   ├── controller
│   └── dto
├── application
│   ├── mapper
│   └── service
├── common
│   └── exception
├── config
├── domain
│   ├── enums
│   └── model
└── infrastructure
    ├── repository
    └── security
```

## Reglas importantes ya cubiertas

- Un usuario puede ser `ADMIN`, `DENTIST` o `PATIENT`.
- El perfil de odontólogo y paciente se separa de `users`.
- Las citas evitan cruces de horario a nivel de base de datos con `EXCLUDE USING gist`.
- Los recordatorios se generan al crear una cita.
- El despachador de notificaciones revisa pendientes cada minuto.
- La pasarela de pagos está desacoplada con `PaymentGateway`, para que luego cambies stub por MercadoPago o Stripe real.

## Endpoints base

### Auth
- `POST /api/auth/register/patient`
- `POST /api/auth/register/dentist`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Odontólogos
- `GET /api/dentists`
- `GET /api/dentists/{dentistId}/schedules`
- `GET /api/dentists/{dentistId}/availability?date=2026-04-21`
- `POST /api/dentists/me/schedules`

### Citas
- `POST /api/appointments`
- `GET /api/appointments/me`
- `GET /api/appointments/calendar/day?date=2026-04-21`
- `PATCH /api/appointments/{appointmentId}/status`

### Pagos
- `POST /api/payments`
- `GET /api/payments/appointment/{appointmentId}`
- `POST /api/payments/webhooks/{provider}?paymentId=...`

## Cómo correr local

### 1. Levanta PostgreSQL y Mailpit
```bash
docker compose up -d
```

Mailpit:
- SMTP: `localhost:1025`
- UI: `http://localhost:8025`

### 2. Configura variables
Copia `.env.example` y usa tus valores.

### 3. Ejecuta el proyecto
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## Recomendaciones para el frontend React

Te recomiendo este flujo:

1. **Página pública**
   - listar odontólogos
   - ver especialidad
   - ver disponibilidad por fecha

2. **Paciente autenticado**
   - reservar cita
   - ver mis citas
   - pagar cita
   - reprogramar/cancelar

3. **Odontólogo autenticado**
   - ver agenda diaria
   - confirmar/completar cita
   - registrar horarios

4. **Admin**
   - ver reportes
   - ver todas las citas
   - ver pagos
   - gestionar usuarios

## Siguientes mejoras que sí te convienen

- integrar Mercado Pago real
- webhook firmado real
- reprogramación de citas
- plantillas HTML de correo
- WhatsApp con Twilio o Meta Cloud API
- push notifications
- auditoría y trazabilidad
- tests unitarios y de integración
- paginación y filtros por rango de fechas
- multiclínica o multisede
- historias clínicas / odontograma

## Ojo técnico importante

En la migración agregué:

```sql
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

porque tu restricción:

```sql
EXCLUDE USING gist (dentist_id WITH =, tstzrange(...) WITH &&)
```

normalmente necesita esa extensión para soportar correctamente la comparación por igualdad sobre `BIGINT`.

## Swagger

Una vez corriendo:

- `http://localhost:8080/swagger-ui/index.html`

## Nota

Las pasarelas `MercadoPagoStubGateway` y `StripeStubGateway` están como base para que el proyecto ya tenga contrato limpio. Solo reemplazas su lógica por SDK oficial y mantienes tu capa de aplicación intacta.
