#!/bin/bash

# Navigate to the root directory
cd "$(dirname "$0")"

# If ssl keyfolder does not exist then generate the keyfolder
if [ ! -d "./ssl" ]; then
    echo "[*] Creating ssl keyfolder."
    mkdir ssl
    chmod 700 ssl
    cd ssl
    openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout localhost.key -out localhost.pem -subj "/C=US/CN=localhost"      
    openssl x509 -outform pem -in localhost.pem -out localhost.crt
fi

# Navigate to the .docker directory
cd "$(dirname "$0")"/.docker

# If keyfile does not exist then generate the keyfile and set permissions
if [ ! -f "./replica.key" ]; then
    echo "[*] Creating Mongo DB replica keyfile."
    bash keyfile.sh
fi

# Source the .env file from the root directory
source ../env/.env

# Start the MongoDB containers
if [ "$START_APPS_IN_DOCKER" != true ]; then
    docker-compose up -d

elif [ "$NODE_ENV" = "development" ]; then
    echo "[*] Apps start inside Docker containers. Running in development mode."
    COMPOSE_PROFILES=dev DOCKER_BUILDKIT=1 docker-compose up -d

elif [ "$NODE_ENV" = "production" ]; then
    echo "[*] Apps start inside Docker containers. Running in production mode."
    COMPOSE_PROFILES=prod DOCKER_BUILDKIT=1 docker-compose up -d

elif [ "$NODE_ENV" = "testing" ]; then
    echo "[*] Apps start inside Docker containers. Running in testing mode."

else
    echo "[!] Unknown mode."
    exit 1 # Exit with an error status
fi

# Wait for MongoDB to fully start
echo "[*] Waiting for MongoDB to start..."
sleep 5

# Initialize the replica set configuration and create user
docker exec -it mongo1 \
    mongosh admin \
    --eval \
    "var rootUsername = '$MONGO_ROOT_USERNAME'; var rootPassword = '$MONGO_ROOT_PASSWORD'; var replicaSetName = '$REPLICA_SET_NAME'" \
    /etc/init-replica.js

# Execute the database initialization script
docker exec -it mongo1 \
    mongosh admin \
    --eval \
    "var rootUsername = '$MONGO_ROOT_USERNAME'; var rootPassword = '$MONGO_ROOT_PASSWORD'; var username = '$MONGO_USERNAME'; var password = '$MONGO_PASSWORD'; var dbName = '$MONGO_DB_NAME'" \
    /etc/init-db.js

docker ps
