# NeoHW - Plataforma E-commerce y Simulador de Ensamblaje de PC en 3D con IA (Frontend)

Proyecto de Titulación | Escuela Politécnica Nacional | 2026

🌐 [Ver Sitio](https://neo-hw.vercel.app/login) | 📖 [Documentación Técnica](file:///E:/Sicnarf/Imagenes%20Gemini/modelo%20ai%20ecu%20def/entrenamiento/motion%20control/Tesis/tesis/README.md) |

---

## 📋 Tabla de Contenidos
- [Descripción del Sistema](#-descripción-del-sistema)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roles y Permisos](#-roles-y-permisos)
- [Funcionalidades por Módulo](#-funcionalidades-por-módulo)
- [Guía de Uso](#-guía-de-uso)
- [Despliegue](#-despliegue)
- [Testing](#-testing)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## 🎯 Descripción del Sistema
**NeoHW** es una plataforma web diseñada para la simulación interactiva tridimensional de ensambles de computadoras y la comercialización de hardware de PC. El sistema integra un entorno de simulación 3D interactivo en la web, un asistente inteligente de ayuda técnica contextualizado y un módulo e-commerce completo con gestión automatizada de compras, pedidos e inventarios.

Este repositorio contiene el código correspondiente al **Frontend** del proyecto, el cual se comunica con una API REST backend para la persistencia de datos y el procesamiento de solicitudes.

### 🏢 Problema Resuelto
Las plataformas e-commerce de hardware convencionales carecen de herramientas interactivas que guíen al usuario en el proceso de compatibilidad de los componentes, generando:
- ❌ Dificultad o errores al realizar el ensamblaje físico del computador.
- ❌ Falta de asesoramiento técnico que guíe a los compradores a saber qué componentes elegir según sus necesidades durante el proceso de compra.
- ❌ Compras incorrectas de hardware incompatible.

### ✅ Solución Implementada
Una plataforma web interactiva que digitaliza y asiste en el proceso de compra de hardware:
- ✔️ **Simulador 3D interactivo** para la visualización espacial del ensamblaje del hardware.
- ✔️ **Motor de compatibilidad lógica y física** automático que previene errores de montaje (validación de sockets, dimensiones SFF y consumo energético).
- ✔️ **Asistente conversacional de IA** alimentado por Gemini que proporciona diagnósticos basados en el hardware ensamblado en el simulador.
- ✔️ **Módulo de compras interactivo** para el cliente, y administración de stock de inventario para el administrador y vendedor.

---

## ✨ Características Principales

### 🖥️ Simulador PC 3D Interactivo
- **Montaje Paso a Paso:** Interfaz tridimensional interactiva construida sobre Three.js y React Three Fiber.
- **Secuencia de Ensamble Lógica:** Guía estructurada del orden de ensamble en el simulador (Gabinete ➔ Procesador ➔ Refrigeración/Cooler ➔ Memorias RAM ➔ Tarjeta Gráfica ➔ Fuente de Poder ➔ Almacenamiento).
- **Indicadores de Colocación:** Guías visuales que muestran la ubicación correcta de cada pieza en el gabinete para facilitar el ensamblaje.

### ⚙️ Motor de Validación de Compatibilidad
- **Validación de Sockets:** Verificación física entre el Procesador, la Placa Madre y el Disipador (Cooler) seleccionado.
- **Restricción de Espacio (SFF Clearance):** Control de dimensiones máximas de altura de Cooler y largo de Tarjeta Gráfica (GPU) respecto al Gabinete seleccionado.
- **Validación Dinámica:** Bloqueo al intentar añadir componentes incompatibles al simulador, notificando de manera descriptiva el motivo específico (incompatibilidad de socket, espacio insuficiente o consumo superior a la fuente de poder).

### 🤖 Asistente de IA (Gemini Chat)
- **Chat de Soporte Integrado:** Soporte conversacional contextualizado en la interfaz del simulador que envía la lista de los componentes montados para ofrecer recomendaciones precisas de optimización o alternativas compatibles.

### 📦 Gestión de Catálogo y Formularios (Módulo de Administración)
- **Validación de Campos de Formularios:** Módulo de administración con validación automática de campos clave (nombre, marca, precio, stock, descripción y URL de imagen) y validación de tipos de datos en especificaciones técnicas según la categoría del hardware.
- **Especificaciones Dinámicas:** Atributos técnicos globales vinculables de forma flexible a categorías de hardware específicas (SELECT, TEXT, NUMBER, BOOLEAN).

---

## 🏗️ Arquitectura del Sistema

La arquitectura del sistema completo se basa en un diseño desacoplado de cliente-servidor:
- **Frontend (React + Vite):** Capa del lado del cliente escrita en TypeScript que gestiona la interfaz tridimensional (Three.js), el estado del simulador, el procesamiento del carrito y los módulos de usuario (Administrador, Vendedor y Cliente). Se comunica con el servidor a través de peticiones HTTP con Axios y un proxy de desarrollo de Vite.
- **Backend (API NestJS):** Capa del servidor que expone servicios REST. Se encarga de la lógica de negocio, validación de autenticación mediante JWT, integración del modelo de IA (Gemini), procesamiento de pagos con la API de Stripe y comunicación con la base de datos.
- **Base de Datos (PostgreSQL):** Almacenamiento relacional que gestiona los datos de usuarios, productos, categorías, atributos de compatibilidad y pedidos, mapeados en el servidor mediante un ORM (Prisma).

### 🔄 Flujo de Datos por Rol
- **Cliente:** Realiza la simulación de ensambles en 3D, interactúa con el chat de IA, añade componentes al carrito, realiza el pago con Stripe y consulta el historial de sus pedidos.
- **Vendedor:** Monitorea los pedidos pendientes de entrega y actualiza sus estados, además de gestionar las cantidades y el stock de productos en el inventario.
- **Administrador:** Administra la creación de usuarios y la asignación de sus roles. Configura el catálogo de hardware, categorías, atributos dinámicos y las reglas de compatibilidad que rigen el simulador.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| **React** | 19.2.5 | Framework base para el desarrollo de la interfaz de usuario. |
| **TypeScript** | 6.0.2 | Programación con tipado estático y compilación estructurada. |
| **Vite** | 8.0.10 | Herramienta de compilación rápida y servidor de desarrollo. |
| **React Router** | 7.15.0 | Enrutamiento de cliente y protección de accesos. |
| **Tailwind CSS** | 4.2.4 | Estilizado y diseño modular de interfaces. |
| **Three.js** | 0.184.0 | Renderizado del espacio interactivo 3D. |
| **React Three Fiber** | 9.6.1 | Enlace declarativo de objetos 3D en componentes React. |
| **React Three Drei** | 10.7.7 | Componentes y controles preestablecidos de ayuda para R3F. |
| **Framer Motion** | 12.38.0 | Creación de animaciones y micro-interacciones de la interfaz. |
| **Axios** | 1.16.0 | Cliente HTTP para la comunicación con la API. |
| **React Hook Form** | 7.75.0 | Gestión y validación estructural de formularios. |
| **Lucide React** | 1.14.0 | Paquete de iconos vectoriales interactivos. |

### DevOps & Herramientas
- **Git:** Control de versiones del código fuente.
- **Vercel:** Despliegue optimizado del Frontend.
- **Railway:** Infraestructura para el backend y base de datos relacional.
- **VS Code:** Entorno de desarrollo recomendado.

---

## 📦 Requisitos Previos

Se requiere tener instalados los siguientes componentes antes de iniciar la instalación del proyecto:
* **Node.js** (Versión 20.x o superior)
* **npm** (Versión 10.x o superior)
* **Git** (Cualquier versión reciente)

---

## 🚀 Instalación

### 1. Clonar el Repositorio
Ejecutar el comando de clonación:
```bash
git clone <url-del-repositorio-frontend-neohw>
cd Frontend-NeoHW
```

### 2. Instalar Dependencias
Instalar las dependencias declaradas en el proyecto:
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear un archivo `.env.local` en el directorio raíz de la carpeta del Frontend. Asegurarse de definir los valores según el entorno (desarrollo local o servidor de backend desplegado):
```env
# URL base del Backend para llamadas directas de la API (opcional en desarrollo).
VITE_API_URL=

# URL de destino para el proxy de desarrollo de Vite (redirecciona las llamadas locales a la API).
# Utilizar 'http://localhost:3000' si el backend se ejecuta localmente.
# Utilizar la URL de producción si se desea probar contra el backend desplegado (ej. 'https://neohw-backend.onrender.com').
VITE_DEV_PROXY_TARGET=http://localhost:3000

# ID de Cliente de Google OAuth 2.0 (requerido para habilitar el inicio de sesión / registro con Google).
VITE_GOOGLE_CLIENT_ID=su-id-de-cliente-google.apps.googleusercontent.com

# ID de Aplicación de Facebook SDK (requerido para habilitar el inicio de sesión con Facebook).
VITE_FACEBOOK_APP_ID=su-id-de-app-facebook
```

### 4. Iniciar el Servidor de Desarrollo
Ejecutar el comando de inicio en modo de desarrollo:
```bash
npm run dev
```

### 5. Acceder a la Aplicación
Abrir el navegador web e ingresar a la dirección indicada por la consola:
```
http://localhost:3000
```

---

## ⚙️ Configuración

### 🌐 Configuración del Servidor y Proxy
El archivo `vite.config.ts` establece el puerto local `3000` y define las rutas redirigidas hacia la API del backend:
```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        '/auth': { target: backendTarget, changeOrigin: true },
        '/carts': { target: backendTarget, changeOrigin: true },
        '/projects': { target: backendTarget, changeOrigin: true },
        '/users': { target: backendTarget, changeOrigin: true },
        '/products': { target: backendTarget, changeOrigin: true },
        '/categories': { target: backendTarget, changeOrigin: true },
        '/attributes': { target: backendTarget, changeOrigin: true },
        '/compatibility': { target: backendTarget, changeOrigin: true },
        '/ai': { target: backendTarget, changeOrigin: true },
        '/orders': { target: backendTarget, changeOrigin: true },
        '/payments': { target: backendTarget, changeOrigin: true }
      }
    }
  };
});
```

---

## 📁 Estructura del Proyecto

```
Frontend-NeoHW/
├── public/                       # Archivos estáticos y favicon
│   └── favicon.jpg               # Logo personalizado en la pestaña del navegador
├── src/                          # Código fuente de la aplicación
│   ├── assets/                   # Imágenes, modelos 3D y texturas
│   ├── components/               # Componentes reutilizables
│   │   ├── layout/               # Diseños generales (DashboardLayout, PublicHeader)
│   │   └── ui/                   # Componentes base (Button, FormInput, FormSelect, Modal)
│   ├── context/                  # Contextos globales de React (Autenticación, Simulador)
│   ├── pages/                    # Vistas principales ordenadas por rol
│   │   ├── administrador/        # Dashboard, gestión de catálogo y usuarios
│   │   ├── auth/                 # Registro, login, verificación y recuperación
│   │   ├── cliente/              # Catálogo de e-commerce, carrito y pedidos
│   │   ├── home/                 # Página de bienvenida
│   │   ├── shared/               # Perfil de usuario (Mi Cuenta)
│   │   ├── simulator/            # Scene 3D, AssemblySlots, ChatbotDrawer
│   │   └── vendedor/             # Pedidos, estadísticas e inventario
│   ├── routes/                   # Configuración de rutas (AppRoutes)
│   ├── services/                 # Llamadas a API externa (Auth, Catalog, Orders)
│   ├── types/                    # Tipos globales de TypeScript
│   ├── index.css                 # Estilos globales y configuraciones de Tailwind
│   ├── main.tsx                  # Punto de entrada de la aplicación
│   └── App.tsx                   # Renderizado y estructura principal
├── tsconfig.json                 # Configuración del compilador TypeScript
└── vite.config.ts                # Configuración de compilación y servidor Vite
```

---

## 👥 Roles y Permisos

El sistema gestiona accesos restringidos mediante tres perfiles principales:

### 🔴 Administrador
* **Acceso Total:** Posee el control absoluto sobre el catálogo y usuarios.
* **Permisos:**
  - Registrar, modificar y desactivar cuentas de usuarios (Clientes, Vendedores y Administradores).
  - Gestionar el catálogo global de productos de hardware.
  - Administrar categorías de hardware y sus especificaciones dinámicas (atributos).
  - Crear y configurar reglas de compatibilidad de componentes para el simulador.
  - Consultar estadísticas globales del rendimiento de la plataforma.

### 🟠 Vendedor
* **Gestión de Stock y Pedidos:** Responsable del control operativo comercial.
* **Permisos:**
  - Visualizar e ingresar existencias en el inventario global.
  - Procesar pedidos realizados por clientes (gestión del estado de entrega/envío).
  - Acceder a informes gráficos e históricos de ingresos financieros y productos más vendidos.

### 🟢 Cliente
* **Autoservicio y Simulación:**
* **Permisos:**
  - Modificar datos del perfil y consultar estado de compras.
  - Realizar simulaciones de ensamble 3D, verificar alertas de compatibilidad física y guardar proyectos.
  - Consultar con el asistente de IA para recomendaciones y diagnósticos del ensamble.
  - Añadir componentes al carrito de compras, procesar el pedido y realizar el pago mediante Stripe.

---

## 📋 Funcionalidades por Módulo

### 1. Módulo de Autenticación y Cuentas
| Funcionalidad | Descripción | Roles Autorizados |
| :--- | :--- | :--- |
| **Inicio de Sesión** | Autenticación con credenciales registradas y persistencia JWT. | Todos los roles |
| **Registro de Cliente** | Creación de cuenta desde el módulo de registro público. | Público general |
| **Verificación de Email** | Activación de cuenta mediante código enviado por correo. | Cliente nuevo |
| **Recuperación** | Envío de correo de recuperación para cambio de contraseña. | Todos los roles |

### 2. Módulo del Simulador PC 3D
| Funcionalidad | Descripción | Roles Autorizados |
| :--- | :--- | :--- |
| **Montaje de Componentes** | Interfaz interactiva 3D en la que se ubican piezas físicamente. | Público y Cliente |
| **Validación de Sockets** | Impedir la inserción de procesadores o disipadores incompatibles. | Público y Cliente |
| **Cálculo de Consumo** | Medición de TDP acumulado contra la potencia de la fuente de poder. | Público y Cliente |
| **Asistente de IA** | Panel lateral que genera sugerencias específicas sobre el ensamble actual. | Público y Cliente |
| **Guardar Proyecto** | Guardar la configuración montada en el simulador en la base de datos. | Cliente |

### 3. Módulo de Compras (E-Commerce)
| Funcionalidad | Descripción | Roles Autorizados |
| :--- | :--- | :--- |
| **Búsqueda y Filtros** | Catálogo con filtrado por marca, precio y especificaciones. | Todos los roles |
| **Gestión del Carrito** | Agregar componentes directamente desde la simulación o el catálogo. | Cliente |
| **Pasarela de Stripe** | Procesamiento transaccional simulado mediante tarjeta de crédito. | Cliente |
| **Historial de Pedidos** | Seguimiento de las órdenes en proceso de entrega. | Cliente |

---

## 🎮 Guía de Uso

### 👨‍💻 Para Clientes
1. **Registrarse:** Acceder a la página principal, dar clic en "Registrarse" y completar el formulario de registro. Verificar la cuenta mediante el código recibido en el correo electrónico.
2. **Crear una Simulación 3D:** Ingresar a la sección "Simulador AI". Seleccionar el gabinete, la placa madre y los componentes compatibles guiándose por las ranuras de colocación interactiva.
3. **Conversar con el Asistente de IA:** Dar clic en el icono del chat del simulador. Escribir consultas como *¿Qué tarjeta gráfica me recomiendas para este ensamble?*; el asistente analizará el estado de la placa y componentes montados automáticamente.
4. **Finalizar Compra:** Agregar el ensamble al carrito, rellenar los datos de envío y proceder al pago con Stripe.

### 💼 Para Administradores y Vendedores
1. **Administrar Usuarios (Admin):** Entrar al dashboard de administrador en la ruta `/admin/usuarios` para crear nuevos vendedores, actualizar perfiles o deshabilitar cuentas.
2. **Configurar el Catálogo y Compatibilidades (Admin):** Acceder a la pestaña `/admin/catalogo`. Aquí se pueden registrar componentes, categorías y reglas lógicas que validen la interacción del hardware en el simulador.
3. **Controlar el Inventario (Vendedor/Admin):** Revisar las existencias de productos en `/vendedor/inventario` o `/admin/inventario`.
4. **Gestionar Pedidos (Vendedor):** Desde `/vendedor/pedidos`, se puede supervisar el flujo de pedidos y actualizar su estado a "Enviado" o "Entregado" una vez realizada la logística física.

---

## 📦 Despliegue

Para realizar un despliegue optimizado para producción, se deben seguir los siguientes pasos:

### 1. Compilar el Proyecto
Generar la carpeta del compilado de distribución (`dist`):
```bash
npm run build
```
Este proceso valida los tipos con TypeScript y minifica el código HTML, CSS y JS del cliente.

### 2. Configurar Servidor de Producción (ej: Vercel)
Asegurarse de crear la redirección de rutas SPA (`rewrites` o `redirects`) para evitar fallos de recarga de página (Error 404).

Ejemplo de configuración para `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🧪 Testing

Se dispone de un plan de pruebas estructurado para garantizar el comportamiento estable de la interfaz:

### Checklist de Pruebas Manuales
* **Prueba de Autenticación:** Intentar acceder a `/admin` o `/cliente` sin sesión activa (el sistema debe redirigir a `/login`).
* **Prueba del Simulador:** Montar una placa madre y luego un procesador con socket distinto; verificar que el simulador bloquee el montaje e informe del error de socket.
* **Prueba del Carrito:** Agregar una simulación de ensamble completa al carrito y verificar que se calculen los subtotales e impuestos correctos antes del checkout.
* **Prueba de Responsividad:** Validar que la cuadrícula del simulador y los menús de navegación colapsen de forma fluida en resoluciones móviles y pantallas táctiles.

---

## 👨‍💻 Autores

- **Desarrollador:**  Guaman Ilvis Francis Josue
- **Tutor Académico:** Ing. Lorena Chulde - Escuela Politécnica Nacional (EPN)

---

## 📄 Licencia

Este proyecto ha sido desarrollado como trabajo de titulación con fines académicos y de investigación.

Derechos de Autor Francis Guaman © 2026. Todos los derechos reservados.
