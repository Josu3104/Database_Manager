# 📊 Documentación del Proyecto: Database Manager MSSQL

### Datos esenciales:
- Puerto de backend: 3100
- Puerto de frontend: 5173
- Puerto de MSSQL: 1433
- Revisar el compose para mas info acerca de networks y servicios como la db
- El usuario de la base de datos mssql es 'SA', con rol de System Admin por defecto con la contraseña definida en el compose
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
### Instrucciones de ejecucion:
- Abrir consola en el directrorio actual, asegurarse de que contenga el docker-compose.yml y pegar el siguiente comando en consola
- docker-compose up -d 
- Acceder a la siguiente ruta en el navegador web de preferencia: https://localhost:5173 para interactuar con el programa


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 🎯 Descripción General

Este proyecto implementa una herramienta de gestión de bases de datos MSSQL similar a pgAdmin o DBeaver, con una interfaz web moderna y funcionalidades basicas, como
ejecutar sentencias SQL en un editor de texto, listar conexiones a una base de datos, listando sus objetos. Agraegando a lo anterior la funcionalidad extra de poder
crear tablas y vistas mediante un formulario, con la facilidad de proveer la sentencia SQL generada por ello. Por ultimo, cabe destacar que el proyecto en su mayoria 
esta escrito y documentado en ingles, a excepcion de este documento por fines de evaluacion.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
### ACLARACIONES:
- Este proyecto efectua uso de la IA responsablemente, como referencia, parte de esta documentacion, algunos comentarios generales sobre funciones.
  Adicionalmente, se resalta que el uso de esta fue efectuado principalmente de manera aislada al contenido principal a evaluar del proyecto. (En pocas palabras,
  el uso responsable de esta para desarrollar componentes visuales)
- El archivo master.json es necesario para poder conectarse a la base de datos, prevenir borrarlo.

### LIMITACIONES DE OBJETOS
- Segun lo investigado, los paquetes suelen ser colecciones de objetos, similar a como trabajan los schemas
  Sin embargo, para el caso de mssql, se encontro que este posee paquetes, pero bajo otro contexto, pero a pesar de dicho detalle, se decidio implementar de todas maneras
  a pesar de que estos siempre estaran vacios. Pese a esta limitacion, como intento, se realizo uso de IA para generar dicha consulta a las system
  tables, esta especifica antes de su declaracion mediante un comentario para mayo comprension. Ubicada en backend/src/api/databaseObjects/dbPbjects.js

### master.json de emergencia

{
    "user": "sa",
    "password": "YourStrong!Passw0rd",
    "host": "localhost",
    "server": "sqlserver",
    "database": "master",
    "port": 1433,
    "options": {
      "encrypt": false,
      "trustServerCertificate": true
    },
    "connectionName": "master"
  
}


## 🐛 Solución de Problemas
### Errores Comunes:
Pese a no ser un error realmente, tras levantar el contendor ya acceder al cliente, se puede visualizar un error que indica que la base de datos y el backend todavia
estan inicializandose.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
### Características Principales:
- **Interfaz Web Reactiva**: UI moderna con Material-UI y tema oscuro
- **Gestión Multi-Conexión**: Soporte para múltiples conexiones simultáneas
- **Navegación de Objetos**: Explorador de árbol para todos los objetos de BD
- **Editor SQL Avanzado**: Múltiples pestañas, ejecución selectiva, guardado/carga
- **Creación de Objetos**: Formularios para crear tablas y vistas
- **Gestión de Conexiones**: Crear, conectar, desconectar y eliminar conexiones

### Estructura del Proyecto:
Este proyecto está diseñado para ser escalable y mantenible, con una arquitectura clara que separa responsabilidades entre frontend, backend y base de datos. La documentación proporcionada cubre todos los aspectos esenciales para entender, desarrollar y mantener el sistema (O eso se espera). 

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🏗️ Arquitectura del Sistema

### Patrón de Arquitectura
```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐    TCP/IP     ┌─────────────────┐
│   Frontend      │ ◄─────────────► │    Backend      │ ◄────────────► │   SQL Server    │
│   (React.js)    │                 │  (Node.js/      │                │   (MSSQL)       │
│                 │                 │   Express)      │                │                 │
└─────────────────┘                 └─────────────────┘                └─────────────────┘
```

---
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 📁 Estructura del Proyecto

