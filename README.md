---
title: "Cofradiago — Backend"
description: "Backend del proyecto Cofradiago, desarrollado con Node.js, Express y TypeScript."
---

# 🛠️ Cofradiago — Backend

Backend oficial de **Cofradiago**, la plataforma moderna para la gestión digital de hermandades y cofradías.

---

## 🚀 Tecnologías principales

- Node.js 22  
- Express  
- TypeScript  
- ESLint + Prettier  
- Husky  
- Jest (o Vitest según configuración)  
- Dotenv  
- JWT  
- bcrypt  
- PostgreSQL  
- Prisma *(si aplica)*  

---

## 📦 Requisitos previos

- Node.js 20+ (recomendado 22 LTS)  
- npm / pnpm / yarn  
- Git  
- Base de datos configurada  

---

## 🔧 Instalación

```bash
git clone https://github.com/tu-org/cofradiago-backend.git
cd cofradiago-backend
npm install
```
## 🏃 Scripts disponibles

```bash
npm run dev
```
```bash
npm run build
```
```bash
npm start
```
```bash
npm run test
```
```bash
npm run lint
```

## 📁 Estructura del proyecto
```bash
/prisma         → Configuración y migraciones prisma para bbdd
/__tests__      → Tests unitarios
/src
  /config       → Configuraciones globales
  /controllers  → Controladores
  /models       → Modelos de bbdd
  /routes       → Rutas
  /services     → Servicios
index.ts        → Entry point
```

# Base de datos y Prisma

Este proyecto utiliza **PostgreSQL** en Docker y **Prisma 7** como ORM.  
Sigue estos pasos para poner todo en marcha.

---

## 1. Levantar la base de datos

- Asegúrate de tener `docker` y `docker-compose` instalados.  
- Ejecuta `docker-compose up -d` para levantar PostgreSQL.  
- Verifica que la base de datos está accesible y que las variables del `.env` son correctas.  

---

## 2. Instalar dependencias de Prisma

- Instala Prisma CLI y Client junto con el driver de PostgreSQL y dotenv.  
- Instala también los tipos de TypeScript para Node y PostgreSQL.  

---

## 3. Configurar Prisma Client

- Usa el archivo centralizado `prismaClient.ts` que ya está en el proyecto.  
- Este cliente incluye el adaptador de PostgreSQL y tiene logs habilitados para desarrollo.  

---

## 4. Definir el esquema Prisma

- El modelo `Test` ya está definido en `schema.prisma`.  
- No es necesario cambiar nada, Prisma Client y migraciones ya están configurados para usar la conexión de Docker.  

---

## 5. Scripts de Prisma

El `package.json` ya incluye todos los scripts necesarios:

- **Generar Prisma Client** → actualiza los tipos y el cliente a partir del esquema.  
- **Aplicar migraciones en desarrollo** → crea o aplica migraciones según los cambios en el esquema.  
- **Resetear la base de datos** → borra todo y aplica migraciones desde cero.  
- **Cargar datos de prueba (seed)** → inserta registros de ejemplo en la tabla `Test`.  
- **Abrir Prisma Studio** → permite explorar y editar la base de datos visualmente.  

---

## 6. Cargar datos de prueba

- Ejecuta el script de seed para insertar los registros de prueba en la tabla `Test`.  
- Verifica que los datos se han insertado correctamente.  

---

## 7. Explorar la base de datos con Prisma Studio

- Usa Prisma Studio para visualizar la tabla `Test` y los datos de prueba.  
- Puedes añadir, editar o borrar registros desde la interfaz web.  

---

## 8. Flujo típico de desarrollo

1. Levantar la base de datos con Docker.  
2. Generar Prisma Client.  
3. Aplicar migraciones.  
4. Cargar datos de prueba con seed.  
5. Verificar la base de datos en Prisma Studio.  

## 🧑‍💻 Flujo de trabajo (Git Flow)
1. Crear rama desde develop.
2. Hacer cambios.
3. Ejecutar tests + lint.
4. Crear PR hacia develop.
5. Asociar la PR a su Historia de Usuario.

## 🔒 Licencia
Proyecto Privado - © Ángel Cárdenas Rodríguez