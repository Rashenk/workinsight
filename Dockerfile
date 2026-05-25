
FROM node:24
# Copy files as a non-root user. The `node` user is built in the Node image.
WORKDIR /app
RUN chown node:node ./
USER node
# Defaults to production, docker-compose overrides this to development on build and run.
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
# Install dependencies first, as they change less often than code.
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci && npm cache clean --force
COPY ./ ./
EXPOSE 3000
CMD ["node", "./backend/server.js"]
