#!/bin/bash

IMAGE_NAME="nginx-proxy"

cd ../angular-test-manager || exit
npm run build

cd - || exit
mkdir -p ./dist/angular/browser
cp -r ../angular-test-manager/dist/angular/browser ./dist/angular/browser

podman build -t $IMAGE_NAME .

podman run -d \
  -p 8000:8000 \
  --network=host \
  --replace \
  --name $IMAGE_NAME \
  $IMAGE_NAME:latest
