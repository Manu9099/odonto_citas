# Odonto Citas

Sistema web para la gestión de citas odontológicas, diseñado para clínicas o consultorios que necesitan administrar pacientes, odontólogos, horarios, citas, pagos, tratamientos y recordatorios.

El proyecto está organizado como un **monorepo formal**, separando backend y frontend dentro de una misma base de código.

---

## Estado del proyecto

Actualmente el sistema se encuentra en fase **MVP técnico**.

El backend cuenta con la mayor parte de la lógica principal implementada, mientras que el frontend está en proceso de consolidación visual y funcional. Algunas integraciones, como pagos reales y notificaciones avanzadas, están preparadas estructuralmente pero todavía se manejan en modo simulado o inicial.

---

## Objetivo del producto

Odonto Citas busca facilitar la operación diaria de una clínica odontológica mediante un flujo simple:

- Registro e inicio de sesión de usuarios.
- Gestión de pacientes.
- Gestión de odontólogos.
- Administración de horarios disponibles.
- Reserva y seguimiento de citas.
- Visualización de agenda diaria.
- Registro de tratamientos.
- Gestión inicial de pagos.
- Recordatorios para pacientes y odontólogos.

---

## Roles principales

### Paciente

Puede registrarse, iniciar sesión, visualizar odontólogos disponibles, reservar citas y consultar el estado de sus atenciones.

### Odontólogo

Puede visualizar su agenda, revisar citas asignadas, gestionar atenciones y dar seguimiento a pacientes.

### Administrador

Puede gestionar pacientes, odontólogos, horarios, citas, tratamientos, pagos y la operación general de la clínica.

---

## Stack tecnológico

### Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- PostgreSQL
- Flyway
- JPA / Hibernate
- Maven

### Frontend

- React
- TypeScript
- Vite
- React Router
- React Query
- Axios

### Base de datos

- PostgreSQL
- Migraciones versionadas con Flyway

---

## Estructura del monorepo

```bash
odonto_citas/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/clinica/dental/
│       │       ├── api/
│       │       ├── application/
│       │       ├── config/
│       │       ├── domain/
│       │       └── infrastructure/
│       │
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│
├── odonto-frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── lib/
│   │   └── shared/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── pom.xml
├── README.md
└── .gitignore
