# 📖 Guía de Especificaciones Funcionales Ricas v2.2

## ✨ Nuevas capacidades (v2.2 - Business Semantics)

El MCP `feature-replicator` ahora genera **especificaciones funcionales completas** con contexto de negocio real, no solo listas de tablas y archivos. **La versión 2.2 añade semántica de negocio**: el MCP "cuenta la historia" de cada componente.

### 🎯 Qué incluye cada especificación:

1. **📋 Contexto de negocio CON PROPÓSITO REAL**
   - ✅ "Generar certificado comercial (PDF) para clientes/distribuidores"
   - ❌ NO: "Funcionalidad: certificadoClass" o "Es la clase de conexión"
   - Detecta propósito desde feature_id (CERTIFICADO-COMERCIAL, RAPPEL, CATALOGO)
   - Actores involucrados (Admin, Usuario, Vendedor)
   - Puntos de entrada (AJAX, URL directa, Menú)

2. **📥 Entradas CON SIGNIFICADO DE NEGOCIO**
   - ✅ "target_clnt_id: ID del cliente objetivo a certificar"
   - ❌ NO: "target_clnt_id: Form parameter"
   - Mapeo de parámetros técnicos a significado de negocio
   - Campos de formulario
   - Otras fuentes de datos

3. **📤 Salidas detalladas**
   - Tipo de salida (PDF, JSON, Excel, HTML)
   - Descripción del contenido
   - Estructura del documento (secciones, campos, etc.)

4. **🔄 Flujo de proceso CON BLOQUES LÓGICOS**
   - ✅ "Obtener datos del cliente (3 queries)"
   - ✅ "Consultar forma de pago (1 query)"
   - ❌ NO: "Ejecuta 13 queries"
   - Agrupa queries por propósito de negocio
   - Pasos numerados en lenguaje natural

5. **🗄️ Fuentes de datos con rol semántico**
   - ✅ "Obtener datos del cliente (nombre, dirección, contacto)"
   - ❌ NO: Solo "vSAPB2BRELACIONINTERLOCUTORES"
   - Cada tabla tiene su "role" de negocio

6. **⚖️ Reglas de negocio REALES**
   - ✅ "[CALCULATION] Cálculo de rappel como porcentaje de ventas: rappel = ventas * % / 100"
   - ✅ "[VALIDATION] Validar estado de registros (CERRADO, PENDIENTE)"
   - ✅ "[FILTER] Filtrar registros por rango de fechas (3 filtros detectados)"
   - ❌ NO: Solo comentarios raw o if statements sin explicación
   - Detecta cálculos, validaciones, descuentos

7. **📂 Estructura de Catálogo** (para CATALOGO-MARKETING)
   - CAT: Catálogos de productos generales
   - CV: Cartas de Venta y ofertas comerciales
   - MP: Material Promocional (banners, folletos)
   - FDP: Fichas de Producto con especificaciones técnicas
   - FOT: Fotos de productos en alta resolución

8. **🎯 Escenarios de ejemplo**
   - Casos de uso concretos
   - Parámetros de prueba
   - Resultados esperados

---

## 🚀 Cómo usar

### 1. Reiniciar Claude Desktop

Cierra y vuelve a abrir Claude Desktop para que cargue el nuevo servidor con capacidades v2.1.

### 2. Listar funcionalidades

```
Usa el MCP feature-replicator para listar todas las funcionalidades del proyecto:
D:\Antiguo B2B
```

Ahora verás:
- Más detalles en cada feature detectada
- Logs mejorados: "PHP Rich Analysis [certificado]: 5 params, 12 queries, 5 steps, output=PDF"

### 3. Escanear una funcionalidad específica

```
Escanea la funcionalidad "certificado" del proyecto legacy PHP
```

