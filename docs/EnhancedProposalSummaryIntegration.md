# Enhanced Proposal Summary Integration Guide

## Overview

The EnhancedProposalSummary component provides comprehensive optional components tracking and display functionality for proposal summaries. It integrates seamlessly with the existing optional records system and provides:

- **Separate mandatory and optional calculations**
- **Dynamic range display (Base → Base + Optional)**
- **Visual color coding (Blue for Mandatory, Amber for Optional, Green for Combined)**
- **Real-time toggle functionality**
- **City-wise optional breakdown**
- **Enhanced accommodation integration**

## Installation

The EnhancedProposalSummary component is already created at `/src/components/proposal/EnhancedProposalSummary.tsx`

## Basic Usage

```tsx
import { EnhancedProposalSummary } from '@/components/proposal/EnhancedProposalSummary';

// In your component
<EnhancedProposalSummary
  query={queryData}
  accommodations={accommodationData}
  transportRoutes={transportData}
  activities={activityData}
  proposalId={proposalId}
  showToggleControls={true}
  onOptionalToggle={(itemId, itemType, isOptional) => {
    console.log(`Item ${itemId} (${itemType}) marked as ${isOptional ? 'optional' : 'included'}`);
  }}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `query` | `any` | Yes | Query data containing destination, pax details, etc. |
| `accommodations` | `any[]` | Yes | Array of accommodation data |
| `transportRoutes` | `any[]` | Yes | Array of transport route data |
| `activities` | `any[]` | Yes | Array of activity/sightseeing data |
| `proposalId` | `string` | Yes | Proposal ID for optional records sync |
| `className` | `string` | No | Additional CSS classes |
| `showToggleControls` | `boolean` | No | Show optional item toggle controls (default: true) |
| `onOptionalToggle` | `function` | No | Callback when optional item is toggled |

## Integration with Existing Components

### 1. Replace CompactProposalSummary

Replace the existing CompactProposalSummary with EnhancedProposalSummary in your proposal creation pages:

```tsx
// Before
<CompactProposalSummary
  days={days}
  query={query}
  accommodations={accommodations}
  accommodationsByDay={accommodationsByDay}
  optionalRecords={optionalRecords}
/>

// After
<EnhancedProposalSummary
  query={query}
  accommodations={accommodations}
  transportRoutes={transportRoutes}
  activities={activities}
  proposalId={query.proposalId || query.id}
  showToggleControls={true}
/>
```

### 2. Extract Data from Days

Convert day-based data to component arrays:

```tsx
const transportRoutes = days.flatMap(day => 
  day.transport?.map(transport => ({
    ...transport,
    day: day.dayNumber,
    city: day.city
  })) || []
);

const activities = days.flatMap(day => 
  day.activities?.map(activity => ({
    ...activity,
    day: day.dayNumber,
    city: day.city
  })) || []
);
```

### 3. Handle Optional Records Updates

The component automatically syncs with the optional records system. You can provide a callback for additional handling:

```tsx
const handleOptionalToggle = async (itemId, itemType, isOptional) => {
  // Additional logic here
  console.log(`Optional status changed for ${itemType} ${itemId}: ${isOptional}`);
  
  // You can also trigger other updates
  await updateRelatedComponents(itemId, itemType, isOptional);
};

<EnhancedProposalSummary
  // ... other props
  onOptionalToggle={handleOptionalToggle}
/>
```

## Features

### 1. Enhanced Summary Overview
- Displays total mandatory and optional item counts
- Shows dynamic package range (Base → Base + Optional)
- Color-coded sections for easy identification

### 2. City-wise Optional Breakdown
- Shows optional components organized by city
- Displays mandatory vs optional counts and costs per city
- Expandable sections for detailed viewing

### 3. Optional Components Management
- Toggle switches for each optional item
- Real-time status updates
- Visual indicators for included vs optional items

### 4. Accommodation Integration
- Enhanced accommodation options display
- Shows optional add-ons impact on total package price
- Per-person calculations with optional components

### 5. Quick Stats Dashboard
- Mandatory items count
- Optional items count  
- Cities with options
- Hotel options available

## Styling and Customization

The component uses:
- **Blue color scheme** for mandatory components
- **Amber color scheme** for optional components
- **Green color scheme** for combined totals
- **Gradient backgrounds** for visual appeal
- **Responsive grid layouts** for different screen sizes

## Backward Compatibility

The existing CompactProposalSummary has been enhanced to show basic optional integration when `showEnhancedOptional={true}` is passed, maintaining backward compatibility while providing a migration path.

## Error Handling

The component includes:
- Loading states during optional records sync
- Error toasts for failed updates
- Graceful fallbacks for missing data
- Validation for proposal ID formats

## Performance

- Uses React.memo and useMemo for optimized re-renders
- Debounced updates to prevent excessive API calls
- Efficient data processing with minimal computational overhead
- Lazy loading of optional records data

## Example Implementation

Here's a complete example of integrating EnhancedProposalSummary in a proposal creation page:

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { EnhancedProposalSummary } from '@/components/proposal/EnhancedProposalSummary';
import { useOptionalRecords } from '@/hooks/useOptionalRecords';

const ProposalCreationPage = () => {
  const [query, setQuery] = useState(null);
  const [days, setDays] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  
  // Extract data from days
  const transportRoutes = useMemo(() => 
    days.flatMap(day => day.transport?.map(transport => ({
      ...transport,
      day: day.dayNumber,
      city: day.city
    })) || []), [days]);

  const activities = useMemo(() => 
    days.flatMap(day => day.activities?.map(activity => ({
      ...activity,
      day: day.dayNumber,
      city: day.city
    })) || []), [days]);

  const handleOptionalToggle = (itemId, itemType, isOptional) => {
    console.log(`Optional toggle: ${itemType} ${itemId} -> ${isOptional ? 'optional' : 'included'}`);
    // Additional logic here
  };

  if (!query) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Other proposal components */}
      
      <EnhancedProposalSummary
        query={query}
        accommodations={accommodations}
        transportRoutes={transportRoutes}
        activities={activities}
        proposalId={query.proposalId || query.id}
        showToggleControls={true}
        onOptionalToggle={handleOptionalToggle}
        className="mt-6"
      />
    </div>
  );
};

export default ProposalCreationPage;
```

## Troubleshooting

### Common Issues

1. **Optional records not loading**: Check that `proposalId` is valid and matches the format expected by the database
2. **Toggle updates failing**: Ensure the optional records hook is properly configured
3. **Pricing calculations incorrect**: Verify that cost data is properly included in activity/transport objects

### Debug Tips

- Check browser console for detailed logs
- Verify optional records are being saved to Supabase
- Test with both UUID and enquiry ID formats
- Ensure all required props are provided

## Next Steps

- Integrate with PDF generation to respect optional toggles
- Add export functionality with optional component breakdowns
- Implement advanced filtering and sorting options
- Add bulk operations for optional items