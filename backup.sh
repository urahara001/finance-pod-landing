#!/bin/bash
# PocketBase backup - works without API login
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Stop PocketBase to ensure clean backup
docker-compose stop pocketbase

# Copy the entire data directory
tar -czf "$BACKUP_DIR/pb_data_$DATE.tar.gz" pb_data/

# Restart PocketBase
docker-compose up -d pocketbase

echo "Backup saved: $BACKUP_DIR/pb_data_$DATE.tar.gz"
echo "Size: $(du -h $BACKUP_DIR/pb_data_$DATE.tar.gz | cut -f1)"
