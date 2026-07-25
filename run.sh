#!/bin/bash

echo "Starting Server..."
node server.js &

# 3 seconds ka wait karein taake server achi tarah start ho jaye
sleep 3

echo "Starting Automation Bot..."
node bot.js
