#!/bin/bash
# PocketBase Backup Script - CLI based, no token needed
# Works on local Mac or Oracle VPS

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "[$(date)] Starting PocketBase backup..."

# Stop PocketBase for clean backup
docker-compose stop pocketbase

# Create compressed backup
tar -czf "$BACKUP_DIR/pb_data_$DATE.tar.gz" pb_data/

# Restart PocketBase
docker-compose up -d pocketbase

# Check if backup succeeded
if [ -f "$BACKUP_DIR/pb_data_$DATE.tar.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/pb_data_$DATE.tar.gz" | cut -f1)
    echo "[$(date)] Backup saved: $BACKUP_DIR/pb_data_$DATE.tar.gz"
    echo "[$(date)] Backup size: $SIZE"
    
    # Delete backups older than 30 days
    find $BACKUP_DIR -name "pb_data_*.tar.gz" -mtime +30 -delete
    echo "[$(date)] Old backups cleaned (retaining last 30 days)"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

echo "[$(date)] Backup complete."
