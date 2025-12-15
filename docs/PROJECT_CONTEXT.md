# Project Context

> **Nota**: Este documento debe ser generado y actualizado por Claude al inicio y durante el proceso de auditoría.
> 
> Su propósito es proporcionar contexto rápido para retomar el trabajo en futuras sesiones sin pérdida de información.

---

## Información General

- **Nombre del proyecto**: [Nombre del proyecto]
- **Dominio / Industria**: [Ej: SaaS, E-commerce, Fintech, Healthcare]
- **Última actualización**: [YYYY-MM-DD]
- **Versión del ecosistema**: AI Factory Audit v1.0

---

## Objetivo de Negocio

[Descripción clara de qué hace el proyecto y qué problema de negocio resuelve]

**Ejemplo**:
> Plataforma SaaS para gestión de suscripciones y facturación recurrente.
> Permite a empresas B2B gestionar planes, procesar pagos automáticos vía Stripe,
> y generar reportes de ingresos recurrentes (MRR/ARR).

### Usuarios Principales
- [Tipo de usuario 1]: [Descripción]
- [Tipo de usuario 2]: [Descripción]

**Ejemplo**:
- **Administradores**: Gestionan planes, precios y configuración de facturación
- **Clientes**: Contratan suscripciones y consultan facturas
- **Contadores**: Generan reportes financieros y exportan datos

### Métricas Clave del Negocio
- [Métrica 1]: [Descripción]
- [Métrica 2]: [Descripción]

**Ejemplo**:
- **MRR (Monthly Recurring Revenue)**: $50K/mes
- **Usuarios activos**: 450 empresas
- **Tasa de retención**: 92%
- **Transacciones mensuales**: ~8,000

---

## Stack Tecnológico Principal

### Backend
- **Lenguaje**: [Lenguaje y versión]
- **Framework**: [Framework y versión]
- **Base de datos**: [BD y versión]
- **Cache**: [Sistema de cache y versión]
- **Message Queue**: [Si aplica]

**Ejemplo**:
- **Lenguaje**: Python 3.9
- **Framework**: Django 3.2
- **Base de datos**: PostgreSQL 12
- **Cache**: Redis 5.0
- **Message Queue**: Celery + Redis

### Frontend
[Si aplica]

**Ejemplo**:
- **Framework**: React 17.0
- **State Management**: Redux
- **Build Tool**: Webpack

### Infraestructura
- **Hosting**: [Proveedor]
- **CI/CD**: [Herramienta]
- **Monitoreo**: [Herramienta]

**Ejemplo**:
- **Hosting**: AWS (EC2 + RDS)
- **CI/CD**: GitHub Actions
- **Monitoreo**: Sentry + DataDog

---

## Estado General del Proyecto

### Fase Actual
- [ ] En desarrollo inicial
- [ ] En producción (beta)
- [x] En producción (estable)
- [ ] En mantenimiento
- [ ] Legacy (candidato a migración)

### Salud del Código
- **Cobertura de tests**: [X%]
- **Deuda técnica estimada**: [X días/semanas]
- **Documentación**: [Buena / Regular / Escasa]

**Ejemplo**:
- **Cobertura de tests**: 45% (bajo para producción)
- **Deuda técnica estimada**: ~30 días
- **Documentación**: Escasa (solo README básico)

### Estado del Stack
[Resumen del estado de las tecnologías]

**Ejemplo**:
> **Riesgo ALTO**: Django 3.2 en EOL desde abril 2024. Python 3.9 en security-fix-only.
> PostgreSQL 12 soportado pero antiguo. Necesita actualización urgente en próximos 1-3 meses.

---

## Riesgos Más Importantes

### Riesgos Técnicos 🔴
1. **[CRÍTICO]** [Descripción del riesgo]
   - **Impacto**: [Descripción del impacto]
   - **Mitigación sugerida**: [Recomendación]

2. **[ALTO]** [Descripción del riesgo]
   - **Impacto**: [Descripción del impacto]
   - **Mitigación sugerida**: [Recomendación]

