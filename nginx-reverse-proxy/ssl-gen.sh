#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ./ssl

# Generate SSL certificate and key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./ssl/nginx.key \
  -out ./ssl/nginx.crt \
  -subj "/CN=localhost"

echo "SSL certificate and key have been generated in the ./ssl directory."
