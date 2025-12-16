# 🏭 AI Factory

**Ecosistema de herramientas MCP para desarrollo asistido por IA**

AI Factory es una colección de servidores MCP (Model Context Protocol) y prompts especializados que transforman a Claude Code en un asistente experto para diferentes ecosistemas de desarrollo.

## 🎯 ¿Qué es AI Factory?

AI Factory proporciona **ecosistemas especializados** que Claude Code puede activar según el contexto:

- **🛠 Auditoría de Código**: Analiza proyectos existentes, detecta vulnerabilidades, evalúa el stack tecnológico y propone mejoras o recreación.
- **� Replicador de Funcionalidades**: Extrae y documenta funcionalidades de repos legacy para replicarlas en nuevos proyectos (BD, queries, rutas, APIs, reglas).
- **�💡 Ideación de SaaS** *(próximamente)*: Research de mercado, análisis de competencia y validación de ideas.
- **🎨 Diseño y Branding** *(próximamente)*: Generación de identidad visual, diseño de UI/UX.
- **🔍 Tool Scout** *(próximamente)*: Descubrimiento y evaluación de herramientas tecnológicas.

## 🏗 Arquitectura

Cada ecosistema consta de:

1. **Servidor MCP** (`mcp/`): Expone herramientas especializadas usando APIs externas (Perplexity, Gemini, etc.)
2. **System Prompt** (`prompts/`): Define el comportamiento, fases de trabajo y outputs esperados
3. **Integración con Claude**: A través de configuración MCP en tu proyecto

### Estructura del Proyecto

