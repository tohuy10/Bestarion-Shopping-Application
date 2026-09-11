# Stage 1: Build static React Vite dist
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy custom build output to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["/bin/sh", "-c", "echo '--------------------------------------------------' && echo '🚀 Bestarion Shopping Frontend is running!' && echo '👉 Access application at: http://localhost:5173' && echo '--------------------------------------------------' && exec nginx -g 'daemon off;'"]
