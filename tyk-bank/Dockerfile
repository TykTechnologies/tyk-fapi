FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Service to run (default: uk-account-information)
ARG SERVICE=uk-account-information
ENV SERVICE=${SERVICE}

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Run the specified service
CMD if [ "$SERVICE" = "uk-account-information" ]; then \
      node dist/uk/account-information/server.js; \
    elif [ "$SERVICE" = "uk-payment-initiation" ]; then \
      node dist/uk/payment-initiation/server.js; \
    elif [ "$SERVICE" = "brazil-account-information" ]; then \
      node dist/brazil/account-information/server.js; \
    else \
      echo "Unknown service: $SERVICE"; \
      exit 1; \
    fi