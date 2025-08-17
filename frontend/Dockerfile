# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Installe les deps
COPY package*.json ./
RUN npm ci

# Copie le code (utile si tu n'utilises pas de bind mount)
COPY . .

EXPOSE 5173
# Vite en mode dev + bind sur toutes les interfaces (pour accéder depuis l'hôte)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
