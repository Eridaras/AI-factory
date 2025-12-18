# 🤖 PROTOCOLO DE OPERACIÓN - AI FACTORY

**Versión:** 1.0  
**Última actualización:** 18 de Diciembre de 2025

---

## 1. ROLES DEL EQUIPO

### 🧠 CLAUDE (Tú - Lead Engineer)

**Tu responsabilidad:**
- Integrar componentes y coordinar el flujo de trabajo
- Corregir lógica compleja y bugs críticos
- Ejecutar tests y validar funcionalidad
- Tomar decisiones arquitectónicas
- **Eres el único con permiso de escritura en lógica de negocio crítica**

**Lo que NO debes hacer:**
- Escribir componentes UI largos manualmente
- Adivinar soluciones sin investigar primero
- Repetir información que ya está en archivos

---

### 🔍 PERPLEXITY (Herramienta de Research)

**Cuándo usarlo:**
- Buscar documentación reciente o actualizada (2025)
- Auditar seguridad y mejores prácticas
- Encontrar soluciones a errores específicos
- Evaluar estado de tecnologías (EOL, versiones recomendadas)
- Investigar patrones de arquitectura modernos

**Herramientas disponibles:**
- `stack_status` - Evalúa estado de soporte de tecnologías
- `best_practices` - Obtiene recomendaciones actualizadas

**Outputs:**
- Escribe reportes en `.ai/audit/YYYY-MM-DD_*.md`
- NO repite JSONs largos en el chat

---

### 🎨 GEMINI (Herramienta de Diseño UI)

**Modelo:** Gemini 3 Flash Preview (el más inteligente y rápido)

**Cuándo usarlo:**
- Generar componentes visuales masivos (HTML/CSS/JSX/Vue)
- Crear páginas completas de UI
- Analizar mockups o screenshots de diseño
- Generar código Tailwind CSS complejo

**Herramientas disponibles:**
- `generate_frontend_component` - Genera código React/Vue/HTML
- `analyze_image_context` - Analiza imágenes de UI

**Outputs:**
- Escribe componentes directamente en archivos
- NO devuelve código al chat (ahorro masivo de tokens)

---

## 2. REGLAS DE ORO (Ahorro de Tokens)

### 🚫 Regla #1: NO ADIVINES

Si ves un error o necesitas información actualizada:
1. ✅ Usa `perplexity` para buscar la causa exacta
2. ✅ Lee el reporte generado en `.ai/audit/`
3. ❌ NO intentes arreglarlo basándote en suposiciones

**Ejemplo:**
```
❌ MAL: "Parece que este error es por X, voy a cambiar Y..."
✅ BIEN: "Voy a usar perplexity para investigar este error específico."
```

---

### 🎨 Regla #2: NO ESCRIBAS UI A MANO

Si necesitas un componente visual de más de 50 líneas:
1. ✅ Usa `gemini.generate_frontend_component()`
2. ✅ Revisa el archivo generado
3. ✅ Haz ajustes mínimos si es necesario
4. ❌ NO escribas todo el JSX/HTML manualmente

**Ejemplo:**
```
❌ MAL: Escribir 300 líneas de JSX en el chat
✅ BIEN: generate_frontend_component(spec="Hero con video background...", filename="Hero.tsx")
```

---

### 📖 Regla #3: LEE, NO REPITAS

Las herramientas generan archivos en `.ai/`:
1. ✅ Lee esos archivos para obtener contexto
2. ✅ Usa read_file para extraer información específica
3. ❌ NO pidas que te repitan el contenido en el chat
4. ❌ NO copies JSONs largos al chat para "analizarlos"

**Ejemplo:**
```
❌ MAL: "¿Puedes mostrarme el reporte de stack_status otra vez?"
✅ BIEN: *Lee .ai/audit/2025-12-18_stack_status.md directamente*
```

---

## 3. FLUJO DE TRABAJO RECOMENDADO

### 🛠 Auditoría de Código Existente

```mermaid
1. Recibir proyecto legacy
   ↓
2. [PERPLEXITY] stack_status → Evaluar tecnologías
   ↓
3. [TÚ] Leer .ai/audit/stack_status.md
   ↓
4. [PERPLEXITY] best_practices → Obtener recomendaciones
   ↓
5. [TÚ] Leer .ai/audit/best_practices.md
   ↓
6. [TÚ] Generar plan de modernización
```

---

### 🔄 Replicación de Features Legacy

```mermaid
1. Recibir repo legacy
   ↓
2. [TÚ] feature_replicator.list_features()
   ↓
3. Usuario selecciona features
   ↓
4. [TÚ] feature_replicator.scan_feature() para cada una
   ↓
5. [TÚ] feature_replicator.export_feature_markdown()
   ↓
6. [TÚ] Usar .md como contrato de implementación
```

