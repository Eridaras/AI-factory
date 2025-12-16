# 📝 Changelog v2.2 - Business Semantics

**Release Date:** 2025-12-16  
**Commit:** 524440a, 3d6c025

---

## 🎯 Objetivo principal

**Problema identificado por el usuario:**
> "El MCP está mejor, pero sigue sin contar 'de qué va' cada componente: ni explica que certificado comercial/rappel generan certificados PDF, ni que catálogo lista categorías y archivos, ni detalla reglas o flujos reales."

**Solución v2.2:**
Transformar el MCP de un "listador de componentes técnicos" a un "contador de historias de negocio". Ahora el MCP **explica QUÉ hace y POR QUÉ**, no solo CÓMO lo hace técnicamente.

---

## 🚀 Cambios principales

### 1. Mapas de contexto de negocio (tech-stack-config.json)

Añadida sección `legacy_php_b2b` con 5 mapas:

#### a) `feature_purposes`
Mapea feature_id → propósito real de negocio:
```json
"CERTIFICADO-COMERCIAL": "Generar certificado comercial (PDF) para clientes/distribuidores...",
"CERTIFICADO-RAPPEL": "Generar certificado/reporte de rappel (bonificación por volumen)...",
"CATALOGO-MARKETING": "Exponer catálogo digital de documentos de marketing..."
```

**Resultado:**
- ✅ "Generar certificado comercial para clientes con datos de cliente, forma de pago..."
- ❌ NO: "Funcionalidad: certificadoClass"

#### b) `param_meanings`
Mapea nombres técnicos → significado de negocio:
```json
"target_clnt_id": "ID del cliente objetivo a certificar (CLNT_ID destino)",
"sales_clnt_id": "ID del cliente usado para datos de ventas y forma de pago",
"texto": "Texto de búsqueda para filtrar archivos del catálogo"
```

**Resultado:**
- ✅ "target_clnt_id (POST): ID del cliente objetivo a certificar"
- ❌ NO: "target_clnt_id: Form parameter"

#### c) `catalog_categories`
Documenta estructura de catálogo:
```json
"CAT": "Catálogos de productos generales",
"CV": "Cartas de Venta y ofertas comerciales",
"MP": "Material Promocional (banners, folletos)",
"FDP": "Fichas de Producto con especificaciones técnicas",
"FOT": "Fotos de productos en alta resolución"
```

**Resultado:**
Nueva sección en MD con **significado** de cada categoría.

#### d) `business_logic_patterns`
Detecta lógica de negocio por patrones:
```json
"rappel_calculation": {
  "pattern": "(ventas|monto|total).*\\*.*(%|porcentaje)",
  "description": "Cálculo de rappel como porcentaje de ventas totales"
},
"date_range_filter": {
  "pattern": "WHERE.*fecha.*BETWEEN.*AND",
  "description": "Filtro de registros por rango de fechas"
}
```

**Resultado:**
- ✅ "[CALCULATION] Cálculo de rappel: rappel = ventas * % / 100"
- ❌ NO: Solo raw if statements sin explicación

#### e) `query_block_patterns`
Agrupa queries por propósito:
```json
"customer_data": {
  "tables": ["v_SAP_B2B_RELACION_INTERLOCUTORES", "CLIENTE"],
  "description": "Obtener datos del cliente (nombre, dirección, contacto, cupo)"
},
"payment_info": {
  "tables": ["CLIENTE_FORMA_PAGO", "FORMA_PAGO"],
  "description": "Consultar forma de pago del cliente (efectivo, crédito, plazo)"
}
```

**Resultado:**
- ✅ "Obtener datos del cliente (3 queries)"
- ✅ "Consultar forma de pago (2 queries)"
- ❌ NO: "Executes 13 SQL queries"

---

### 2. Nuevas funciones de extracción

#### `groupQueriesByPurpose(queries)`
Agrupa queries SQL en bloques lógicos:
```javascript
// Input: 13 queries mezcladas
// Output:
[
  { type: 'customer_data', description: 'Obtener datos del cliente...', query_count: 3 },
  { type: 'payment_info', description: 'Consultar forma de pago...', query_count: 2 },
  { type: 'sales_history', description: 'Consultar historial de ventas...', query_count: 5 }
]
```

