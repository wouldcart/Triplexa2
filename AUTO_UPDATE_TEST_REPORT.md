# Enquiry Status Auto-Update Test Report

## Issue Summary
The enquiry status was not automatically updating from "Assigned" to "In Progress" when drafts existed, even though the functionality was implemented in the ProposalActions component.

## Root Cause
The `onQueryUpdate` callback function was not being destructured from the component props in the ProposalActions component, causing a reference error when trying to update the local query state.

## Fix Applied
**File:** `src/components/queries/ProposalActions.tsx`
**Line 40:** Added `onQueryUpdate` to the destructured props:

```typescript
// Before (broken)
const ProposalActions: React.FC<ProposalActionsProps> = ({ query, onProposalStateChange }) => {

// After (fixed)
const ProposalActions: React.FC<ProposalActionsProps> = ({ query, onProposalStateChange, onQueryUpdate }) => {
```

## Auto-Update Logic
The auto-update functionality works as follows:

1. **Trigger Condition:** When `proposalState.hasDrafts` is true AND `proposalState.hasProposals` is false AND query status is either "assigned" or "new"

2. **Update Process:**
   - Updates database first using `updateEnquiry()` service
   - Shows toast notification to user
   - Immediately updates local state via `onQueryUpdate` callback for instant UI feedback
   - Refreshes query data from database to ensure consistency

3. **Code Location:** Lines 305-330 in `src/components/queries/ProposalActions.tsx`

```typescript
if (proposalState.hasDrafts && !proposalState.hasProposals && (query.status === 'assigned' || query.status === 'new')) {
  console.log(`Auto-updating enquiry ${query.id} from ${query.status} to in-progress (drafts: ${proposalState.draftCount}, proposals: ${proposalState.proposalCount})`);
  
  try {
    // Update database first
    await updateEnquiry(query.id, { status: 'in-progress', updatedAt: new Date().toISOString() } as any);
    toast({ title: 'Status Updated', description: 'Enquiry marked In Progress based on draft activity' });
    
    // Immediately update local state for instant UI feedback
    const updatedQuery = { ...query, status: 'in-progress', updatedAt: new Date().toISOString() };
    onQueryUpdate?.(updatedQuery);  // This was broken before the fix
    console.log(`Local query status updated to in-progress for enquiry ${query.id}`);
    
    // Then refresh from database to ensure consistency
    try {
      const { data: refreshedQuery } = await ProposalService.getQueryByIdAsync(query.id);
      if (refreshedQuery) {
        onQueryUpdate?.(refreshedQuery);
        console.log(`Query data refreshed from database for enquiry ${query.id}`);
      }
    } catch (refreshError) {
      console.warn('Failed to refresh query data:', refreshError);
    }
  } catch (e: any) {
    console.warn('Auto status update failed:', e?.message || e);
  }
}
```

## Test Scenarios

### ✅ Test Case 1: Query with "Assigned" status and local drafts
**Steps:**
1. Navigate to query with "Assigned" status
2. Create localStorage draft: `localStorage.setItem('proposal_draft_<query-id>', JSON.stringify({...}))`
3. Reload page

**Expected:** Status automatically changes to "In Progress"

### ✅ Test Case 2: Query with "Assigned" status and Supabase drafts
**Steps:**
1. Navigate to query with "Assigned" status
2. Create draft in Supabase with `status='draft'`
3. Reload page

**Expected:** Status automatically changes to "In Progress"

### ✅ Test Case 3: Query with "Assigned" status but no drafts
**Steps:**
1. Navigate to query with "Assigned" status
2. Ensure no drafts exist (local or Supabase)
3. Reload page

**Expected:** Status remains "Assigned" (no auto-update)

### ✅ Test Case 4: Query with existing proposals
**Steps:**
1. Navigate to query with "Assigned" status
2. Create drafts but also have existing proposals
3. Reload page

**Expected:** Status remains "Assigned" (auto-update only triggers when no proposals exist)

## Expected Console Output
When auto-update triggers:
```
Auto-updating enquiry ENQ123 from assigned to in-progress (drafts: 1, proposals: 0)
Local query status updated to in-progress for enquiry ENQ123
Query data refreshed from database for enquiry ENQ123
```

## UI Changes
- Status badge changes from "Assigned" to "In Progress"
- Toast notification appears: "Status Updated - Enquiry marked In Progress based on draft activity"
- "Draft in Progress" banner appears in ProposalActions component

## Files Modified
1. **`src/components/queries/ProposalActions.tsx`** - Fixed onQueryUpdate destructuring
2. **`src/components/queries/status/EnhancedStatusBadge.tsx`** - Added data-testid for testing

## Verification
The fix has been tested and verified to work correctly. The auto-update functionality now properly:
- Detects when drafts exist for assigned queries
- Updates database status from "assigned" to "in-progress"
- Provides immediate UI feedback
- Shows appropriate notifications

## Additional Notes
- The auto-update only triggers once per page load
- It requires both drafts to exist AND no existing proposals
- The update is logged for debugging purposes
- Error handling prevents UI disruption if the update fails