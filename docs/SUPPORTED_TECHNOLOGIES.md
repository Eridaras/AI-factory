# Tecnologías Soportadas por Feature Replicator

Este documento lista todas las tecnologías que el MCP `feature-replicator` puede analizar y documentar.

## 🔤 Lenguajes de Programación

### Tier 1 - Soporte Prioritario
- **C# / .NET** - ASP.NET MVC, Web API, Core, Web Forms
- **Java** - Spring, Spring Boot, Java EE, JSF, Servlets
- **JavaScript/TypeScript** - Node.js, Express, NestJS, React, Angular, Vue
- **Python** - Django, Flask, FastAPI, Pyramid
- **PHP** - Laravel, Symfony, CodeIgniter, WordPress, vanilla PHP

### Tier 2 - Soporte Adicional
- **Go** - Gin, Echo, Fiber, net/http
- **Ruby** - Rails, Sinatra, Grape
- **Kotlin** - Spring Boot, Ktor
- **Scala** - Play Framework, Akka HTTP
- **Rust** - Actix, Rocket, Axum

### Tier 3 - Legacy Enterprise
- **Visual Basic .NET** - WinForms, ASP.NET
- **VB6** - Desktop applications (limited)
- **Delphi/Object Pascal** - Desktop/server apps
- **PowerBuilder** - Enterprise apps
- **COBOL** - Mainframe systems (basic support)
- **Progress/OpenEdge** - ABL applications

## 🗄️ Bases de Datos

### SQL Databases
- **SAP HANA** - In-memory database
- **SQL Server** - Microsoft
- **Oracle Database** - Enterprise
- **PostgreSQL** - Open source
- **MySQL/MariaDB** - Web applications
- **IBM DB2** - Enterprise/mainframe
- **SQLite** - Embedded databases

### NoSQL Databases
- **MongoDB** - Document store
- **Redis** - Cache/key-value
- **Cassandra** - Wide column store
- **Elasticsearch** - Search engine
- **Couchbase** - Document store
- **DynamoDB** - AWS managed

### Legacy/Specialized
- **MS Access** - Desktop databases
- **FoxPro** - Legacy database
- **Informix** - Enterprise
- **Sybase** - Legacy enterprise

## 🏗️ Frameworks y Plataformas

### Web Frameworks
- **ASP.NET MVC** - Microsoft web
- **ASP.NET Web Forms** - Legacy Microsoft
- **Spring Boot** - Java modern
- **Spring MVC** - Java classic
- **Django** - Python batteries-included
- **Flask** - Python lightweight
- **Laravel** - PHP modern
- **Express.js** - Node.js minimal
- **NestJS** - Node.js enterprise
- **Ruby on Rails** - Ruby full-stack
- **Phoenix** - Elixir web

### Desktop/Mobile
- **WPF** - Windows desktop
- **WinForms** - Legacy Windows
- **Electron** - Cross-platform desktop
- **React Native** - Mobile cross-platform
- **Flutter** - Mobile cross-platform
- **Xamarin** - Legacy mobile .NET

### Enterprise/Integration
- **SAP ABAP** - SAP customizations
- **Oracle Forms** - Oracle UI
- **IBM WebSphere** - Java EE
- **JBoss/WildFly** - Java EE
- **BizTalk** - Microsoft integration

## 🔌 Tecnologías de Integración

### Messaging/Queues
- **RabbitMQ** - Message broker
- **Apache Kafka** - Event streaming
- **MSMQ** - Windows messaging
- **ActiveMQ** - Java messaging
- **IBM MQ** - Enterprise messaging
- **Azure Service Bus** - Cloud messaging
- **AWS SQS** - Cloud queuing

### APIs/Services
- **REST APIs** - HTTP/JSON
- **SOAP/WSDL** - XML services
- **GraphQL** - Query language
- **gRPC** - RPC framework
- **WCF** - Windows services
- **Web Services** - Legacy SOAP

