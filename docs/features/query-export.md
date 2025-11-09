# Query Export

This feature lets you export enquiries from the Queries management page as CSV or Excel.

## Where to find it

- Go to `/queries`.
- In the page header, use the new Export controls:
  - `Export` → exports the current filter/search scope.
  - `Last Month` → exports all enquiries created in the previous calendar month.

## What gets exported

- Current scope respects your `search` term and `status` filter.
- Last month uses the enquiry `created_at` date range for the previous month.
- Output columns include agent details, destination, cities, travel dates, pax counts, budget, and timestamps.

## Formats

- CSV: generated via `papaparse`.
- Excel: generated via `xlsx` (through the project-wide safety shim).

## File naming

- `queries-current-YYYY-MM-DD.csv|xlsx`
- `queries-last-month-YYYY-MM-DD.csv|xlsx`

## Limits and notes

- Data is fetched server-side in batches to avoid large single queries.
- The `xlsx` shim enforces size and dimension limits for safety.
- Export counts are shown in a toast on completion.

## Troubleshooting

- If export fails, a toast will show the error message. Try narrowing filters.
- Ensure you are authenticated; some data sources require an active session.