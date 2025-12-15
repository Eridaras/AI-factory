# 🚀 Instalación Rápida - AI Factory

Sigue estos pasos para poner en marcha el ecosistema de auditoría en menos de 5 minutos.

---

## ⚡ Instalación Express

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/ai-factory.git
cd ai-factory
npm install
```

### 2. Configurar API Key de Perplexity

Obtén tu API key en: https://www.perplexity.ai/settings/api

Crea el archivo `.env`:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edita `.env` y añade tu key:

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Configurar Claude Desktop

**Ubicación del archivo de configuración**:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Añade esta configuración**:

```json
{
  "mcpServers": {
    "perplexity-audit": {
      "command": "node",
      "args": [
        "C:\\ruta\\absoluta\\a\\ai-factory\\mcp\\perplexity-audit-server.js"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

> ⚠️ **Importante**: 
> - Reemplaza `C:\\ruta\\absoluta\\a\\ai-factory` con la ruta real donde clonaste el proyecto
> - En Windows, usa dobles barras invertidas `\\` o barras normales `/`
> - Reemplaza `pplx-xxxxxxxxxxxxxxxxxxxxx` con tu API key real

### 4. Reiniciar Claude Desktop

Cierra completamente Claude Desktop y ábrelo de nuevo.

### 5. Verificar instalación

En Claude Desktop, abre el proyecto que quieres auditar y escribe:

```
Revisa este proyecto en ./. Prioriza seguridad, bugs críticos y rendimiento.
Si conviene, propón recrearlo en un stack moderno y seguro, y dime por qué.
```

Claude debería:
1. Detectar las herramientas MCP disponibles (`stack_status`, `best_practices`)
2. Comenzar la auditoría siguiendo las 4 fases
3. Generar los documentos en `docs/`

---

## 🔍 Verificar que funciona

### Verificar logs

Después de usar el MCP, verifica que se está generando el log:

```bash
# Ver últimas líneas del log
cat mcp/perplexity-audit.log    # macOS/Linux
type mcp\perplexity-audit.log   # Windows
```

Deberías ver líneas como:

```
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