Ahora obtendrás:
```json
{
  "name": "certificado",
  "business_context": {
    "purpose": "Generar certificado comercial en PDF con datos del cliente",
    "actors": ["Usuario", "Administrator"],
    "entry_points": ["AJAX call from JavaScript", "Menu: Certificados > Certificado Comercial"]
  },
  "inputs": {
    "http_params": [
      {"name": "idInterlocutor", "source": "POST", "description": "ID del cliente"},
      {"name": "fechaDesde", "source": "POST", "description": "Fecha inicio periodo"},
      {"name": "fechaHasta", "source": "POST", "description": "Fecha fin periodo"}
    ]
  },
  "outputs": {
    "type": "PDF",
    "description": "Certificado comercial con datos del cliente y compras",
    "structure": [
      "Header with company logo",
      "Customer information section",
      "Purchase details table",
      "Signature area"
    ]
  },
  "process_flow": [
    "Validate customer ID and date range",
    "Query customer data from vSAPB2BRELACIONINTERLOCUTORES",
    "Query purchase history from SAPB2BINTERLOCUTORES",
    "Generate PDF using mpdf library",
    "Send email with PDF attachment"
  ],
  "data_sources": [
    {
      "table": "vSAPB2BRELACIONINTERLOCUTORES",
      "role": "Obtener datos del cliente (nombre, dirección, contacto)",
      "columns": ["INTERLOCUTOR", "NOMBRE", "DIRECCION"],
      "filters": "WHERE INTERLOCUTOR = :idInterlocutor"
    }
  ]
}
```

### 4. Exportar a Markdown

```
Exporta la especificación de "certificado" a:
D:\Antiguo B2B\specs
```

Generará un archivo con **todas las secciones ricas** listas para replicar la funcionalidad en un nuevo stack.

---

## 📊 Ejemplo: antes vs después (v2.2)

### ❌ ANTES (v2.0/2.1) - Listas técnicas sin contexto

```markdown
## Propósito de negocio
Funcionalidad: certificadoClass

## Entradas
- target_clnt_id: Form parameter: target_clnt_id
- param: Form parameter: param

## Flujo de proceso
1. Receives parameters via HTTP request
2. Executes 13 SQL queries to fetch data
3. Returns response to client

## Fuentes de datos
- mysql - DATABASE_NAME..vSAPB2BRELACIONINTERLOCUTORES
  Columnas: INTERLOCUTOR, NOMBRE, DIRECCION
  Query: SELECT * FROM vSAPB2BRELACIONINTERLOCUTORES WHERE...
```

### ✅ AHORA (v2.2) - Historia completa de negocio

```markdown
## Contexto de negocio
**Propósito:** Generar certificado comercial (PDF o documento) para clientes/distribuidores con datos de cliente, forma de pago, cupo y descuentos.

**Actores:** End User, Salesperson

**Puntos de entrada:**
- AJAX call from JavaScript
- Menu: Certificados > Certificado Comercial

## Entradas
### Parámetros HTTP
- **target_clnt_id** (POST): ID del cliente objetivo a certificar (CLNT_ID destino del certificado).
- **sales_clnt_id** (POST): ID del cliente usado para leer datos de ventas y forma de pago.
- **param** (POST): Tipo de acción o subacción a ejecutar (ej: 'certificado_comercial', 'certificado_rappel').

## Salidas
**Tipo de salida:** pdf
**Descripción:** PDF document generated dynamically
**Estructura:**
- Header with company logo
- Customer information section
- Payment terms and credit info
- Signature area

## Flujo de proceso
1. Receive and validate HTTP parameters
2. Obtener datos del cliente (nombre, dirección, contacto, cupo) (3 queries)
3. Consultar forma de pago del cliente (efectivo, crédito, plazo) (2 queries)
4. Obtener datos del usuario o vendedor asignado (1 query)
5. Generate PDF document from data and template
6. Return response to client

## Fuentes de datos
### vSAPB2BRELACIONINTERLOCUTORES
**Rol:** Consultar vSAPB2BRELACIONINTERLOCUTORES con filtros
**Motor:** mysql | **Base de datos:** DATABASE_NAME
**Columnas:** INTERLOCUTOR, NOMBRE, DIRECCION, CUPO_CREDITO
**Filtros:** `WHERE INTERLOCUTOR = :target_clnt_id`

### CLIENTE_FORMA_PAGO
**Rol:** Consultar CLIENTE_FORMA_PAGO con filtros
**Motor:** mysql | **Base de datos:** DATABASE_NAME
**Columnas:** CLNT_ID, FORMA_PAGO, PLAZO_DIAS
**Filtros:** `WHERE CLNT_ID = :sales_clnt_id`

## Reglas de negocio
- [VALIDATION] Validar estado de registros (CERRADO, PENDIENTE, ANULADO, etc.): WHERE estado = 'CERRADO'
- [FILTER] Filtrar registros por rango de fechas (2 filtros detectados): WHERE fecha BETWEEN fecha_desde AND fecha_hasta
- [CALCULATION] Aplicar descuentos según tipo (PERCENTUAL o FIJO): if (tipo_dsct == "PERCENTUAL") descuento = monto * % else descuento = valor_fijo
```

