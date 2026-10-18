#!/bin/bash
# ==============================================================================
# DATABASE RESTORE SCRIPT
# Restores PostgreSQL database from compressed backup file with checksum verify
# ==============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    echo "Example: $0 /var/backups/kpi_system/kpi_backup_20261017_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kpi_prod_user}"
DB_NAME="${DB_NAME:-kpi_production_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' does not exist!"
    exit 1
fi

# Verify checksum if .sha256 file exists
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
    echo "[$(date)] >>> Verifying SHA-256 checksum..."
    sha256sum -c "${CHECKSUM_FILE}"
    echo "[$(date)] >>> Checksum verification PASSED!"
else
    echo "[$(date)] >>> Warning: No checksum file found. Skipping verification."
fi

read -p "WARNING: This will overwrite data in database '${DB_NAME}'. Continue? (y/N) " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Restore cancelled by user."
    exit 0
fi

export PGPASSWORD="${DB_PASSWORD:-KpiProduction2026Secret!}"

echo "[$(date)] >>> Restoring database '${DB_NAME}' from '${BACKUP_FILE}'..."
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"

echo "[$(date)] >>> Database restore completed successfully!"
