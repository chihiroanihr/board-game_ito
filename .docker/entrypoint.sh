#!/bin/bash

# whoami

mkdir -p /pki2

# Set the keyfile permissions
chown mongodb:mongodb -R /pki2 # chown 999:999

# openssl rand -base64 756 > /pki/replica.key

cp /pki/replica.key /pki2/

chmod 400 /pki2/replica.key

# ls -la /pki2/replica.key

# Execute Mongo DB
exec mongod --auth --replSet ${REPLICA_SET_NAME} --keyFile /pki2/replica.key --bind_ip_all --port 27017 # --bind_ip_all "$@"

