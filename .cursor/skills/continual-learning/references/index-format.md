# Index File Format

## Schema

The `continual-learning-index.json` file tracks processed transcripts to enable incremental updates.

```json
{
  "version": 1,
  "lastUpdated": 1721476800000,
  "transcripts": {
    "/path/to/transcript1.json": 1721476800000,
    "/path/to/transcript2.md": 1721476900000,
    "/path/to/transcript3.json": 1721477000000
  }
}
```

## Fields

- **version**: Index format version (number)
- **lastUpdated**: Timestamp of last index refresh in milliseconds (number)
- **transcripts**: Object mapping transcript paths to mtimes
  - **Key**: Absolute path to transcript file (string)
  - **Value**: Modification timestamp in milliseconds (number)

## Usage

1. **Check if transcript needs processing**: Compare current file mtime vs indexed mtime
2. **Update after processing**: Set indexed mtime to current file mtime
3. **Cleanup**: Remove entries for deleted transcripts on refresh

## Location

Default: `/home/timothy/Projects/.cursor/hooks/state/continual-learning-index.json`

## Implementation

```bash
# Check if file needs processing
TRANSCRIPT_MTIME=$(stat -c %Y "$transcript")
INDEXED_MTIME=$(jq -r --arg path "$transcript" '.transcripts[$path] // 0' "$INDEX_FILE")

if [ "$TRANSCRIPT_MTIME" -gt "$INDEXED_MTIME" ]; then
  # Process transcript
fi
```
