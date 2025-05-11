# Use Node.js base image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose backend port (change if different)
EXPOSE 8000

# Run the app
CMD ["npm", "run", "dev"]