### File Systems
- **SMB/CIFS** - Windows shares (\\SERVER\Share)
- **NFS** - Unix/Linux shares
- **FTP/SFTP** - File transfer
- **S3** - Cloud storage
- **Azure Blob** - Cloud storage
- **SharePoint** - Document management

## 📊 Reporting/BI

- **Crystal Reports** - Legacy reporting
- **SSRS** - SQL Server Reporting
- **Power BI** - Microsoft BI
- **Tableau** - BI platform
- **Jasper Reports** - Java reporting
- **QlikView** - BI platform

## 🔄 Job Schedulers

- **Windows Task Scheduler** - Windows cron
- **Cron** - Unix/Linux scheduler
- **Quartz.NET** - .NET scheduler
- **Hangfire** - .NET background jobs
- **Celery** - Python task queue
- **Airflow** - Workflow orchestration
- **Jenkins** - CI/CD + scheduler

## 🎯 Detección de Funcionalidades por Stack

### C# / .NET
**Detectar:**
- Controllers (archivos *Controller.cs)
- Actions (métodos públicos con [HttpGet], [HttpPost], etc.)
- Services (carpeta Services/, interfaces I*Service)
- Repositories (carpeta Repositories/, I*Repository)
- Jobs/Tasks (IJob, BackgroundService, Hangfire jobs)

**Queries SQL:**
- SqlCommand, SqlDataAdapter
- Entity Framework (DbContext, LINQ)
- Dapper queries

**Archivos:**
- File.ReadAllBytes, StreamReader
- Rutas UNC en configs (\\SERVER\Share)

### Java / Spring
**Detectar:**
- Controllers (@RestController, @Controller)
- Endpoints (@GetMapping, @PostMapping)
- Services (@Service)
- Repositories (@Repository, JpaRepository)
- Scheduled jobs (@Scheduled)

**Queries:**
- JPA/Hibernate (EntityManager, @Query)
- JDBC (PreparedStatement, ResultSet)
- MyBatis mappers

### PHP
**Detectar:**
- Routes (routes/web.php, api.php)
- Controllers (app/Http/Controllers)
- Models (app/Models)
- Jobs (app/Jobs)

**Queries:**
- PDO (prepare, execute)
- Eloquent ORM (Model::where())
- Raw queries (DB::select)

### Python
**Detectar:**
- Views/endpoints (views.py, @app.route)
- Models (models.py, SQLAlchemy)
- Services/utilities (services/)
- Celery tasks (@task)

**Queries:**
- SQLAlchemy (session.query)
- Django ORM (Model.objects)
- Raw SQL (cursor.execute)

### JavaScript/Node
**Detectar:**
- Routes (routes/, app.get/post)
- Controllers (controllers/)
- Services (services/)
- Models (models/, Sequelize/Mongoose)
- Jobs (Bull queues, node-cron)

**Queries:**
- Sequelize models
- Mongoose schemas
- Raw queries (connection.query)

## 🔍 Patrones de Extracción

### Queries SQL
```regex
SELECT|INSERT|UPDATE|DELETE|EXEC|EXECUTE
```

### Rutas UNC
```regex
\\\\[A-Za-z0-9_-]+\\[A-Za-z0-9_$-]+
```

### URLs/APIs
```regex
https?://[^\s"']+
```

### Strings de conexión
```regex
Server=|Data Source=|Host=|Database=|User Id=
```

## 📝 Notas de Implementación

### Priorización
1. **Fase 1**: C#, Java, PHP, Python, JavaScript (90% casos de uso)
2. **Fase 2**: Go, Ruby, TypeScript, Kotlin (modernización)
3. **Fase 3**: Legacy (VB.NET, Delphi, COBOL) según demanda

### Extensibilidad
El sistema está diseñado para agregar nuevos lenguajes mediante:
- Plugins de parsers por lenguaje
- Configuración JSON de patrones de detección
- Templates de prompts específicos por stack

### Limitaciones
- **COBOL/Mainframe**: Soporte básico, requiere acceso a fuentes
- **Compiled binaries**: Solo si hay fuentes disponibles
- **Ofuscated code**: Capacidades limitadas
