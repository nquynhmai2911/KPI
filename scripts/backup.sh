#!/bin/bash
# ==============================================================================
# DATABASE BACKUP AUTOMATION SCRIPT
# Backs up PostgreSQL database with timestamp, compression, and log rotation
# ==============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kpi_system}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kpi_prod_user}"
DB_NAME="${DB_NAME:-kpi_production_db}"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/kpi_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] >>> Starting KPI System Database Backup for ${DB_NAME}..."

# Export PGPASSWORD if provided
export PGPASSWORD="${DB_PASSWORD:-KpiProduction2026Secret!}"

# Run pg_dump with gzip compression
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

# Check file size
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] >>> Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Generate SHA-256 checksum for data integrity verification
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
echo "[$(date)] >>> SHA-256 Checksum generated."

# Rotate older backups (> 30 days)
echo "[$(date)] >>> Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "kpi_backup_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] >>> Backup and cleanup process finished."
