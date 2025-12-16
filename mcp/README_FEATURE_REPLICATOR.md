# Feature Replicator MCP Server

Servidor MCP especializado en **extraer y documentar funcionalidades** de repositorios legacy para poder replicarlas en nuevos proyectos.

## 🎯 Objetivo

Cuando tienes un sistema legacy que quieres modernizar, este MCP te ayuda a:

1. **Listar** todas las funcionalidades del sistema (endpoints, casos de uso, jobs, etc.)
2. **Analizar** cada funcionalidad en profundidad para extraer:
   - Bases de datos, esquemas, tablas y columnas exactas
   - Queries SQL completas (SELECT, INSERT, UPDATE, DELETE con filtros y joins)
   - Rutas de archivos y carpetas de red
   - APIs externas llamadas
   - Reglas de negocio y validaciones
3. **Generar** especificaciones en JSON y Markdown listas para replicar

## 🔧 Tools disponibles

### 1. `list_features`

**Escanea el repositorio y lista todas las funcionalidades detectadas.**

**Input:**
```json
{
  "path": ".",
  "tech_stack": {
    "language": "csharp",
    "framework": "aspnet-mvc",
    "databases": ["sap_hana", "sql_server"]
  },
  "max_files": 300
}
```

**Output:**
```json
{
  "features": [
    {
      "id": "LEGACY-F-001",
      "name": "Login de usuarios B2B",
      "summary": "Gestiona autenticación de usuarios con SAP HANA",
      "main_files": ["Controllers/AuthController.cs", "Services/AuthService.cs"]
    }
  ]
}
```

### 2. `scan_feature`

**Analiza a fondo una funcionalidad específica.**

Sigue el código desde el controller hasta las queries SQL, extrayendo:
- Tablas y columnas exactas
- Filtros WHERE, JOINs, ORDER BY
- Rutas de archivos (ej: `\\SERVER\Share\Reportes\*.xlsx`)
- APIs externas llamadas
- Reglas de negocio y validaciones

**Input:**
```json
{
  "feature_id": "LEGACY-F-002",
  "entry_files": ["Controllers/ColorsController.cs"],
  "path": ".",
  "max_depth": 4
}
```

**Output:**
```json
{
  "feature_id": "LEGACY-F-002",
  "name": "Consulta de colores",
  "domain_purpose": "Obtiene catálogo de colores desde SAP HANA con filtros",
  "data_sources": [
    {
      "kind": "database",
      "engine": "sap_hana",
      "database": "B2B_HANA",
      "schema": "CATALOG",
      "table": "COLORS",
      "columns": ["COLOR_ID", "COLOR_NAME", "HEX_CODE", "ACTIVE"],
      "filters": "WHERE ACTIVE = 1 AND COLOR_TYPE = @type",
      "source_code_snippet": "SELECT COLOR_ID, COLOR_NAME, HEX_CODE FROM CATALOG.COLORS WHERE ACTIVE = 1"
    }
  ],
  "business_rules": [
    "Solo mostrar colores activos",
    "Filtrar por tipo si se especifica"
  ]
}
```

### 3. `export_feature_markdown`

**Genera un archivo Markdown con la especificación completa.**

**Input:**
```json
{
  "feature_spec": { /* objeto de scan_feature */ },
  "output_path": "docs/FEATURES_SPEC"
}
```

**Output:**
```json
{
  "file_path": "docs/FEATURES_SPEC/LEGACY-F-002_ConsultaColores.md",
  "success": true
}
```

## 📋 Flujo de trabajo

### Paso 1: Auditoría inicial (con perplexity-audit)

Primero audita el repo legacy para generar `TECH_STACK_STATUS.json`:

```bash
# Claude usa perplexity-audit en el repo legacy
# Se genera: docs/TECH_STACK_STATUS.json
```

### Paso 2: Listar funcionalidades

```
En Claude Desktop:
"Usa list_features para escanear este repositorio y mostrarme todas las funcionalidades"
```

### Paso 3: Analizar funcionalidad específica

```
"Para LEGACY-F-002, usa scan_feature y luego export_feature_markdown 
para generar la especificación completa en docs/FEATURES_SPEC"
```

### Paso 4: Replicar en nuevo proyecto

Ahora tienes un `.md` completo con:
- Tablas exactas a consultar
- Columnas necesarias
- Queries SQL de referencia
- Reglas de negocio

Puedes pedirle a Claude:
```
"Lee LEGACY-F-002_ConsultaColores.md y genera la implementación 
equivalente en Node.js + Express + PostgreSQL"
```

## 🔌 Configuración en Claude Desktop

Agrega al archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "feature-replicator": {
      "command": "node",
      "args": [
        "D:\\Servidores MCP\\ai-factory\\mcp\\feature-replicator-server.js"
      ]
    }
  }
}
```

## 📁 Estructura de archivos

```
ai-factory/
├── mcp/
│   ├── feature-replicator-server.js  # Servidor MCP
│   └── feature-replicator.log        # Log de operaciones
├── docs/
│   ├── TECH_STACK_STATUS.json        # Generado por auditoría
│   └── FEATURES_SPEC/                # Especificaciones generadas
│       ├── LEGACY-F-001_Login.md
│       ├── LEGACY-F-002_ConsultaColores.md
│       └── ...
```

## 🚀 Ejemplo completo

```javascript
// 1. Auditar repo legacy (genera TECH_STACK_STATUS.json)
"Audita este repo con perplexity-audit"

// 2. Listar features
"Usa list_features en este repositorio"

// 3. Analizar feature específica
"Para LEGACY-F-002, usa scan_feature con entry_files: ['Controllers/ColorsController.cs']"

// 4. Exportar a Markdown
"Usa export_feature_markdown para guardar la spec en docs/FEATURES_SPEC"

// 5. Resultado: archivo .md completo con TODO lo necesario para replicar
```

## 📝 Notas importantes

- **Tech Stack**: Si no pasas `tech_stack`, el MCP lo lee de `docs/TECH_STACK_STATUS.json`
- **Max Depth**: Controla cuántos niveles de código seguir (default: 4)
- **Entry Files**: Los archivos principales donde empieza la funcionalidad (controllers, handlers, etc.)

## 🔜 TODOs de implementación

Los TODOs marcados en el código necesitan:

1. **Parser específico por lenguaje**: Detectar funciones/clases según el stack
2. **Extractor de queries SQL**: Regex o AST para extraer queries completas
3. **Detector de rutas de archivos**: Encontrar patrones tipo `\\SERVER\Share\...`
4. **Seguidor de llamadas**: Mapear controller → service → repository → SQL
5. **Integración con LLM**: Usar Perplexity/Claude para analizar código y generar specs

## 🤝 Integración con perplexity-audit

Este MCP complementa `perplexity-audit`:

1. **perplexity-audit**: Analiza el stack tecnológico (lenguajes, frameworks, versiones)
2. **feature-replicator**: Analiza las funcionalidades (qué hace el código)

Juntos te dan una visión completa para modernizar un sistema legacy.
