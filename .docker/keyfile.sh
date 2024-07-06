#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")" 

openssl rand -base64 756 > replica.key
chmod 400 replica.key
sudo chown mongodb:mongodb replica.key