```
TBD2/
├── backend/                          # Servidor Node.js
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/          # Lógica de negocio
│   │   │   │   ├── AuthAndConnections/
│   │   │   │   │   ├── connectionManagement.js    # Gestión de conexiones
│   │   │   │   │   ├── fileManagement.js          # Manejo de archivos JSON
│   │   │   │   │   └── connectionsJSON/           # Credenciales guardadas
│   │   │   │   └── databaseObjects/
│   │   │   │       ├── dbObjects.js               # Getters de objetos BD
│   │   │   │       └── dbDLL.js                   # Operaciones DDL
│   │   │   └── routes/
│   │   │       └── databaseRoutes.js              # Endpoints API
│   │   └── index.js                               # Punto de entrada
│   ├── package.json
│   └── Dockerfile.dev
├── frontend/                         # Cliente React
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatabaseNavigator.jsx              # Explorador de BD
│   │   │   ├── QueryEditor.jsx                    # Editor SQL
│   │   │   ├── QueryResultsTable.jsx              # Tabla de resultados
│   │   │   └── CreateObjectModal.jsx              # Modal crear objetos
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml                # Orquestación de contenedores
└── README.md
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🔧 Backend - Node.js/Express

### Tecnologías Utilizadas:
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **mssql**: Driver para SQL Server
- **CORS**: Cross-Origin Resource Sharing
- **fs/promises**: Operaciones de archivos asíncronas

### Estructura del Backend:

#### 1. **Gestión de Conexiones** (`connectionManagement.js`)
```javascript
// Funciones principales:
- connectWith()           // Conectar a una BD
- disconnectFrom()        // Desconectar de una BD
- createConnection()      // Crear nueva conexión
- getActiveConnections()  // Obtener conexiones activas
```

**Características:**
- Pool de conexiones independientes para cada usuario
- Conexión maestra persistente para consultas del sistema
- Gestión automática de login/database creation
- Asignación de permisos db_owner

#### 2. **Objetos de Base de Datos** (`dbObjects.js`)
```javascript
// Getters implementados:
- getDatabases()          // Listar bases de datos
- getSchemas()            // Listar esquemas
- getTables()             // Listar tablas
- getViews()              // Listar vistas
- getProcedures()         // Listar procedimientos
- getFunctions()          // Listar funciones
- getSequences()          // Listar secuencias
- getTriggers()           // Listar triggers
- getIndexes()            // Listar índices
- getTableSpaces()        // Listar tablespaces
- getUsers()              // Listar usuarios
- getPackages()           // Listar paquetes SSIS
```

**Características:**
- Consultas usando `sys` tables
- Filtrado de esquemas del sistema
- Proyección de campos requeridos
- Manejo de errores robusto

#### 3. **Operaciones DDL** (`dbDLL.js`)
```javascript
// Funciones disponibles:
- createDatabase()        // Crear nueva base de datos
- executeSql()            // Ejecutar SQL arbitrario
```

**Características:**
- Ejecución directa de SQL
- Validación de conexiones
- Manejo de errores detallado
- Respuestas estructuradas

#### 4. **Gestión de Archivos** (`fileManagement.js`)
```javascript
// Operaciones de archivos:
- saveCredentials()       // Guardar credenciales JSON
- readCredentials()       // Leer credenciales JSON
- deleteCredentials()     // Eliminar archivo de conexión
- getUniqueFileName()     // Generar nombres únicos
```

**Características:**
- Almacenamiento seguro de credenciales
- Nombres de archivo únicos automáticos
- Validación de formato JSON
- Manejo de errores de I/O


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 🎨 Frontend - React.js

### Tecnologías Utilizadas:
- **React.js**: Biblioteca de UI
- **Material-UI**: Componentes de interfaz
- **Axios**: Cliente HTTP
- **Vite**: Build tool y dev server

### Componentes Principales:

#### 1. **DatabaseNavigator** (`DatabaseNavigator.jsx`)
**Propósito:** Explorador de árbol para navegar conexiones y objetos de BD

**Características:**
- Vista de árbol jerárquica
- Filtrado de conexiones
- Context menu (clic derecho)
- Indicadores de estado de conexión
- Carga dinámica de objetos
- Soporte para SSIS packages

**Funcionalidades:**
```javascript
// Operaciones disponibles:
- Conectar/Desconectar conexiones
- Refrescar objetos de BD
- Eliminar conexiones
- Crear tablas/vistas (context menu)
- Navegación por esquemas
```

#### 2. **QueryEditor** (`QueryEditor.jsx`)
**Propósito:** Editor SQL avanzado con múltiples pestañas

**Características:**
- Múltiples pestañas de script
- Ejecución completa o selectiva
- Guardado/carga de scripts
- Copia al portapapeles
- Asociación con conexiones específicas
- Atajos de teclado (Ctrl+S, Ctrl+O)

**Funcionalidades:**
```javascript
// Características del editor:
- Ejecutar script completo
- Ejecutar texto seleccionado
- Guardar script como archivo
- Cargar script desde archivo
- Copiar contenido al portapapeles
- Gestión de pestañas (agregar/cerrar)
```
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 🗄️ Base de Datos - SQL Server

### Configuración:
- **Versión:** SQL Server 2019/2022
- **Contenedor:** Docker con imagen oficial
- **Puerto:** 1433
- **Autenticación:** SQL Server Authentication
- **Usuario por defecto:** sa


### Objetos Soportados:
- **Tablas:** Creación, listado, estructura
- **Vistas:** Creación, listado, definición
- **Procedimientos:** Listado y ejecución
- **Funciones:** Listado y ejecución
- **Secuencias:** Listado
- **Triggers:** Listado
- **Índices:** Listado
- **Tablespaces:** Listado
- **Usuarios:** Listado
- **Paquetes SSIS:** Listado desde SSISDB 

---
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 🔄 Flujo de Sistema

### 1. **Inicialización del Sistema**
```
1. Backend inicia → Conecta a master DB
2. Carga conexiones guardadas → Lee archivos JSON
3. Frontend inicia → Carga lista de conexiones
4. Usuario selecciona conexión → Backend conecta
5. Carga objetos de BD → Master connection consulta sys tables
```

### 2. **Creación de Nueva Conexión**
```
1. Usuario llena formulario → Frontend valida
2. POST /create-connection → Backend recibe
3. Master connection crea login/database → SQL Server
4. Asigna permisos → db_owner role
5. Guarda credenciales → Archivo JSON
6. Retorna éxito → Frontend actualiza lista
```

### 3. **Ejecución de Consulta SQL**
```
1. Usuario escribe SQL → QueryEditor
2. Clic en Execute → POST /execute-sql
3. Backend valida conexión → Current connection
4. Ejecuta SQL → SQL Server
5. Retorna resultados → QueryResultsTable
6. Muestra en tabla → Frontend renderiza
```

### 4. **Creación de Objeto (Tabla/Vista)**
```
1. Usuario abre modal → CreateObjectModal
2. Llena formulario → Frontend genera SQL
3. Vista previa SQL → Usuario revisa
4. Clic en Create → POST /execute-sql
5. Backend ejecuta CREATE → SQL Server
6. Retorna éxito → Modal se cierra
7. Refresca navegador → Nuevo objeto visible
```
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 🌐 API Endpoints

### Gestión de Conexiones:
```http
GET    /api/database/connections          # Listar conexiones disponibles
POST   /api/database/connect              # Conectar a una BD
POST   /api/database/disconnect           # Desconectar de una BD
POST   /api/database/create-connection    # Crear nueva conexión
DELETE /api/database/delete-connection    # Eliminar conexión
GET    /api/database/current-connection   # Obtener conexión actual
```

### Objetos de Base de Datos:
```http
GET    /api/database/databases            # Listar bases de datos
GET    /api/database/schemas              # Listar esquemas
GET    /api/database/tables               # Listar tablas
GET    /api/database/views                # Listar vistas
GET    /api/database/procedures           # Listar procedimientos
GET    /api/database/functions            # Listar funciones
GET    /api/database/sequences            # Listar secuencias
GET    /api/database/triggers             # Listar triggers
GET    /api/database/indexes              # Listar índices
GET    /api/database/tablespaces          # Listar tablespaces
GET    /api/database/users                # Listar usuarios
GET    /api/database/packages             # Listar paquetes SSIS
```

### Operaciones SQL:
```http
POST   /api/database/execute-sql          # Ejecutar consulta SQL
```

### Parámetros de Consulta:
- `connectionName`: Nombre de la conexión (para endpoints de objetos)

### Formato de Respuesta:
```json
{
  "success": true,
  "data": [...],
  "message": "Operación exitosa"
}
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🔌 Gestión de Conexiones

### Estructura de Credenciales:
```json
{
  "connectionName": "nombre_unico",
  "user": "usuario_db",
  "password": "contraseña",
  "server": "sqlserver",
  "database": "nombre_bd",
  "port": 1433,
  "host": "localhost",
  "options": {
    "encrypt": true,
    "trustServerCertificate": true
  }
}
```

### Almacenamiento:
- **Ubicación:** `backend/src/api/controllers/AuthAndConnections/connectionsJSON/`
- **Formato:** Archivos JSON individuales
- **Nomenclatura:** `{connectionName}.json`

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🗃️ Operaciones de Base de Datos

### Consultas del Sistema:
Todas las consultas utilizan las tablas del sistema (`sys`) de SQL Server:





