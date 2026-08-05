# @repo/utils — Specification

Helper utilities for operational 3-shift calculations, date manipulation, Excel export/import, Inngest background job event constants, and event loop performance helpers.

## 1. Overview & Architecture

`@repo/utils` provides shared non-UI helper functions for server and client environments.

---

## 2. Exported Specification

### 2.1 Core Utilities (`src/index.ts`)

- **`sleep(ms: number)`:** Returns a promise that resolves after `ms`.
- **`clamp(value, min, max)`:** Bounds a number between minimum and maximum limits.
- **`formatBytes(bytes, decimals?)`:** Formats byte counts into human-readable strings (`KB`, `MB`, `GB`).
- **`compact<T>(obj)`:** Shallow-strips `undefined` properties from an object.
- **`cn(...inputs)`:** Light-weight classname filter.
- **`getThreeShift(date?, timeZone?)`:** Classifies current operational mining shift (**Shift A:** 06:00–14:00, **Shift B:** 14:00–22:00, **Shift C:** 22:00–06:00) in `Africa/Johannesburg`.
- **`getOperationalToday(timeZone?)`:** Returns the operational date string (`YYYY-MM-DD`).
- **`analytics`:** Development event tracking stub.

### 2.2 Excel Export & Parsing (`src/excel.ts`)

- `exportToExcel(data, fileName, sheetName)`: Single-sheet Excel export.
- `exportMultiSheetExcel(sheets, fileName)`: Multi-sheet Excel export.
- `exportStyledExcel(sheets, fileName, options)`: Styled Excel export with header fills, borders, and currency/date formatting.
- `parseExcel(file)`: Parses uploaded `.xlsx` files into JSON objects.

### 2.3 Inngest Client & Events (`src/inngest.ts`)

- `inngest`: Inngest singleton instance (`id: 'portal'`).
- Event Constants: `syncPlaybackEvent`, `generateReportEvent`, `aiGenerateEmbeddingEvent`, `aiMemoryPersistEvent`, `aiShiftSummarizeEvent`, `aiClassifyEvent`.

---

## 3. Dependencies

- `dependencies`: `exceljs` (`^4.4.0`), `inngest` (`^4.4.0`)