**Diferencia clave:**
- v2.0/2.1: Lista componentes técnicos
- **v2.2: Cuenta la HISTORIA del negocio** 🎯

---

## 🎯 Casos de uso principales

### 1. Certificado Comercial
- Detecta parámetros: `idInterlocutor`, `fechaDesde`, `fechaHasta`
- Detecta output: PDF con estructura detallada
- Detecta flujo: validación → consultas → PDF → email

### 2. Rappel
- Detecta cálculos de comisiones
- Detecta reglas de elegibilidad
- Detecta fórmulas de negocio

### 3. Catálogo de Productos
- Detecta operaciones de archivos (CAT/CV/MP/FDP/FOT)
- Detecta estructura de categorías
- Detecta llamadas a SAP SOAP

---

## 🔧 Troubleshooting

### No veo las nuevas secciones
1. Verifica que reiniciaste Claude Desktop
2. Verifica logs: `Get-Content mcp\logs\feature-replicator.log -Tail 50`
3. Busca: "PHP Rich Analysis" en logs
4. Si no aparece, matar procesos Node.js:
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

### Detecta 0 features
1. Verifica que el proyecto tiene archivos PHP en `CAPA_LOGICA/`, `FUNCIONES/`, `CAPA_DATOS/`
2. Verifica logs: "Analyzing 500 PHP files" → "Detected X PHP features"
3. Si 0 features, verifica paths en logs (debe usar `/` no `\`)

### Specs siguen básicas
Verifica versión en el Markdown exportado:
```markdown
*Documento generado automáticamente por feature-replicator MCP v2.2 (Business Semantics)*
```

Si dice `v2.0`, `v2.1` o no dice versión, el servidor no se reinició correctamente.

### El propósito sigue genérico ("Funcionalidad: XXX")
Verifica que el feature_id contiene palabras clave mapeadas:
- CERTIFICADO-COMERCIAL
- CERTIFICADO-RAPPEL
- CATALOGO-MARKETING
- CARTERA
- COBROS
- PEDIDOS
- REPORTES

Si el feature_id no coincide, el propósito se infiere de comentarios. Puedes añadir más mapeos en `tech-stack-config.json` → `legacy_php_b2b.feature_purposes`.

### Los parámetros siguen sin significado
Verifica que el nombre del parámetro está en el mapeo:
- target_clnt_id → "ID del cliente objetivo a certificar"
- sales_clnt_id → "ID del cliente usado para ventas"
- param → "Tipo de acción a ejecutar"
- texto → "Texto de búsqueda"

Si falta alguno, añádelo en `tech-stack-config.json` → `legacy_php_b2b.param_meanings`.

### El flujo sigue siendo "Executes 13 queries"
Verifica que las queries detectadas usan tablas mapeadas en `query_block_patterns`:
- v_SAP_B2B_RELACION_INTERLOCUTORES → customer_data
- CLIENTE_FORMA_PAGO → payment_info
- USUARIO → user_info
- PEDIDO, FACTURA → sales_history

Si las tablas de tu proyecto son diferentes, añádelas en `tech-stack-config.json` → `legacy_php_b2b.query_block_patterns`.

---

## 📝 Próximas mejoras (v2.3)

- [ ] Extraer campos de formularios HTML
- [ ] Análisis AST para business logic compleja
- [ ] Generación automática de test cases desde escenarios
- [ ] Detección de dependencias entre features
- [ ] Recomendaciones de migración según stack objetivo
- [ ] Soporte para otros frameworks PHP (Laravel, Symfony)

---

**Version:** 2.2 (Business Semantics)  
**Fecha:** 2025-12-16  
**Commit:** 524440a
