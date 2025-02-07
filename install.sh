#!/bin/bash

# Ensure script fails on any error
set -e

# Clear npm cache
npm cache clean --force

# Remove existing node_modules and dist
rm -rf node_modules
rm -rf dist

# Install dependencies
npm install

# Exit successfully
exit 0