```
ai-factory/
├── mcp/                                  # Servidores MCP
│   ├── perplexity-audit-server.js       # Auditoría técnica (Perplexity)
│   ├── feature-replicator-server.js     # Extracción de funcionalidades legacy
│   ├── perplexity-research-server.js    # Research de mercado (futuro)
│   ├── gemini-design-server.js          # Diseño y branding (futuro)
│   └── README.md
│
├── prompts/                              # System prompts por ecosistema
│   ├── AUDIT.md                         # Ecosistema de Auditoría
│   ├── NEW_SAAS.md                      # (futuro)
│   ├── MARKETING.md                     # (futuro)
│   └── TOOL_SCOUT.md                    # (futuro)
│
├── docs/                                 # Documentación y outputs
│   ├── FEATURES_SPEC/                   # Specs de funcionalidades extraídas
│   ├── TECH_STACK_STATUS.json           # Estado del stack (auditoría)
│   └── ...
│
├── scripts/                              # Utilidades CLI
│   └── run-audit.sh                     # (futuro)
│
├── .env                                  # Variables de entorno (API keys)
├── package.json                          # Dependencias Node.js
└── README.md                             # Este archivo
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ai-factory.git
cd ai-factory
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus API keys:

```bash
cp .env.example .env
```

Edita `.env` y añade tus keys:

```env
PERPLEXITY_API_KEY=tu_api_key_de_perplexity
GEMINI_API_KEY=tu_api_key_de_gemini
```

### 4. Configurar MCP en Claude Desktop

Edita tu archivo de configuración de Claude Desktop:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Añade los servidores MCP:

```json
{
  "mcpServers": {
    "perplexity-audit": {
      "command": "node",
      "args": [
        "D:\\Servidores MCP\\ai-factory\\mcp\\perplexity-audit-server.js"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

> ⚠️ **Importante**: Reemplaza la ruta con la ruta absoluta donde clonaste ai-factory.

### 5. Reiniciar Claude Desktop

Reinicia Claude Desktop para que cargue los nuevos servidores MCP.

## 📖 Uso

### Ecosistema de Auditoría

El ecosistema de auditoría está diseñado para analizar proyectos existentes de forma profunda y estructurada.

#### Comando típico

En Claude Code (dentro del proyecto que quieres auditar), escribe:

```
Revisa este proyecto en ./. Prioriza seguridad, bugs críticos y rendimiento.
Si conviene, propón recrearlo en un stack moderno y seguro, y dime por qué.
```

#### ¿Qué hace?

El ecosistema ejecutará **4 fases + documentos persistentes**:

**Fase 1 - Mapeo y Stack**
- Identifica arquitectura, stack tecnológico y dependencias
- Llama a `stack_status` (MCP) para evaluar estado de cada tecnología
- Genera:
  - `docs/ARCHITECTURE_OVERVIEW.md`
  - `docs/TECH_STACK_STATUS.md`
  - `docs/PROJECT_CONTEXT.md` (resumen general del proyecto)

**Fase 2 - Auditoría Técnica**
- Analiza código en busca de bugs, vulnerabilidades, problemas de rendimiento
- Llama a `best_practices` (MCP) para obtener recomendaciones actualizadas 2025
- Genera:
  - `docs/SECURITY_AUDIT.md`
  - `docs/PERFORMANCE_AUDIT.md`
  - `docs/CODE_QUALITY_REPORT.md`

**Fase 2.5 - Mapeo de Funcionalidades**
- Identifica y documenta las funcionalidades principales del sistema
- Describe cada funcionalidad para permitir reutilización o migración
- Genera:
  - `docs/FEATURES_OVERVIEW.md`
  - `docs/TODO_FEATURES.md` (funcionalidades planeadas/en progreso)

**Fase 3 - Plan de Acción**
- Decide si mejorar el stack actual o recrear en uno nuevo
- Genera:
  - `docs/IMPROVEMENT_PLAN.md` (si mejora)
  - `docs/REWRITE_PROPOSAL.md` (si recreación)

**Fase 4 - Aplicar Cambios** (solo bajo orden explícita)
- Aplica correcciones específicas
- Crea tests
- Implementa refactors priorizados

#### Ejemplo de salida

Después de la auditoría, tendrás:

```
tu-proyecto/
├── docs/
│   ├── PROJECT_CONTEXT.md            # Contexto general del proyecto
│   ├── ARCHITECTURE_OVERVIEW.md      # Arquitectura detectada
│   ├── TECH_STACK_STATUS.md          # Estado del stack
│   ├── SECURITY_AUDIT.md             # Vulnerabilidades encontradas
│   ├── PERFORMANCE_AUDIT.md          # Problemas de rendimiento
│   ├── CODE_QUALITY_REPORT.md        # Issues de mantenibilidad
│   ├── FEATURES_OVERVIEW.md          # Mapa de funcionalidades
│   ├── TODO_FEATURES.md              # Features planeadas/en progreso
│   ├── IMPROVEMENT_PLAN.md           # Plan priorizado (o REWRITE_PROPOSAL.md)
│   └── AUDIT_TRAIL.md                # Traza de decisiones
└── [tu código...]
```

**Documentos persistentes**: Estos documentos se mantienen actualizados entre sesiones,
permitiendo que cualquier IA o desarrollador retome el trabajo sin pérdida de contexto.

### Herramientas MCP disponibles

#### `perplexity-audit.stack_status`

Evalúa el estado de soporte de tecnologías:

```javascript
{
  "components": [
    {"name": "python", "version": "3.9"},
    {"name": "django", "version": "3.2"},
    {"name": "postgresql", "version": "12"}
  ],
  "app_type": "saas-api"
}
```

**Retorna:**
- Estado de cada componente (current/nearing_eol/eol)
- Versiones recomendadas
- Riesgo general del stack

#### `perplexity-audit.best_practices`

Obtiene mejores prácticas 2025:

```javascript
{
  "language": "python",
  "framework": "fastapi",
  "database": "postgresql",
  "app_type": "saas-api",
  "focus": ["security", "performance"]
}
```

**Retorna:**
- Recomendaciones de seguridad
- Recomendaciones de rendimiento
- Recomendaciones de mantenibilidad

## 🧪 Testing (próximamente)

```bash
npm test
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Añade nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📋 Roadmap

- [x] Ecosistema de Auditoría (Perplexity)
- [ ] Ecosistema de Ideación de SaaS (Perplexity)
- [ ] Ecosistema de Diseño (Gemini)
- [ ] Ecosistema Tool Scout (Perplexity)
- [ ] CLI para ejecutar auditorías sin Claude Desktop
- [ ] Dashboard web para visualizar resultados de auditoría
- [ ] Integración con GitHub Actions

## 📄 Licencia

MIT

## 🙏 Créditos

- **Model Context Protocol (MCP)**: Anthropic
- **Perplexity API**: Para research técnico actualizado
- **Gemini API**: Para generación de contenido visual

---

**¿Tienes preguntas?** Abre un issue en GitHub o consulta la [documentación completa](docs/).