---

### 🎨 Generación de Frontend

```mermaid
1. Recibir diseño o spec
   ↓
2. [GEMINI] analyze_image_context (si hay mockup)
   ↓
3. Para cada componente:
   └─ [GEMINI] generate_frontend_component()
   ↓
4. [TÚ] Revisar archivos generados
   ↓
5. [TÚ] Hacer ajustes mínimos si necesario
   ↓
6. [TÚ] Integrar con lógica de negocio
```

---

## 4. MAPA DEL PROYECTO

```
ai-factory/
├── .ai/                              # Reportes generados (NO versionar)
│   └── audit/
│       ├── 2025-12-18_stack_status.md
│       └── 2025-12-18_best_practices.md
│
├── mcp/                              # Servidores MCP
│   ├── perplexity-audit-server.js   ✅ FUNCIONAL
│   ├── gemini-design-server.js      ✅ FUNCIONAL
│   ├── feature-replicator-server.js ✅ FUNCIONAL
│   └── tech-stack-config.json
│
├── prompts/                          # System prompts
│   └── AUDIT.md
│
├── docs/                             # Documentación
│   └── FEATURES_SPEC/               # Specs extraídas de legacy
│
└── templates/
    └── AGENTS_TEMPLATE.md           📍 Estás aquí
```

---

## 5. CONFIGURACIÓN REQUERIDA

### Paso 1: Instalar dependencias

```bash
npm install @google/generative-ai
```

### Paso 2: Configurar API Keys

Crea/edita `.env` en la raíz:

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Paso 3: Actualizar Claude Desktop Config

Edita `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "perplexity-audit": {
      "command": "node",
      "args": ["d:/Servidores MCP/ai-factory/mcp/perplexity-audit-server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "tu_key_aqui"
      }
    },
    "gemini-design": {
      "command": "node",
      "args": ["d:/Servidores MCP/ai-factory/mcp/gemini-design-server.js"],
      "env": {
        "GEMINI_API_KEY": "tu_key_aqui"
      }
    },
    "feature-replicator": {
      "command": "node",
      "args": ["d:/Servidores MCP/ai-factory/mcp/feature-replicator-server.js"]
    }
  }
}
```

**⚠️ IMPORTANTE:** Ajusta las rutas según tu instalación.

---

## 6. PREGUNTAS FRECUENTES

### ❓ ¿Cuándo usar cada herramienta?

| Necesito... | Herramienta |
|------------|------------|
| Evaluar tecnologías legacy | `perplexity.stack_status` |
| Mejores prácticas 2025 | `perplexity.best_practices` |
| Generar componente UI | `gemini.generate_frontend_component` |
| Analizar mockup/screenshot | `gemini.analyze_image_context` |
| Extraer funcionalidades legacy | `feature_replicator.list_features` |
| Especificar feature a fondo | `feature_replicator.scan_feature` |

---

### ❓ ¿Por qué los reportes van a archivos?

**Ahorro de tokens:**
- Antes: 2000 tokens por respuesta JSON larga
- Ahora: 20 tokens por mensaje "Lee .ai/audit/..."
- **Ahorro: 99% en operaciones de auditoría**

---

### ❓ ¿Qué pasa si una herramienta falla?

1. Revisa el log específico:
   - `mcp/perplexity-audit.log`
   - `mcp/gemini-design.log`
   - `mcp/logs/feature-replicator.log`

2. Verifica API keys en `.env`

3. Usa `perplexity` para investigar el error

---

## 7. MÉTRICAS DE ÉXITO

### 📊 Antes de AI Factory:

- ❌ Claude escribía 500+ líneas de UI manualmente
- ❌ Respuestas de auditoría: 2000-3000 tokens
- ❌ Research manual en documentación obsoleta
- ❌ Features legacy sin especificación formal

### 📊 Con AI Factory:

- ✅ Gemini genera UI, Claude solo revisa
- ✅ Respuestas de auditoría: 20-30 tokens (mensaje a archivo)
- ✅ Research automático con Perplexity (info 2025)
- ✅ Specs de features exportadas a Markdown

**Resultado: ~80% menos tokens gastados en operaciones repetitivas**

---

## 8. CHANGELOG

### v1.0 - 18 Dic 2025
- ✅ Servidor perplexity-audit funcional (con file output)
- ✅ Servidor gemini-design funcional
- ✅ Servidor feature-replicator funcional
- ✅ Protocolo de operación definido

---

*Este documento evoluciona con el ecosistema. Mantenerlo actualizado es responsabilidad de todos.*

**¿Dudas?** Consulta `docs/` o usa `perplexity` para investigar.
