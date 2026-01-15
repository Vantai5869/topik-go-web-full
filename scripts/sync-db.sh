#!/bin/bash

###############################################################################
# Database Sync Script
# Đồng bộ dữ liệu từ MongoDB Atlas (production) sang MongoDB Docker (local)
#
# Sử dụng:
#   ./scripts/sync-db.sh              # Sync toàn bộ database
#   ./scripts/sync-db.sh users        # Sync chỉ collection 'users'
#   ./scripts/sync-db.sh --backup     # Backup local DB trước khi sync
#
# NOTE: Script này chạy mongodump/mongorestore BÊN TRONG Docker container,
#       không cần cài MongoDB tools trên máy host!
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from .env
ATLAS_URI="mongodb+srv://taipv00:taipv00@cluster0.r2r6b.mongodb.net/"
ATLAS_DB="test"
DOCKER_URI="mongodb://admin:admin123@localhost:27017/?authSource=admin"
DOCKER_DB="topikgo"
BACKUP_DIR="./db-backups"
CONTAINER_NAME="topikgo-mongodb"

# Parse arguments
COLLECTION=""
DO_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backup|-b)
            DO_BACKUP=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/sync-db.sh [OPTIONS] [COLLECTION]"
            echo ""
            echo "Options:"
            echo "  --backup, -b    Backup local database before sync"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/sync-db.sh              # Sync all collections"
            echo "  ./scripts/sync-db.sh users        # Sync only 'users' collection"
            echo "  ./scripts/sync-db.sh --backup     # Backup before sync"
            exit 0
            ;;
        *)
            COLLECTION="$1"
            shift
            ;;
    esac
done

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker_running() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        log_error "MongoDB Docker container is not running!"
        log_info "Start with: docker-compose up -d mongodb"
        exit 1
    fi
}

backup_local_db() {
    log_info "Backing up local database..."
    mkdir -p "$BACKUP_DIR"

    BACKUP_PATH="$BACKUP_DIR/local-backup-$(date +%Y%m%d-%H%M%S)"

    # Run mongodump inside Docker container
    docker exec "$CONTAINER_NAME" mongodump \
        --uri="$DOCKER_URI" \
        --db="$DOCKER_DB" \
        --out="/tmp/backup" \
        --quiet

    # Copy backup from container to host
    docker cp "$CONTAINER_NAME:/tmp/backup/$DOCKER_DB" "$BACKUP_PATH"

    # Cleanup inside container
    docker exec "$CONTAINER_NAME" rm -rf /tmp/backup

    log_success "Backup saved to: $BACKUP_PATH"
}

sync_database() {
    local temp_dump="/tmp/sync-dump"

    # Step 1: Dump from Atlas (run inside container)
    log_info "Dumping data from MongoDB Atlas..."
    if [ -n "$COLLECTION" ]; then
        log_info "Collection: $COLLECTION"
        docker exec "$CONTAINER_NAME" mongodump \
            --uri="$ATLAS_URI" \
            --db="$ATLAS_DB" \
            --collection="$COLLECTION" \
            --out="$temp_dump" \
            --quiet
    else
        log_info "Syncing all collections..."
        docker exec "$CONTAINER_NAME" mongodump \
            --uri="$ATLAS_URI" \
            --db="$ATLAS_DB" \
            --out="$temp_dump" \
            --quiet
    fi

    log_success "Data dumped successfully"

    # Step 2: Restore to Docker MongoDB (run inside container)
    log_info "Restoring data to local Docker MongoDB..."
    if [ -n "$COLLECTION" ]; then
        docker exec "$CONTAINER_NAME" mongorestore \
            --uri="$DOCKER_URI" \
            --db="$DOCKER_DB" \
            --collection="$COLLECTION" \
            --drop \
            "$temp_dump/$ATLAS_DB/$COLLECTION.bson" \
            --quiet
    else
        docker exec "$CONTAINER_NAME" mongorestore \
            --uri="$DOCKER_URI" \
            --db="$DOCKER_DB" \
            --drop \
            "$temp_dump/$ATLAS_DB" \
            --quiet
    fi

    log_success "Data restored successfully"

    # Cleanup inside container
    docker exec "$CONTAINER_NAME" rm -rf "$temp_dump"
    log_info "Cleaned up temporary files"
}

show_stats() {
    log_info "Getting collection stats..."

    docker exec "$CONTAINER_NAME" mongosh \
        --username admin \
        --password admin123 \
        --authenticationDatabase admin \
        --quiet \
        --eval "
            db = db.getSiblingDB('$DOCKER_DB');
            print('\nCollections in local database:');
            db.getCollectionNames().forEach(function(name) {
                var count = db[name].countDocuments();
                print('  - ' + name + ': ' + count + ' documents');
            });
        "
}

###############################################################################
# Main Execution
###############################################################################

log_info "=== MongoDB Sync Script ==="
log_info "From: MongoDB Atlas ($ATLAS_DB)"
log_info "To: Docker MongoDB ($DOCKER_DB)"
log_info "Running mongodump/mongorestore INSIDE Docker container"
echo ""

# Pre-flight checks
check_docker_running

# Backup if requested
if [ "$DO_BACKUP" = true ]; then
    backup_local_db
    echo ""
fi

# Perform sync
sync_database
echo ""

# Show stats
show_stats
echo ""

log_success "=== Sync completed successfully! ==="
log_info "No MongoDB tools needed on host machine!"
