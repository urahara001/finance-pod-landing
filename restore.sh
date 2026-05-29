#!/bin/bash
# PocketBase restore - pick a backup file
BACKUP_DIR="backups"

if [ -z "$1" ]; then
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: ./restore.sh backups/filename.tar.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "File not found: $BACKUP_FILE"
    exit 1
fi

# Stop PocketBase
docker-compose stop pocketbase

# Remove current data
rm -rf pb_data/

# Restore from backup
tar -xzf "$BACKUP_FILE"

# Restart PocketBase
docker-compose up -d pocketbase

echo "Restored from: $BACKUP_FILE"
echo "PocketBase restarted"
