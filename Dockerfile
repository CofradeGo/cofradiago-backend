# Imagen base oficial de Node.js LTS
FROM node:22

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los archivos de dependencias para cachear la instalación
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el resto del código
COPY . .

# Puerto que expondrá la aplicación
EXPOSE 3000

# Comando por defecto al iniciar el contenedor
CMD ["npm", "run", "dev"]