**Ejemplo**:
1. **[CRÍTICO]** Inyección SQL en endpoint `/api/reports`
   - **Impacto**: Exposición total de datos de clientes y transacciones
   - **Mitigación**: Parametrizar queries inmediatamente

2. **[ALTO]** Stack en EOL (Django 3.2)
   - **Impacto**: Sin parches de seguridad, vulnerabilidades críticas posibles
   - **Mitigación**: Planificar migración a Django 5.0 en próximos 2 meses

### Riesgos de Negocio 🟠
1. [Descripción del riesgo de negocio]

**Ejemplo**:
1. Falta de redundancia en procesamiento de pagos
   - Si Stripe falla, no hay backup; pérdida de ingresos directa

---

## Contexto de Decisiones Pasadas

### Decisiones Arquitectónicas

**[Fecha]** - [Decisión tomada]
- **Razón**: [Por qué se tomó]
- **Consecuencias**: [Impacto actual]

**Ejemplo**:
**2024-03-15** - Se eligió Django + PostgreSQL en lugar de FastAPI
- **Razón**: Equipo con experiencia en Django, necesitaban admin panel out-of-the-box
- **Consecuencias**: Performance aceptable pero limitada; migración compleja si se requiere async

**2024-08-20** - Se integró Stripe como única pasarela de pagos
- **Razón**: Simplicidad de integración y costos competitivos
- **Consecuencias**: Dependencia fuerte; si Stripe cae, el negocio se detiene

### Auditorías Previas

**[Fecha]** - [Tipo de auditoría]
- **Hallazgos principales**: [Resumen]
- **Acciones tomadas**: [Qué se hizo]

**Ejemplo**:
**2024-11-01** - Auditoría de seguridad interna
- **Hallazgos**: 2 vulnerabilidades críticas (SQL injection, XSS)
- **Acciones**: Corregida SQL injection; XSS pendiente por falta de recursos

---

## Funcionalidades Principales

[Lista breve de las funcionalidades core del sistema]

**Ejemplo**:
1. **Autenticación y autorización** - JWT + roles (admin, user, accountant)
2. **Gestión de suscripciones** - CRUD de planes, contratación, renovación, cancelación
3. **Procesamiento de pagos** - Integración con Stripe, webhooks, reconciliación
4. **Facturación** - Generación de invoices, envío por email, descarga PDF
5. **Reporting** - MRR, ARR, churn rate, exportación CSV/Excel
6. **Notificaciones** - Email (renovaciones, fallos de pago) + SMS (opcional)

> Ver detalles completos en [`FEATURES_OVERVIEW.md`](./FEATURES_OVERVIEW.md)

---

## Próximos Pasos / Roadmap

### Corto Plazo (1-3 meses)
- [ ] [Acción 1]
- [ ] [Acción 2]

**Ejemplo**:
- [x] Corregir vulnerabilidades críticas (SEC-001, SEC-002)
- [ ] Actualizar Django 3.2 → 5.0
- [ ] Aumentar cobertura de tests a >70%

### Medio Plazo (3-6 meses)
- [ ] [Acción 1]

**Ejemplo**:
- [ ] Implementar redundancia en procesamiento de pagos (Stripe + PayPal)
- [ ] Migrar de EC2 a Kubernetes para mejor escalabilidad

### Largo Plazo (6-12 meses)
- [ ] [Acción 1]

**Ejemplo**:
- [ ] Considerar migración a FastAPI + async para mejor performance
- [ ] Implementar multi-tenancy real (actualmente soft-delete)

---

## Notas Adicionales

[Cualquier información relevante que no encaje en las secciones anteriores]

**Ejemplo**:
- El equipo actual tiene 3 devs backend (Python), 2 frontend (React), 1 DevOps
- No hay QA dedicado; testing es responsabilidad de cada dev
- Deploys son semanales (viernes tarde) con downtime de ~10 minutos
- Base de datos tiene 500GB de datos históricos; migraciones requieren cuidado

---

**Última revisión**: [YYYY-MM-DD HH:MM]  
**Responsable de actualización**: AI Factory Audit Ecosystem
