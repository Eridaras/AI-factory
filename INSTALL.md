# 🚀 Instalación Rápida - AI Factory

Sigue estos pasos para poner en marcha el ecosistema completo en menos de 10 minutos.

---

## 📋 Prerequisitos

- Node.js 18+ instalado
- Claude Desktop instalado
- Cuentas en Perplexity AI y Google AI Studio

---

## ⚡ Paso 1: Instalar Dependencias

Abre tu terminal **dentro de la carpeta AI-factory** y ejecuta:

```bash
npm install @google/generative-ai
```

**Nota:** Las demás dependencias ya deberían estar instaladas. Si no, ejecuta `npm install`.

---

## 🔑 Paso 2: Configurar las Llaves (Secretos)

### Obtener API Keys

1. **Perplexity**: https://www.perplexity.ai/settings/api
2. **Gemini**: https://aistudio.google.com/app/apikey

### Crear archivo .env

Crea el archivo `.env` en la raíz de AI-factory:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edita `.env` y añade tus keys:

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: Nunca subas este archivo a Git. Ya está en `.gitignore`.

---

## 🧠 Paso 3: Conectar el Cerebro (Claude Desktop Config)

Este es el paso **MÁS IMPORTANTE**. Tienes que decirle a Claude Desktop dónde están tus servidores MCP.

### 3.1 Abrir el archivo de configuración

**Windows:**
1. Presiona `Win + R`
2. Escribe: `%APPDATA%\Claude\claude_desktop_config.json`
3. Dale Enter

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

### 3.2 Copiar esta configuración

⚠️ **MUY IMPORTANTE**: Reemplaza `TU_RUTA_ABSOLUTA` por la ruta real donde tienes AI-factory.

**Ejemplo rutas:**
- Windows: `C:/Users/Usuario/Documentos/AI-factory`
- Mac: `/Users/tu/dev/AI-factory`
- Linux: `/home/tu/proyectos/AI-factory`

```json
{
  "mcpServers": {
    "perplexity-audit": {
      "command": "node",
      "args": [
        "TU_RUTA_ABSOLUTA/mcp/perplexity-audit-server.js"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "tu_clave_de_perplexity_aqui"
      }
    },
    "gemini-design": {
      "command": "node",
      "args": [
        "TU_RUTA_ABSOLUTA/mcp/gemini-design-server.js"
      ],
      "env": {
        "GEMINI_API_KEY": "tu_clave_de_gemini_aqui"
      }
    },
    "feature-replicator": {
      "command": "node",
      "args": [
        "TU_RUTA_ABSOLUTA/mcp/feature-replicator-server.js"
      ]
    }
  }
}
```

**💡 Consejo**: Aunque uses `.env` en el código, es más seguro poner las keys directamente en el JSON para asegurar que Claude las pase al proceso de Node.

### 3.3 Guardar y reiniciar

1. Guarda el archivo (`Ctrl+S` o `Cmd+S`)
2. **Cierra Claude Desktop completamente** (asegúrate de que no esté minimizado en la bandeja del sistema)
3. Abre Claude Desktop de nuevo

---

## ✅ Paso 4: Verificar Instalación

Una vez que Claude Desktop se reinicie, deberías ver los servidores MCP conectados.

### Prueba rápida

Abre Claude y pregunta:

**Para probar Perplexity:**
```
Analiza el stack: Python 3.9, Django 3.2, PostgreSQL 12
```

**Para probar Gemini:**
```
Genera un componente Button.tsx con variantes primary y secondary usando Tailwind
```

**Para probar Feature Replicator:**
```
Lista las funcionalidades en ./mi-proyecto-legacy
```

Si ves que Claude usa las herramientas MCP, **¡felicidades! 🎉** Todo está funcionando.

---

## 🐛 Solución de Problemas

### Error: "No MCP servers found"

**Causa:** Claude no encuentra el archivo de configuración o la ruta es incorrecta.

**Solución:**
1. Verifica que la ruta en `claude_desktop_config.json` sea absoluta y correcta
2. Usa barras `/` en lugar de `\\` (funciona en Windows también)
3. Reinicia Claude completamente (cierra desde la bandeja)

### Error: "PERPLEXITY_API_KEY is not defined"

**Causa:** La API key no está llegando al proceso.

**Solución:**
1. Pon la key directamente en `claude_desktop_config.json` en la sección `env`
2. Verifica que no tenga espacios ni comillas extras
3. Reinicia Claude Desktop

### Los logs están vacíos

**Causa:** Los servidores no se están ejecutando.

**Solución:**
1. Ejecuta manualmente para ver errores:
   ```bash
   node mcp/perplexity-audit-server.js
   ```
2. Verifica que Node.js 18+ esté instalado: `node --version`
3. Reinstala dependencias: `npm install`

### "Module not found: @modelcontextprotocol/sdk"

**Causa:** Dependencias no instaladas.

**Solución:**
```bash
npm install
```

---

## 📂 Verificar Logs

