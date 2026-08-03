#!/bin/bash
# scripts/memory-daemon.sh
# Monitors crush.db for new events and auto-indexes them for recall.

DB_PATH="/home/timothy/Projects/.crush/crush.db"
echo "Starting Memory Recall Daemon..."

while true; do
    # 1. Look for unindexed entries (simplified example logic)
    # In a production scenario, we'd query for entries where 'indexed' is false
    new_entries=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM log WHERE indexed = 0;")
    
    if [ "$new_entries" -gt 0 ]; then
        echo "Found $new_entries new events to index."
        # Call vector indexing logic here
        sqlite3 "$DB_PATH" "UPDATE log SET indexed = 1 WHERE indexed = 0;"
    fi
    
    sleep 30 # Check every 30 seconds
done
