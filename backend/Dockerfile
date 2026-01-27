# Backend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Run migrations, seed songs (노래 맞추기용), then start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed:songs && npm start"]
