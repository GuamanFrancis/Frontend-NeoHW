# NeoHW - Plataforma E-commerce y Simulador de Ensamblaje de PC en 3D con IA (Frontend)

Proyecto de Titulación | Escuela Politécnica Nacional | 2026

🌐 **Sitio Web Oficial Desplegado:** [https://neo-hw.vercel.app](https://neo-hw.vercel.app)

---

## Tabla de Contenidos
- [Descripción del Proyecto](#descripción-del-proyecto)
- [Roles y Credenciales de Acceso](#roles-y-credenciales-de-acceso)
- [Arquitectura del Cliente (Frontend)](#arquitectura-del-cliente-frontend)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Funcionalidades y Guía de Revisión por Rol](#funcionalidades-y-guía-de-revisión-por-rol)
- [Pruebas Recomendadas para los Evaluadores](#pruebas-recomendadas-para-los-evaluadores)
- [Autores](#autores)
- [Licencia](#licencia)

---

## Descripción del Proyecto
Este repositorio contiene el código correspondiente al **Frontend** de la plataforma **NeoHw**. El sistema digitaliza la venta de componentes de hardware e integra un simulador interactivo en 3D capaz de asistir en el montaje físico lógico de pcs acompañado de un chatbot que funciona mediante  AI y su proposito es recomendar espeficicaciones y componentes compatibles.

###  Problema Resuelto
Las plataformas de hardware tradicionales no guían activamente al comprador, lo que propicia:
- Errores y daños físicos durante el ensamblaje del pc.
- Compras accidentales de piezas físicamente incompatibles.
- Devoluciones y costos adicionales de logística por errores de compatibilidad.

###  Solución Implementada
- **Simulador 3D Interactivo**: Visualización espacial tridimensional en tiempo real del ensamblaje del hardware del pc utilizando Three.js.
- **Motor de Validación de Compatibilidad**: Reglas que verifican compatibilidad física (dimensiones de componentes, diametro, sockets) y lógica (potencia requerida, etc) en tiempo real.
- **Asistente de IA (Gemini)**: Chat inteligente integrado al simulador que analiza las piezas montadas para dar diagnósticos técnicos del pc a ensamblar.
- **Módulos Administrativos y de Venta**: Paneles de control para la gestión de productos, inventario, stock y control del flujo de pedidos.

---

## Roles y Credenciales de Acceso
Se definen los siguientes perfiles de acceso en el sistema desplegado:

| Rol | Propósito en el Sistema | Credenciales de Prueba |
| :--- | :--- | :--- |
| **Administrador** | Gestión total de usuarios, catálogo de componentes y reglas de compatibilidad del simulador. | *Consulte las credenciales provistas en el trabajo de integracin curricular.* |
| **Vendedor** | Control operativo del inventario (existencias físicas) y despacho de pedidos. | *Consulte las credenciales provistas en el trabajo de integracin curricular* |
| **Cliente** | Creación de ensambles 3D, chat de IA, proceso de compra simulado (Checkout con Stripe) y seguimiento de órdenes. | *Puede registrarse de manera libre usando un correo electrónico real/de prueba.* |

---

## Arquitectura del Cliente (Frontend)
La aplicación frontend se construyó bajo un enfoque moderno:
- **Capa del Cliente:** Escrita en **React + TypeScript + Vite**, responsable del renderizado en navegador, gestión de estados tridimensionales (Three.js/Fiber) y validación de formularios.
- **Consumo de Servicios:** Se conecta directamente con la API REST del backend mediante **Axios**, enviando solicitudes con credenciales seguras (JWT/Cookies) basadas en las variables de entorno del servidor.

---

## Tecnologías Utilizadas
| Tecnología | Uso en el Frontend |
| :--- | :--- |
| **React (v19.2.5)** | Biblioteca base para la estructuración de la interfaz de usuario. |
| **TypeScript (v6.0.2)** | Tipado estático y robustez del código fuente. |
| **Vite (v8.0.10)** | Servidor de desarrollo y compilador optimizado. |
| **Tailwind CSS (v4.2.4)** | Diseño adaptativo y estilos modulares modernos. |
| **Three.js (v0.184.0) / Fiber (v9.6.1)** | Motor de renderizado interactivo para el simulador de PC en 3D. |
| **Framer Motion (v12.38.0)** | Animaciones y transiciones fluidas de la interfaz. |
| **Axios (v1.16.0)** | Cliente de comunicación HTTP con la API del Backend. |
| **React Router (v7.15.0)** | Sistema de enrutamiento y control de accesos por roles del cliente. |
| **React Hook Form (v7.75.0)** | Gestión y validación estructural de los campos de los formularios. |
| **Lucide React (v1.14.0)** | Librería de iconos vectoriales interactivos para la interfaz. |

---

## Instalación
Para instalar y ejecutar el proyecto frontend de forma local:

1. **Clonar el Repositorio**
   ```bash
   git clone <url-del-repositorio-frontend>
   cd Frontend-NeoHW
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   ```

3. **Iniciar en Modo de Desarrollo**
   ```bash
   npm run dev
   ```

---

## Configuración de Variables de Entorno 
Si desea ejecutar el código del frontend de manera local, cree un archivo `.env.local` en la raíz del proyecto. Defina la variable según el servidor al que desee apuntar:

```env
# URL de la API del Backend.
#
# Para apuntar al servidor de producción, se recomienda utilizar:
# https://neohw-backend.onrender.com/api/v1
#
# Para apuntar al servidor de desarrollo local, utilice:
# http://localhost:3000/api/v1

VITE_API_URL=
```

---

## Funcionalidades y Guía de Revisión por Rol

###  Rol Cliente (Simulación y Compra)
1. **Pestaña 'Armar mi PC' (Simulador 3D e IA)**:
   - Interfaz interactiva 3D para arrastrar, rotar y ubicar físicamente componentes en el gabinete.
   - Guía interactiva paso a paso para el orden lógico de armado de hardware.
   - Panel de chat de soporte con inteligencia artificial (Gemini) integrado, que analiza el ensamble actual.
2. **Pestaña 'Ver catálogo'**:
   - Catálogo de componentes con filtrado por categoría, marca y especificaciones técnicas.
3. **Pestaña 'Mi carrito'**:
   - Gestión de productos seleccionados y metodo de pago simulado mediante Stripe.
4. **Pestaña 'Mis compras'**:
   - Historial de órdenes de compra y seguimiento del estado de entrega.
5. **Pestaña 'Mis ensambles'**:
   - Módulo de proyectos de ensambles guardados por el cliente desde el simulador.
6. **Pestaña 'Mi perfil'**:
   - Actualización de información personal y de contacto del cliente.

###  Rol Vendedor (Operaciones Comerciales)
1. **Pestaña 'Pedidos de clientes'**:
   - Listado operativo para supervisar pedidos y actualizar estados de entrega ("Procesando", "Enviado", "Entregado").
2. **Pestaña 'Inventario'**:
   - Listado detallado de existencias de hardware, incluyendo alertas de disponibilidad ("Disponible", "Stock bajo" o "Agotado").
3. **Pestaña 'Estadisticas de ventas'**:
   - Panel gráfico del balance general de ingresos y rendimiento por categorías propias .
4. **Pestaña 'Mi cuenta'**:
   - Datos personales y de acceso del vendedor.

###  Rol Administrador (Gestión y Control)
1. **Pestaña 'Gestionar usuarios'**:
   - Administración, registro y asignación de roles a cuentas del sistema.
2. **Pestaña 'Gestionar catalogo'**:
   - Creación, edición y configuración de especificaciones técnicas y compatibilidades de productos.
3. **Pestaña 'Ver inventario'**:
   - Vista general del estado de existencias físicas y stock disponible del catálogo.
4. **Pestaña 'Estadisticas de ventas'**:
   - Gráficos interactivos de ingresos totales, volumen de proyectos y stock crítico del sistema.
5. **Pestaña 'Mi cuenta'**:
   - Datos personales y de acceso de la cuenta del administrador.

---

## Autores
- **Desarrollador:** Guaman Ilvis Francis Josue
- **Tutor Académico:** Ing. Lorena Chulde - Escuela Politécnica Nacional (EPN)

---

## Licencia
Este proyecto ha sido desarrollado como trabajo de titulación con fines académicos y de investigación.

Derechos de Autor Francis Guaman © 2026. Todos los derechos reservados.
