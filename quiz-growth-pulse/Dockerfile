# Use Debian-based image (not Alpine)
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose Vite port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]
