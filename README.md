# 🐾 ISAPET - Sistema de Gestión Veterinaria y Planes para Mascotas

Un sistema integral *Full-Stack* diseñado para gestionar afiliaciones de mascotas, historial clínico veterinario y control administrativo. Esta aplicación permite manejar diferentes roles de usuario, planes de suscripción y facturación básica.

## 🚀 Características Principales

El sistema está dividido en tres módulos principales según el rol del usuario:

### 👑 1. Panel de Administración (`admin`)
* **Gestión de Afiliados (CRUD):** Crear, leer, actualizar y eliminar clientes.
* **Gestión de Mascotas:** Añadir múltiples mascotas a un mismo dueño validando los límites según el plan adquirido (Implementación del Patrón Estrategia).
* **Control de Planes:** Asignación de planes (Básico, Premium).
* **Historial Clínico General:** Visualización del registro completo de atenciones médicas de todas las mascotas afiliadas.

### 🩺 2. Panel Veterinario (`vet`)
* **Búsqueda Rápida:** Búsqueda de clientes y verificación de estado mediante número de cédula.
* **Registro Médico:** Registro de nuevas atenciones (consultas, vacunas, procedimientos) en el historial clínico de la mascota.

### 👤 3. Portal del Afiliado (Cliente)
* **Estado de Cuenta:** Visualización del estado del plan (Activo/Inactivo) y listado de mascotas registradas.
* **Pagos:** Simulación y procesamiento de pago de mensualidades.
* **Simulador de Planes:** Consulta en tiempo real de los beneficios y tarifas de nuevos planes.
* **Gestión de Suscripción:** Opción para cambiar de plan o cancelar la suscripción actual.

---

## 🛠️ Tecnologías Utilizadas

**Frontend:**
* [React](https://reactjs.org/) - Biblioteca para interfaces de usuario.
* [Tailwind CSS](https://tailwindcss.com/) - Framework de utilidades CSS para un diseño responsivo y moderno.
* [React Hot Toast](https://react-hot-toast.com/) - Notificaciones (Toasts) elegantes e interactivas.

**Backend:**
* [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno y rápido para construir APIs con Python.
* [SQLAlchemy](https://www.sqlalchemy.org/) - ORM para la gestión y consulta de la base de datos.
* [Pydantic](https://docs.pydantic.dev/) - Validación de datos mediante anotaciones de tipos en Python.
* **Base de Datos:** SQLite (Configuración por defecto para desarrollo).

---

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### 1. Configuración del Backend (FastAPI)

1. Abre una terminal y navega a la carpeta del backend.
2. Crea un entorno virtual:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   ```
   Windows: venv\Scripts\activate
   Mac/Linux: source venv/bin/activate
   ```
4. Instala las dependencias necesarias:
   ```
   pip install fastapi uvicorn sqlalchemy pydantic
   ```
5. Inicia el servidor de desarrollo:
   ```
   uvicorn main:app --reload
   ```
El backend estará corriendo en http://127.0.0.1:8000

### 2. Configuración del Frontend (React)

1. Abre una nueva terminal y navega a la carpeta del frontend.
2. Instala las dependencias de Node:
   ```
   npm install
   ```
3. Instala dependencias adicionales (si no están en el package.json):
   ```
   npm install react-hot-toast
   ```
4. Inicia el servidor de desarrollo de React:
    ```
    npm run dev
    ```
### 🔐 Credenciales de Prueba por Defecto
Para probar la aplicación inmediatamente después de instalarla, usa las siguientes credenciales en el inicio de sesión:

# Administrador:
Usuario: admin
Contraseña: 1234

# Veterinaria:
Usuario: vet
Contraseña: vet123

# Afiliado:
Inicia sesión con el Número de Cédula registrado tanto para el usuario como para la contraseña.

### 🏛️ Arquitectura y Patrones de Diseño
RESTful API: El backend sigue los principios REST utilizando los métodos correctos (GET, POST, PUT, DELETE).

Modelos Pydantic: Se utilizan esquemas de Pydantic (UsuarioUpdate, UsuarioSchema) para validar estrictamente las peticiones JSON entrantes, previniendo errores 422.

Patrón Estrategia (Strategy): Implementado en el backend (PlanContext) para manejar la lógica de negocio y las restricciones (ej. límites de mascotas) de forma dinámica dependiendo del plan (Básico o Premium) del usuario.
