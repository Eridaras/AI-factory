# Features Overview

> **Nota**: Este documento debe ser generado por Claude durante la **Fase 2.5** del ecosistema de auditoría.
> 
> Documenta las principales funcionalidades del sistema de forma que puedan ser:
> - Reutilizadas por otros desarrolladores
> - Rediseñadas en un stack diferente
> - Implementadas desde cero en un nuevo proyecto

---

## Feature: [Nombre claro de la funcionalidad]

### Dominio / Propósito
[Explicación en lenguaje de negocio: ¿qué problema resuelve esta funcionalidad?]

**Ejemplo**: 
> Esta funcionalidad permite a los usuarios administradores gestionar suscripciones de pago, 
> procesando pagos mensuales/anuales a través de Stripe y manejando el ciclo completo de 
> facturación (creación, renovación, cancelación).

### Módulos / Archivos Implicados
- `[path/to/module1.py]` - [Breve descripción de responsabilidad]
- `[path/to/module2.py]` - [Breve descripción de responsabilidad]
- `[path/to/module3.py]` - [Breve descripción de responsabilidad]

**Ejemplo**:
- `src/billing/service.py` - Lógica de negocio de facturación
- `src/billing/routes.py` - Endpoints HTTP para operaciones de suscripción
- `src/billing/models.py` - Modelos de datos (Subscription, Invoice)
- `src/billing/stripe_client.py` - Integración con Stripe API

### Flujo de Datos (Entrada → Salida)

1. **[Paso 1]**: [Descripción de la entrada o acción inicial]
2. **[Paso 2]**: [Descripción del procesamiento]
3. **[Paso 3]**: [Descripción de la validación o transformación]
4. **[Paso 4]**: [Descripción de la salida o efecto]

**Ejemplo**:
1. **Entrada**: Usuario selecciona un plan de suscripción y proporciona método de pago
2. **Validación**: Sistema verifica que el usuario está autenticado y el plan existe
3. **Procesamiento**: Se crea un customer en Stripe y se genera una subscription
4. **Persistencia**: Se guarda la suscripción en la BD local con referencia a Stripe
5. **Salida**: Se retorna el ID de suscripción, estado y próxima fecha de facturación

### Interfaces / Contratos

#### Endpoints / APIs
- **Método**: [GET/POST/PUT/DELETE]
- **Ruta**: `/api/[resource]`
- **Autenticación**: [Requerida/Opcional/Pública]

#### Input (Request)
```json
{
  "campo1": "tipo y descripción",
  "campo2": "tipo y descripción"
}
```

#### Output (Response - Success)
```json
{
  "campo1": "tipo y descripción",
  "campo2": "tipo y descripción"
}
```

#### Errores Posibles
- `400 Bad Request`: [Cuándo ocurre]
- `401 Unauthorized`: [Cuándo ocurre]
- `404 Not Found`: [Cuándo ocurre]
- `500 Internal Server Error`: [Cuándo ocurre]

**Ejemplo**:
```
Endpoint: POST /api/subscriptions
Autenticación: Bearer token (requerida)

Input:
{
  "plan_id": "string (UUID del plan)",
  "user_id": "string (UUID del usuario)",
  "payment_method": "string (ID del método de pago en Stripe)"
}

Output (success):
{
  "subscription_id": "uuid",
  "status": "active|pending|failed",
  "next_billing_date": "ISO 8601 date",
  "amount": 99.99,
  "currency": "USD"
}

Errores:
- 400: Si plan_id o payment_method son inválidos
- 401: Si el token de autenticación es inválido
- 402: Si el pago inicial falla en Stripe
- 404: Si el plan_id no existe
- 500: Si hay error al comunicarse con Stripe o BD
```

### Dependencias Críticas

#### Base de Datos
- **Tablas**: `[nombre_tabla]` - [Descripción]
- **Relaciones**: [Describe las relaciones importantes]

**Ejemplo**:
- **Tablas**: 
  - `subscriptions` (id, user_id, plan_id, stripe_subscription_id, status, created_at, expires_at)
  - `invoices` (id, subscription_id, stripe_invoice_id, amount, status, paid_at)
  - `plans` (id, name, price, interval, features)
- **Relaciones**: 
  - subscription → user (many-to-one)
  - subscription → plan (many-to-one)
  - invoice → subscription (many-to-one)

#### Servicios Externos
- **[Nombre del servicio]**: [Propósito y endpoints usados]

**Ejemplo**:
- **Stripe**: 
  - API de Customers (create, retrieve)
  - API de Subscriptions (create, update, cancel)
  - API de Payment Methods (attach)
  - Webhooks: `invoice.paid`, `customer.subscription.deleted`

#### Middlewares / Dependencias Internas
- `[nombre]`: [Propósito]

**Ejemplo**:
- `auth_middleware`: Valida JWT y carga datos del usuario
- `logging_middleware`: Registra todas las operaciones de facturación
- `rate_limiter`: Limita intentos de creación de suscripciones

### Suposiciones / Limitaciones

Lista de supuestos importantes del diseño actual:

**Ejemplo**:
1. **Un usuario solo puede tener una suscripción activa a la vez**
   - Limitación del modelo actual; cambiar requeriría refactor de BD
2. **Los pagos se procesan exclusivamente vía Stripe**
   - No hay abstracción para múltiples pasarelas de pago
3. **Los webhooks de Stripe se procesan síncronamente**
   - Puede causar timeouts en picos de tráfico; considerar queue
4. **No hay manejo de impuestos**
   - Los precios son finales; no se calculan impuestos por región
5. **Las cancelaciones son inmediatas**
   - No hay período de gracia o reembolsos parciales
6. **Fechas de facturación están en UTC**
   - Puede causar confusión si usuarios están en zonas horarias diferentes

---

## Feature: [Otra funcionalidad]

[Repetir la estructura anterior para cada funcionalidad identificada]

---

## Notas Finales

### Funcionalidades Candidatas para Reutilización
[Lista las funcionalidades que son más independientes y reutilizables]

**Ejemplo**:
- ✅ **Autenticación JWT**: Bien abstraída, fácil de portar
- ✅ **Sistema de notificaciones**: Usa queue, independiente del resto
- ⚠️ **Facturación**: Muy acoplada a Stripe, requiere abstracción
- ❌ **Reporting**: Código legacy con queries complejas, mejor reescribir

### Funcionalidades Críticas para Migración
[Lista las funcionalidades que deben migrarse con cuidado especial]

**Ejemplo**:
- 🔴 **Facturación**: Datos financieros sensibles, requiere validación exhaustiva
- 🟠 **Autenticación**: Migración de sesiones activas debe ser transparente
- 🟡 **Notificaciones**: Puede recrearse; historial no es crítico
