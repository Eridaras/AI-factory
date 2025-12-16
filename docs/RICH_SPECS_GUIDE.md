# 📖 Guía de Especificaciones Funcionales Ricas v2.1

## ✨ Nuevas capacidades

El MCP `feature-replicator` ahora genera **especificaciones funcionales completas** con contexto de negocio, no solo listas de tablas y archivos.

### Qué incluye cada especificación:

1. **📋 Contexto de negocio**
   - Propósito de la funcionalidad
   - Actores involucrados (Admin, Usuario, Vendedor, etc.)
   - Puntos de entrada (AJAX, URL directa, Menú)

2. **📥 Entradas estructuradas**
   - Parámetros HTTP con fuente (GET/POST/SESSION)
   - Campos de formulario
   - Otras fuentes de datos

3. **📤 Salidas detalladas**
   - Tipo de salida (PDF, JSON, Excel, HTML)
   - Descripción del contenido
   - Estructura del documento (secciones, campos, etc.)

4. **🔄 Flujo de proceso**
   - Pasos numerados en lenguaje natural
   - Secuencia de operaciones (consultas → PDF → email)

5. **🗄️ Fuentes de datos con rol semántico**
   - No solo SQL raw, sino **para qué sirve cada tabla**
   - Ejemplo: "Obtener datos del cliente" en lugar de solo "vSAPB2BRELACIONINTERLOCUTORES"

6. **⚖️ Reglas de negocio**
   - Validaciones
   - Cálculos
   - Condiciones de elegibilidad

7. **🎯 Escenarios de ejemplo**
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

## 📊 Ejemplo: antes vs después

### ❌ ANTES (v2.0) - Solo listas técnicas

```markdown
## Fuentes de datos
- mysql - DATABASE_NAME..vSAPB2BRELACIONINTERLOCUTORES
  Columnas: INTERLOCUTOR, NOMBRE, DIRECCION
  Query: SELECT * FROM vSAPB2BRELACIONINTERLOCUTORES WHERE...
```

### ✅ AHORA (v2.1) - Contexto de negocio

```markdown
## Contexto de negocio
**Propósito:** Generar certificado comercial en PDF con datos del cliente

**Actores:** Usuario, Administrator

**Puntos de entrada:**
- AJAX call from JavaScript
- Menu: Certificados > Certificado Comercial

## Entradas
### Parámetros HTTP
- **idInterlocutor** (POST): ID del cliente
- **fechaDesde** (POST): Fecha inicio periodo
- **fechaHasta** (POST): Fecha fin periodo

## Salidas
**Tipo de salida:** PDF
**Descripción:** Certificado comercial con datos del cliente y compras
**Estructura:**
- Header with company logo
- Customer information section
- Purchase details table
- Signature area

## Flujo de proceso
1. Validate customer ID and date range
2. Query customer data from vSAPB2BRELACIONINTERLOCUTORES
3. Query purchase history from SAPB2BINTERLOCUTORES
4. Generate PDF using mpdf library
5. Send email with PDF attachment

## Fuentes de datos
### vSAPB2BRELACIONINTERLOCUTORES
**Rol:** Obtener datos del cliente (nombre, dirección, contacto)
**Motor:** mysql | **Base de datos:** DATABASE_NAME
**Columnas:** INTERLOCUTOR, NOMBRE, DIRECCION
**Filtros:** `WHERE INTERLOCUTOR = :idInterlocutor`
```

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
*Documento generado automáticamente por feature-replicator MCP v2.1 (Rich Specs)*
```

Si dice `v2.0` o no dice versión, el servidor no se reinició correctamente.

---

## 📝 Próximas mejoras (v2.2)

- [ ] Extraer campos de formularios HTML
- [ ] Análisis AST para business logic compleja
- [ ] Generación automática de test cases desde escenarios
- [ ] Detección de dependencias entre features
- [ ] Recomendaciones de migración según stack objetivo

---

**Version:** 2.1 (Rich Specs)  
**Fecha:** 2025-12-16  
**Commit:** 23af53c
