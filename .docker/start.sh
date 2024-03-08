#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Source the .env file from the root directory
source ../.env

if [ "$NODE_ENV" = "development" ]; then
    echo "[*] Running in development mode"
elif [ "$NODE_ENV" = "production" ]; then
    echo "[*] Running in production mode"
elif [ "$NODE_ENV" = "testing" ]; then
    echo "[*] Running in testing mode"
else
    echo "[!] Unknown mode, defaulting to development"
    # exit 1 # Exit with an error status
fi

# If keyfile does not exist then generate the keyfile and set permissions
if [ ! -f "./replica.key" ]; then
    bash keyfile.sh
fi

# Start the MongoDB containers
docker-compose --env-file ../.env up -d

# Wait for MongoDB to fully start
echo "[*] Waiting for MongoDB to start..."
sleep 5
docker container ls

# Check if the Docker initialization has already been done (by checking persistent volume's existence)
INITIALIZED=$(docker exec mongo1 sh -c 'if [ -f /etc/init-replica.js ]; then echo true; else echo false; fi')

# Check if Docker not yet initialized
if [ ! "$INITIALIZED" ]; then
    # Initialize the replica set configuration and create user
    docker exec -it mongo1 \
        mongosh admin \
        --eval \
        "var rootUsername = '$MONGO_ROOT_USERNAME'; var rootPassword = '$MONGO_ROOT_PASSWORD'; var replicaSetName = '$REPLICA_SET_NAME'" \
        /etc/init-replica.js
fi

# Execute the database initialization script
docker exec -it mongo1 \
    mongosh admin \
    --eval \
    "var rootUsername = '$MONGO_ROOT_USERNAME'; var rootPassword = '$MONGO_ROOT_PASSWORD'; var username = '$MONGO_USERNAME'; var password = '$MONGO_PASSWORD'; var dbName = '$MONGO_DB_NAME'" \
    /etc/init-db.js
