FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies and force esbuild rebuild
RUN npm install && npm rebuild esbuild

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