#### `extractBusinessLogic(content)`
Detecta lógica de negocio real:
```javascript
// Output:
[
  {
    type: 'calculation',
    description: 'Cálculo de rappel como porcentaje de ventas',
    detail: 'rappel = ventas * porcentaje / 100'
  },
  {
    type: 'validation',
    description: 'Validar estado de registros (CERRADO, PENDIENTE)',
    detail: "WHERE estado = 'CERRADO'"
  }
]
```

---

### 3. Funciones mejoradas

#### `extractPHPParameters()` - Ahora con semántica
```javascript
// ANTES:
{ name: 'target_clnt_id', source: 'POST', description: 'Form parameter: target_clnt_id' }

// AHORA:
{ name: 'target_clnt_id', source: 'POST', description: 'ID del cliente objetivo a certificar (CLNT_ID)' }
```

#### `extractPHPProcessFlow()` - Ahora con bloques lógicos
```javascript
// ANTES:
[
  'Receives parameters via HTTP request',
  'Executes 13 SQL queries to fetch data',
  'Returns response to client'
]

// AHORA:
[
  'Receive and validate HTTP parameters',
  'Obtener datos del cliente (nombre, dirección, contacto, cupo) (3 queries)',
  'Consultar forma de pago del cliente (efectivo, crédito, plazo) (2 queries)',
  'Obtener datos del usuario o vendedor asignado (1 query)',
  'Generate PDF document from data and template',
  'Return response to client'
]
```

#### `analyzePHPFeature()` - Ahora con propósito real
```javascript
// ANTES:
purpose = `Funcionalidad: ${baseName}`

// AHORA:
// 1. Busca en feature_purposes por feature_id
// 2. Si no hay match, busca en comentarios
// 3. Fallback a genérico
purpose = "Generar certificado comercial (PDF) para clientes/distribuidores..."
```

---

### 4. Plantilla Markdown mejorada

#### Nueva sección: Estructura de Catálogo
```markdown
## 📂 Estructura de Catálogo

Este componente gestiona un catálogo digital organizado en las siguientes categorías:

**CAT**: Catálogos de productos generales
**CV**: Cartas de Venta y ofertas comerciales
**MP**: Material Promocional (banners, folletos, etc.)
**FDP**: Fichas de Producto con especificaciones técnicas
**FOT**: Fotos de productos en alta resolución
```

#### Business Rules con tags semánticos
```markdown
## ⚖️ Reglas de negocio

- [CALCULATION] Cálculo de rappel como porcentaje de ventas totales: rappel = ventas * porcentaje / 100
- [VALIDATION] Validar estado de registros (CERRADO, PENDIENTE, ANULADO, etc.): WHERE estado = 'CERRADO'
- [FILTER] Filtrar registros por rango de fechas (3 filtros detectados): WHERE fecha BETWEEN fecha_desde AND fecha_hasta
- [CALCULATION] Aplicar descuentos según tipo (PERCENTUAL o FIJO): if (tipo_dsct == "PERCENTUAL")...
```

#### Footer actualizado
```markdown
*Documento generado automáticamente por feature-replicator MCP v2.2 (Business Semantics)*
```

---

## 📊 Comparación: v2.1 → v2.2

| Aspecto | v2.1 (Rich Specs) | v2.2 (Business Semantics) |
|---------|-------------------|---------------------------|
| **Propósito** | "Funcionalidad: certificadoClass" | "Generar certificado comercial (PDF) para clientes/distribuidores con datos de cliente, forma de pago, cupo y descuentos" |
| **Parámetros** | "Form parameter: target_clnt_id" | "ID del cliente objetivo a certificar (CLNT_ID destino del certificado)" |
| **Flujo** | "Executes 13 SQL queries" | "Obtener datos del cliente (3 queries) + Consultar forma de pago (2 queries)" |
| **Data sources** | "mysql - DATABASE_NAME..tabla" | "**Rol:** Obtener datos del cliente (nombre, dirección, contacto, cupo)" |
| **Business rules** | Raw if statements o comentarios | "[CALCULATION] Cálculo de rappel: rappel = ventas * % / 100" |
| **Catálogo** | URLs genéricas | "**CAT**: Catálogos de productos generales" |

