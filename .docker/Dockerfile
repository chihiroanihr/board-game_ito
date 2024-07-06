# ---------- build ---------- #
FROM node:alpine AS build-init

RUN echo "[*] Dockerfile build started."

# Define "board-game_ito" as our working directory
WORKDIR /board-game_ito

# Copy root package.json, package-lock.json into the image
COPY ../package.json ./
COPY ../package-lock.json ./

# Copy /shared folder
COPY ../packages/shared ./packages/shared/

# ---------- client development ---------- #
FROM build-init AS build-dev-client

RUN echo "[*] Entered \"build-dev-client\" stage."

# Copy package.json file of the particular app into the image
COPY ../packages/client/package.json ./packages/client/

# Install packages
RUN npm install

# Clean build folder (dist)
# RUN npm run clean-dist:all

# Build /shared folder
# RUN npm run build:shared

EXPOSE 5173

# Specify default command to run app
CMD npm run build:shared && npm run start-dev:client

# ---------- server development ---------- #
FROM build-init AS build-dev-server

RUN echo "[*] Entered \"build-dev-server\" stage."

# Copy package.json file of the particular app into the image
COPY ../packages/server/package.json ./packages/server/

# Install packages
RUN npm install

# Clean build folder (dist)
# RUN npm run clean-dist:all

# Build /shared folder
# RUN npm run build:shared

EXPOSE 3000

# Specify default command to run app
CMD npm run build:shared && sleep 5 && npm run start-dev:server
# -> sleep to avoid error: "Error connecting to MongoDB MongoServerError: Authentication failed."

# ---------- production ---------- #
FROM build-init AS build-prod

RUN echo "[*] Entered \"build-prod\" stage."

# Copy other necessary files or folders into the image
COPY ../tsconfig.base.json ./
COPY ../tsconfig.json ./
COPY ../env/.env ./env/

# ---------- client production ---------- #
FROM build-prod AS build-prod-client

RUN echo "[*] Entered \"build-prod-client\" stage."

# Copy source codes of the particular app into the image
COPY ../packages/client ./packages/client/

# Install packages
RUN npm install --production

# Build app
RUN npm run build:client

# TODO: if server then run server by:
# CMD npm run start:server
# else client: use nginx

# ---------- webserver ---------- 
# FROM nginx:stable-alpine AS prod
# ARG BUILD_CONTEXT

# # We have our compiled client app in the node image. We need to take those files and put it in our nginx image.
# COPY --from=build /board-game_ito/packages/client/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# # Specify default command to run app (Start nginx web server)
# CMD ["nginx", "-g", "daemon off;"]

# ---------- server production ---------- #
FROM build-prod AS build-prod-server

RUN echo "[*] Entered \"build-prod-server\" stage."

# Copy source codes of the particular app into the image
COPY ../packages/server ./packages/server/

# Install packages
RUN npm install --production

EXPOSE 3001

# Build app
RUN npm run build:server