Después de usar los servidores MCP, verifica que se estén generando logs:

```bash
# Ver logs de Perplexity
cat mcp/perplexity-audit.log    # macOS/Linux
type mcp\perplexity-audit.log   # Windows

# Ver logs de Gemini
cat mcp/gemini-design.log
type mcp\gemini-design.log

# Ver logs de Feature Replicator
cat mcp/logs/feature-replicator.log
type mcp\logs\feature-replicator.log
```

Deberías ver líneas como:

```
[2025-12-18T10:30:45.123Z] MCP Perplexity Audit Server iniciando...
[2025-12-18T10:30:45.456Z] MCP Perplexity Audit Server conectado y listo
[2025-12-18T10:31:02.789Z] Herramienta invocada: stack_status
[2025-12-18T10:31:03.012Z] Llamando a Perplexity API (prompt length: 234 chars)
[2025-12-18T10:31:08.345Z] Perplexity API OK - Tokens usados: 1234
[2025-12-18T10:31:08.567Z] ✅ Reporte guardado: .ai/audit/2025-12-18_10-31-08_stack_status.md
```

---

## 📚 Siguiente Paso

Una vez instalado, lee el [Protocolo de Operación](templates/AGENTS_TEMPLATE.md) para aprender:
- Cuándo usar cada herramienta
- Reglas de oro para ahorrar tokens
- Flujos de trabajo recomendados
- Best practices del ecosistema

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs en `mcp/*.log`
2. Consulta la documentación en `docs/`
3. Abre un issue en GitHub

---

**¡Listo para empezar! 🚀** Ahora Claude tiene superpoderes de auditoría, diseño y análisis legacy.
[2025-12-15T10:30:00.000Z] MCP Perplexity Audit Server iniciando...
[2025-12-15T10:30:00.500Z] MCP Perplexity Audit Server conectado y listo
[2025-12-15T10:31:15.123Z] Herramienta invocada: stack_status
[2025-12-15T10:31:18.600Z] stack_status completada exitosamente - 3 componentes, riesgo: high
```

### Verificar documentos generados

Después de una auditoría, verifica que se generaron los documentos:

```bash
ls docs/  # macOS/Linux
dir docs\ # Windows
```

Deberías ver:

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE_OVERVIEW.md`
- `TECH_STACK_STATUS.md`
- `SECURITY_AUDIT.md`
- `PERFORMANCE_AUDIT.md`
- `CODE_QUALITY_REPORT.md`
- `FEATURES_OVERVIEW.md`
- `TODO_FEATURES.md`
- `IMPROVEMENT_PLAN.md` o `REWRITE_PROPOSAL.md`
- `AUDIT_TRAIL.md`

---

## 🐛 Troubleshooting

### Error: "PERPLEXITY_API_KEY no está configurada"

**Solución**: Verifica que:
1. El archivo `.env` existe en la raíz de `ai-factory`
2. Contiene `PERPLEXITY_API_KEY=pplx-...`
3. La configuración en `claude_desktop_config.json` tiene la variable `PERPLEXITY_API_KEY` en la sección `env`

### Error: "Cannot find module '@modelcontextprotocol/sdk'"

**Solución**: Ejecuta `npm install` en la carpeta `ai-factory`

### Claude no detecta las herramientas MCP

**Solución**:
1. Verifica que reiniciaste Claude Desktop después de editar la configuración
2. Verifica que la ruta en `claude_desktop_config.json` es correcta (absoluta, no relativa)
3. Verifica que `node` está en tu PATH:
   ```bash
   node --version  # Debe mostrar v18.0.0 o superior
   ```
4. Intenta ejecutar el servidor manualmente para ver errores:
   ```bash
   cd ai-factory
   node mcp/perplexity-audit-server.js
   ```
   Si hay errores de sintaxis o dependencias, los verás aquí

### Error 401 de Perplexity API

**Solución**: Tu API key es inválida o ha expirado. Verifica en https://www.perplexity.ai/settings/api

---

## 📚 Próximos Pasos

Una vez instalado, lee:

- [README.md](./README.md) - Documentación completa del ecosistema
- [prompts/AUDIT.md](./prompts/AUDIT.md) - Funcionamiento interno del ecosistema de auditoría
- [CHECKLIST.md](./CHECKLIST.md) - Verificación de que todo está implementado

---

## 💡 Consejos

1. **Primera auditoría**: Comienza con un proyecto pequeño para familiarizarte con el flujo
2. **Logs**: Revisa `mcp/perplexity-audit.log` si algo no funciona como esperas
3. **Tokens**: Perplexity tiene límites de rate; si ves errores 429, espera unos minutos
4. **Contexto**: Claude usará los documentos en `docs/` para mantener contexto entre sesiones

---

**¿Necesitas ayuda?** Abre un issue en GitHub con:
- Mensaje de error completo
- Contenido de `mcp/perplexity-audit.log`
- Tu configuración de `claude_desktop_config.json` (sin incluir tu API key)