---

## 🎯 Casos de uso resueltos

### 1. Certificado Comercial
**Antes:** "Es la clase de conexión a la base de datos"  
**Ahora:** "Generar certificado comercial (PDF) para clientes/distribuidores con datos de cliente, forma de pago, cupo y descuentos"

**Antes:** "Executes 13 queries"  
**Ahora:**
1. Obtener datos del cliente (3 queries)
2. Consultar forma de pago (2 queries)
3. Obtener usuario/vendedor (1 query)
4. Generate PDF

### 2. Certificado Rappel
**Antes:** "Alineación horizontal" (propósito mal inferido)  
**Ahora:** "Generar certificado/reporte de rappel (bonificación por volumen de ventas) con cálculo de comisiones y periodo"

**Antes:** Sin reglas de negocio claras  
**Ahora:**
- [CALCULATION] Cálculo de rappel: rappel = ventas * porcentaje / 100
- [FILTER] Filtro por rango de fechas (anio, mes)
- [VALIDATION] Validar estado de pedidos

### 3. Catálogo Marketing
**Antes:** Flujo con HTML concatenado  
**Ahora:**
1. Receive search text from POST
2. List files by category (CAT/CV/MP/FDP/FOT)
3. Generate HTML with download links

**Antes:** Sin estructura de categorías  
**Ahora:**
- **CAT**: Catálogos de productos generales
- **CV**: Cartas de Venta
- **MP**: Material Promocional
- **FDP**: Fichas de Producto
- **FOT**: Fotos

---

## 🔧 Configuración extensible

Todos los mapas están en `tech-stack-config.json` → `legacy_php_b2b`.

### Añadir nuevo propósito
```json
"feature_purposes": {
  "TU-FEATURE-ID": "Descripción de negocio completa..."
}
```

### Añadir nuevo parámetro
```json
"param_meanings": {
  "tu_param": "Significado de negocio del parámetro"
}
```

### Añadir nuevo bloque de queries
```json
"query_block_patterns": {
  "tu_bloque": {
    "tables": ["TU_TABLA_1", "TU_TABLA_2"],
    "description": "Propósito de negocio de estas queries"
  }
}
```

---

## 🚀 Cómo usar v2.2

1. **Reiniciar Claude Desktop** (cierra y abre para cargar v2.2)
2. Listar features: `list_features` en `D:\Antiguo B2B`
3. Logs mejorados: `"PHP Rich Analysis [certificado]: 5 params, 12 queries, 5 steps, output=PDF"`
4. Escanear feature: `scan_feature` con `feature_id`
5. Verifica propósito real (no genérico)
6. Verifica flujo con bloques lógicos (no solo count)
7. Verifica reglas de negocio con [CALCULATION] [VALIDATION] tags
8. Exporta Markdown: verifica footer `v2.2 (Business Semantics)`

---

## 📝 Commits

- `524440a` - Business semantics implementation
- `3d6c025` - Updated documentation and guide

---

## 🎓 Lecciones aprendidas

1. **Contexto de negocio > Detalles técnicos**: Usuarios necesitan saber QUÉ hace el sistema, no solo CÓMO.
2. **Mapas configurables**: Permitir extensibilidad sin cambiar código.
3. **Agrupación lógica**: "3 queries de cliente + 2 queries de pago" > "Executes 13 queries".
4. **Tags semánticos**: [CALCULATION], [VALIDATION], [FILTER] ayudan a categorizar reglas.
5. **Propósito primero**: Buscar en feature_id antes que inferir de comentarios.

---

**Version:** 2.2 (Business Semantics)  
**Status:** ✅ Released  
**Next:** v2.3 (Form extraction, AST parsing, test generation)
