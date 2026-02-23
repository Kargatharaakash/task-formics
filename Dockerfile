FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run db:seed && npm start"]
