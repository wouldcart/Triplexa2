## What Exists Today
- Frontend route `path="/itinerary"` protected by auth renders the page component.
- Two builder implementations exist:
  - `pages/itinerary/ItineraryBuilder` (local state, UI-filled builder)
  - `components/itinerary/CentralItineraryBuilder` (AI generator via `ItineraryService`, timeline, costs)
- Core generation lives client-side in `ItineraryService.generateItinerary`, producing days, activities, meals, accommodation, transport and pricing.
- Traveler-facing route exists at `/traveler/itinerary`.

## Proposed Next Steps
1. Replace or embed `CentralItineraryBuilder` inside `/itinerary` to enable AI generation UI by default.
2. Wire inventory data (`hotels`, `sightseeing`, `restaurants`, `transportRoutes`) via `useInventoryData` for realistic outputs.
3. Ensure `ItineraryContext` wraps the page so timeline/cost components get live state.
4. Add export actions (PDF/Excel) using existing stubs; keep them non-blocking for now.
5. Optionally add a lightweight backend save endpoint later; keep generation client-side.

## Verification
- Run through a sample generation (destinations + date range) and confirm days, activities, meals, transport and pricing populate.
- Validate route protection and traveler page access.
- Smoke-test `generateItinerary` with 2–3 destinations and check pricing totals.

## Confirmation
Would you like me to apply these changes so `/itinerary` uses the AI generator (`CentralItineraryBuilder`) and wire it with inventory and context, then run a quick validation pass?