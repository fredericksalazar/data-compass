# DataCompass - Design System & UI/UX Guidelines

## 1. Identidad Visual (Tailwind CSS)

Este documento es la fuente de verdad para cualquier componente visual creado en la carpeta `/web`. SIEMPRE debes usar estas clases de Tailwind para mantener la coherencia.

### Colores (Paleta B2B Corporativa)

* **Background Principal:** `bg-slate-50` (Gris extremadamente claro, casi blanco, reduce fatiga visual).
* **Superficies (Cards/Modales):** `bg-white`.
* **Color Primario (Botones principales, acentos):** `bg-blue-600` (Hover: `bg-blue-700`).
* **Texto Principal (Títulos):** `text-slate-900`.
* **Texto Secundario (Párrafos, subtítulos):** `text-slate-600`.
* **Bordes y Divisores:** `border-slate-200`.

### Tipografía y Espaciado

* **Fuente:** Utiliza la tipografía sans-serif por defecto de Tailwind (`font-sans`).
* **Títulos (H1):** `text-3xl font-bold tracking-tight text-slate-900`.
* **Subtítulos (H2/H3):** `text-xl font-semibold text-slate-800`.
* **Cuerpo de texto:** `text-base text-slate-600 leading-relaxed`.

## 2. Componentes UI Base

* **Botón Primario:** `inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`.
* **Tarjetas (Cards):** `rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`.
* **Opciones de Selección (Radio Cards para el Wizard):** - Estado normal: `cursor-pointer rounded-lg border-2 border-slate-200 p-4 hover:border-blue-300 transition-colors bg-white`.
  * Estado seleccionado: `cursor-pointer rounded-lg border-2 border-blue-600 bg-blue-50 p-4 transition-colors`.

## 3. Directivas de UX (Experiencia de Usuario)

* **Zero Friction:** Los formularios deben ser de un solo clic donde sea posible. En el cuestionario, hacer clic en toda la tarjeta de la opción debe seleccionarla (no obligar a hacer clic en un pequeño radio button).
* **Feedback Visual:** Todo elemento interactivo debe tener una transición suave (`transition-all duration-200`).
* **Layout Mínimo B2B:** Evita distracciones. El Header solo debe tener el logo, sin menús complejos durante el flujo de evaluación.

### NUEVA SECCIÓN: Estilos Premium Hero Zone

* **Fondo Hero (Tecnológico):** Usar un fondo oscuro profundo (`bg-slate-950`) o blanco puro (`bg-white`) CON un patrón de cuadrícula sutil (`background-image: dot-pattern`) y una animación de partículas JS/CSS interactiva (nodos y conexiones).
* **Degradado de Texto (H1):** `bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500`.
* **Botón Hero Premium (Glow):** Mantener `bg-blue-600` pero añadir un sutil *shadow glow* azul (`shadow-[0\_0\_30px\_-5px\_rgba(37,99,235,0.5)]`).
