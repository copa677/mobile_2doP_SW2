# PRODUCT.md — GymPulse Executive Mobile App

## Product Vision
GymPulse es una aplicación móvil diseñada específicamente para el dueño o gerente general de un gimnasio. Su propósito central es permitir la consulta y generación de **reportes ejecutivos dinámicos e inteligentes** mediante lenguaje natural procesado por un **SLM local (Small Language Model)** en el dispositivo móvil, sin exponer datos privados de socios o finanzas a la nube.

## Target User & Context
- **Usuario principal:** Dueño o director de operaciones del gimnasio.
- **Contexto de uso:** En movimiento, revisando el rendimiento del club desde su teléfono celular.
- **Necesidad:** En lugar de navegar por decenas de tablas o esperar reportes manuales al final del mes, el dueño pregunta en lenguaje natural (ej. *"¿Cómo estuvo la asistencia de spinning hoy comparada con la semana pasada?"* o *"Hazme un balance de ingresos y socios en riesgo de este mes"*).
- **Expectativa:** Respuestas inmediatas, directas, con números precisos calculados por el sistema y visualizaciones limpias (gráficos compactos y narrativa ejecutiva).

## Architecture & Data Flow
1. **Frontend Móvil:** React Native (Expo SDK 57, Expo Router, TypeScript).
2. **Inferencia Local (SLM):** Modelo Qwen3 (1.7B / 4B) ejecutado localmente con cuantización Q4_K_M vía runtime nativo (NobodyWho / llama.cpp).
3. **Mecanismo de Tool Calling (Function Calling):**
   - El SLM no calcula ni hace consultas SQL directas.
   - Invoca funciones TypeScript tipadas (`obtener_resumen_diario`, `obtener_resumen_financiero`, `obtener_rendimiento_clases`, etc.).
4. **Backend for Frontend (BFF) / Microservicios:**
   - Orquesta y agrega datos de las 3 bases de datos del gimnasio:
     - **PostgreSQL:** Membresías, transacciones financieras, socios, planes.
     - **MongoDB:** Clases, programación de horarios, instructores, perfiles de entrenamiento.
     - **DynamoDB:** Check-ins de alta frecuencia, accesos por torniquetes, eventos de asistencia.
   - Devuelve payloads JSON compactos y pre-calculados (totales, promedios, rankings).
5. **Capa de Presentación:**
   - Tarjetas de KPIs y gráficos nativos generados a partir de los datos crudos del BFF.
   - Narrativa ejecutiva y conclusiones redactadas por el SLM.
   - Fallback determinista automático si el SLM se demora o entra en timeout.

## Core Value Propositions
- **100% Privado y Seguro:** Cero filtración de datos sensibles del negocio a APIs externas.
- **Velocidad y Agilidad:** Herramientas compuestas para resolver reportes complejos en un solo round-trip.
- **Presentación Ejecutiva:** Nada de jerga técnica; métricas de negocio claras (MRR, Churn, Ocupación de sala, Socios en riesgo).
