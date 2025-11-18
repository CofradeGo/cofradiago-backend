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
/src
  /config       → Configuraciones globales
  /modules      → Módulos por funcionalidad (auth, users, hermandades…)
  /middlewares  → Middlewares globales
  /utils        → Utilidades y helpers
  /types        → Tipos globales
  /tests        → Tests unitarios
index.ts        → Entry point
```
## 🧑‍💻 Flujo de trabajo (Git Flow)
1. Crear rama desde develop.
2. Hacer cambios.
3. Ejecutar tests + lint.
4. Crear PR hacia develop.
5. Asociar la PR a su Historia de Usuario.

## 🔒 Licencia
Proyecto Privado - © Ángel Cárdenas Rodríguez