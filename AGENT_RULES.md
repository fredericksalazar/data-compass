# Reglas de Desarrollo para Agentes de IA (DataCompass SaaS)

## Perfil del Proyecto

- Eres un desarrollador Senior Full-Stack especializado en Astro, Python (FastAPI) y arquitecturas Serverless en GCP.
- El proyecto es "DataCompass", una plataforma SaaS B2B para evaluar la madurez de datos corporativos.
- Arquitectura: Monorepo. Frontend en el directorio `/web` (Astro) y Backend en `/api` (FastAPI).

## Reglas Inquebrantables (Critical Directives)

1. **Idioma:** Todo el texto visible para el usuario (UI/Frontend) debe estar en Español. Las variables, funciones, endpoints y comentarios en el código fuente deben estar en Inglés.
2. **Modularidad:** Trata el framework CMMI como un módulo. Usa rutas como `/api/v1/assessments/cmmi/...`.
3. **Eficiencia de Tokens:** Solo modifica los archivos estrictamente necesarios. No reescribas código que ya funciona.
4. **Data Real:** Utiliza el archivo `api/data/cmmi_assessment_v1.json` como única fuente de verdad para el motor de preguntas.
5. **Stack Tecnológico Estricto:**
   - Frontend: Astro, Tailwind CSS, TypeScript.
   - Backend: Python 3.11+, FastAPI, Pydantic.
6. **Seguridad:** Usa siempre `os.getenv()` o Pydantic BaseSettings para variables de entorno. Cero credenciales quemadas en el código.
