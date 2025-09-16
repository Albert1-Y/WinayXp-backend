# Imagen base
FROM node:20-alpine

# Crear directorio
WORKDIR /app

# Copiar manifiestos e instalar deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de arranque
CMD ["node", "index.js"]
