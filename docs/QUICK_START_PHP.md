# Guía Rápida: Analizar Proyecto PHP Legacy

## 1. Crear archivo de configuración en tu proyecto PHP

En la raíz de tu proyecto PHP legacy, crea el archivo `TECH_STACK_STATUS.json`:

```json
{
  "language": "php",
  "framework": "custom-php",
  "databases": [
    {
      "engine": "mysql",
      "name": "tu_base_de_datos",
      "version": "5.7"
    }
  ],
  "architecture": {
    "style": "layered",
    "layers": ["CAPA_DATOS", "CAPA_LOGICA", "FUNCIONES"]
  }
}
```

## 2. Opción A: Listar todas las funcionalidades automáticamente

Después de reiniciar Claude Desktop, puedes usar:

```javascript
// En Claude, pide:
"Lista todas las funcionalidades de mi proyecto PHP en D:\ruta\a\tu\proyecto"

// El MCP usará la herramienta list_features automáticamente
```

El sistema detectará:
- ✅ Controllers en carpetas con "Controller" en el nombre
- ✅ Models en carpetas "Models/" o "app/"
- ✅ Services en carpetas "Services/"
- ✅ Archivos .php con clases que extiendan Controller o Model

## 3. Opción B: Analizar funcionalidad específica manualmente

Si sabes qué archivos forman una funcionalidad, usa directamente `scan_feature`:

```javascript
// Ejemplo para "Gestión de Pedidos"
{
  "feature_id": "LEGACY-PEDIDOS",
  "entry_files": [
    "CAPA_LOGICA/pedidos/pedidosClass.php",
    "FUNCIONES/pedidos.php"
  ],
  "path": ".",
  "max_depth": 4
}
```

Esto extraerá:
- ✅ Queries SQL (SELECT, INSERT, UPDATE, DELETE)
- ✅ Rutas de archivos (fopen, file_get_contents, Storage::)
- ✅ APIs externas (URLs HTTP/HTTPS)
- ✅ Business rules (validaciones, comentarios TODO/BUSINESS)
- ✅ Análisis de queries (tablas, columnas, JOINs, WHERE)

## 4. Generar documentación Markdown

Después del análisis, genera el documento:

```javascript
// Pide a Claude:
"Genera la documentación Markdown de la feature LEGACY-PEDIDOS"

// O usa directamente:
{
  "feature_id": "LEGACY-PEDIDOS",
  "spec": { /* el objeto spec que devolvió scan_feature */ },
  "output_path": "docs/FEATURES_SPEC/",
  "filename": "pedidos_feature.md"
}
```

## 5. Estructura esperada del proyecto PHP

El detector de PHP busca archivos en estas ubicaciones:

```
tu-proyecto/
├── CAPA_DATOS/
│   ├── conexion.php
│   └── queries.php
├── CAPA_LOGICA/
│   ├── pedidos/
│   │   └── pedidosClass.php      ← Detectado como "business_logic"
│   └── clientes/
│       └── clientesClass.php
├── FUNCIONES/
│   ├── pedidos.php                ← Detectado si contiene funciones
│   └── helpers.php
├── Controllers/                    ← Detectado automáticamente
│   └── PedidosController.php
├── Models/                         ← Detectado automáticamente
│   └── Pedido.php
└── TECH_STACK_STATUS.json         ← Necesario
```

## 6. Patrones de detección para PHP

### Controllers
- Archivos con "Controller" en el nombre
- Carpetas "Controllers/"
- Clases que contengan: `class NombreController`

### Models
- Carpetas "Models/" o "app/"
- Clases que contengan: `extends Model` o `use HasFactory`

### Services
- Carpetas "Services/"
- Archivos con "Service" en el nombre

### Queries SQL
```php
// Detectados automáticamente:
$query = "SELECT * FROM pedidos WHERE id = ?";
$stmt = $pdo->prepare("INSERT INTO clientes VALUES (?, ?)");
mysqli_query($conn, "UPDATE productos SET stock = 0");
DB::table('users')->where('active', 1)->get();  // Eloquent
```

### File System
```php
// Detectados automáticamente:
$content = file_get_contents('/ruta/archivo.txt');
$handle = fopen('\\\\SERVER\\Share\\data.csv', 'r');
Storage::put('uploads/file.pdf', $data);
```

### APIs Externas
```php
// Detectados automáticamente:
$response = file_get_contents('https://api.example.com/endpoint');
curl_exec($ch); // Si la URL está en curl_setopt(CURLOPT_URL)
```

## 7. Troubleshooting

### "No features found"
- ✅ Verifica que `TECH_STACK_STATUS.json` tenga `"language": "php"`
- ✅ Confirma que los archivos .php estén en el path correcto
- ✅ Revisa el log: `mcp/feature-replicator.log`

### "Entry file not found"
- ✅ Usa rutas relativas desde la raíz del proyecto
- ✅ Ejemplo correcto: `"CAPA_LOGICA/pedidos/pedidosClass.php"`
- ✅ Ejemplo incorrecto: `"D:\proyecto\CAPA_LOGICA\pedidos\pedidosClass.php"`

### Features detectadas pero sin SQL/APIs
- Esto es normal si el archivo no contiene queries o llamadas HTTP directas
- Usa `max_depth: 4` en `scan_feature` para analizar archivos relacionados

## 8. Ejemplo Completo de Workflow

```bash
# 1. Crear TECH_STACK_STATUS.json en tu proyecto
cd D:\mi-proyecto-php-legacy
echo '{"language":"php","framework":"custom-php"}' > TECH_STACK_STATUS.json

# 2. Reiniciar Claude Desktop para cargar el MCP

# 3. En Claude, pedir:
"Analiza mi proyecto PHP en D:\mi-proyecto-php-legacy y lista las funcionalidades principales"

# 4. Claude usará list_features y mostrará:
#    - php-controller-pedidoscontroller
#    - php-service-pedidosservice
#    - php-model-pedido
#    - etc.

# 5. Analizar una funcionalidad específica:
"Analiza en detalle la funcionalidad php-controller-pedidoscontroller"

# 6. Claude usará scan_feature y mostrará:
#    - Queries SQL encontradas
#    - Archivos accedidos
#    - APIs llamadas
#    - Reglas de negocio

# 7. Generar documentación:
"Genera el documento Markdown de esta funcionalidad"

# 8. Resultado:
#    docs/FEATURES_SPEC/pedidoscontroller_feature.md
```

## 9. Ventajas vs Análisis Manual

| Tarea | Manual | Con MCP |
|-------|--------|---------|
| Encontrar todas las queries SQL | Horas | Segundos |
| Listar archivos accedidos | Horas | Segundos |
| Detectar APIs externas | Horas | Segundos |
| Documentar validaciones | Horas | Segundos |
| Mantener docs actualizadas | Imposible | Automático |

---

**¿Problemas?** Revisa el log en `mcp/feature-replicator.log` para debugging.
