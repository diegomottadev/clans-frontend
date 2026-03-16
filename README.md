# Clans View - Instituto Clans

Frontend del sistema de gestión educativa **Instituto Clans**, una aplicación web para administrar estudiantes, cursos, pagos, evaluaciones, asistencias y más.

## Tecnologías

- **React** 17 con React Router 5
- **PrimeReact** 6.1.0 — componentes UI
- **PrimeFlex** 2.0.0 — utilidades CSS
- **FullCalendar** — calendario interactivo
- **Chart.js** — gráficos y reportes
- **Quill** — editor de texto enriquecido
- **Axios** — cliente HTTP
- **Sass** — preprocesador CSS

## Módulos principales

| Módulo | Descripción |
|---|---|
| Estudiantes | Alta, baja y modificación de alumnos |
| Docentes | Gestión de profesores |
| Cursos | Administración de cursos por idioma y nivel |
| Evaluaciones | Creación y seguimiento de evaluaciones |
| Asistencias | Control de asistencia |
| Pagos | Costos fijos, pagos a docentes, cuotas e intereses |
| Reportes | Analíticas de asistencia, pagos, inscripciones y más |
| Calendario | Vista de clases y eventos |
| Configuración | Idiomas, niveles, tipos de curso, aulas, horarios, usuarios |

## Requisitos previos

- [Node.js](https://nodejs.org/) (v14 o superior recomendado)
- npm o yarn
- Backend de Instituto Clans corriendo (API REST)

## Instalación

```bash
git clone https://github.com/tu-usuario/clans-view.git
cd clans-view
npm install
```

## Variables de entorno

Crear un archivo `.env.development` en la raíz del proyecto:

```env
REACT_APP_BASE_URL=http://localhost:8080
PUBLIC_URL=http://localhost:8080
```

Para producción, crear `.env.production`:

```env
REACT_APP_BASE_URL=https://tu-api.dominio.com
PUBLIC_URL=
```

## Scripts disponibles

```bash
npm start       # Inicia el servidor de desarrollo en http://localhost:3000
npm run build   # Genera el build de producción en /build
npm test        # Ejecuta los tests
```

## Estructura del proyecto

```
src/
├── components/     # Componentes reutilizables
├── helpers/        # Autenticación y configuración de API
├── layout/         # Estilos globales (Sass) e íconos
├── pages/          # Páginas organizadas por módulo
│   ├── students/
│   ├── teachers/
│   ├── courses/
│   ├── evaluations/
│   ├── assistances/
│   ├── payments/
│   ├── reports/
│   ├── calendar/
│   └── ...
└── App.js          # Layout principal, rutas y navegación
```

## Características destacadas

- **Control de acceso por roles** — menús diferenciados para administrador y usuario
- **Autenticación JWT** — token almacenado en localStorage con interceptor Axios
- **Tablas con carga lazy** — paginación eficiente con DataTable de PrimeReact
- **Localización en español** — calendarios, formatos de fecha y UI en español
- **Diseño responsive** — adaptado para escritorio y dispositivos móviles

## Capturas

<!-- Agrega capturas de pantalla aquí si lo deseas -->

## Licencia

Este proyecto es privado y de uso interno.
