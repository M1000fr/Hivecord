# Use the official Bun image
FROM oven/bun:slim

# Set the working directory
WORKDIR /app

# Install OpenSSL and fonts
RUN apt-get update -y && apt-get install -y openssl fonts-dejavu-core fontconfig

# Copy package.json and bun.lock
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy prisma directory and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy the rest of the application code
COPY . .

# Create data directory
RUN mkdir -p data

# Start the application
CMD ["bun", "run", "start"]
