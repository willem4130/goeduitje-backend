# Frontend API Integration Contract

**Version**: 1.0
**Last Updated**: December 20, 2024
**Backend Port**: 3003
**Frontend Port**: 3000

---

## Overview

This document defines the API contract between the Goeduitje frontend website (goeduitje-nl-rebuild) and the backend CMS (goeduitje-backend). The frontend should use these endpoints to submit workshop requests from the public website.

---

## Base URL

**Development**:
- Backend: `http://localhost:3003`
- Frontend: `http://localhost:3000`

**Production**:
- Backend: TBD (will be separate domain, e.g., `https://admin.goeduitje.nl`)
- Frontend: `https://www.goeduitje.nl`

---

## Workshop Request Submission

### POST /api/workshops/requests

Create a new workshop request from the frontend form.

#### Endpoint

```
POST http://localhost:3003/api/workshops/requests
```

#### Headers

```
Content-Type: application/json
```

#### Request Body

```typescript
{
  // Contact Information (REQUIRED)
  contactName: string       // Customer name
  email: string            // Customer email (validated)
  phone?: string           // Phone number (optional)
  organization?: string    // Company name (optional)

  // Workshop Details (REQUIRED)
  activityType: string     // Type of workshop (e.g., "Kookworkshop", "Stadsspel")
  participants: number     // Number of participants
  preferredDate: string    // ISO date string or null if TBD
  location?: string        // City or location preference

  // Additional Details (OPTIONAL)
  alternativeDate?: string      // Alternative date (ISO string)
  ageGroup?: string            // Age range (e.g., "25-35")
  travelDistance?: number      // Distance in km
  specialRequirements?: string  // Special requests
  dietaryRestrictions?: string  // Dietary needs
  accessibilityNeeds?: string   // Accessibility requirements
}
```

#### Example Request

```json
{
  "contactName": "Jan Janssen",
  "email": "jan@example.com",
  "phone": "06 12345678",
  "organization": "Bedrijf B.V.",
  "activityType": "Kookworkshop",
  "participants": 20,
  "preferredDate": "2025-03-15",
  "alternativeDate": null,
  "ageGroup": "25-40",
  "location": "Utrecht",
  "travelDistance": 25,
  "specialRequirements": "Graag een vegetarische optie",
  "dietaryRestrictions": "2 personen glutenvrij",
  "accessibilityNeeds": "Rolstoeltoegankelijk"
}
```

#### Response (Success - 201 Created)

```json
{
  "request": {
    "id": 123,
    "status": "leeg",
    "contactName": "Jan Janssen",
    "email": "jan@example.com",
    "phone": "06 12345678",
    "organization": "Bedrijf B.V.",
    "activityType": "Kookworkshop",
    "participants": 20,
    "preferredDate": "2025-03-15T00:00:00.000Z",
    "alternativeDate": null,
    "ageGroup": "25-40",
    "location": "Utrecht",
    "travelDistance": 25,
    "specialRequirements": "Graag een vegetarische optie",
    "dietaryRestrictions": "2 personen glutenvrij",
    "accessibilityNeeds": "Rolstoeltoegankelijk",
    "quotedPrice": null,
    "finalPrice": null,
    "quoteEmailSentAt": null,
    "quotePdfUrl": null,
    "aiGeneratedEmailContent": null,
    "createdAt": "2024-12-20T10:30:00.000Z",
    "updatedAt": "2024-12-20T10:30:00.000Z",
    "notes": null
  }
}
```

#### Response (Error - 400 Bad Request)

```json
{
  "error": "Missing required fields",
  "details": {
    "contactName": "Required",
    "email": "Required and must be valid",
    "activityType": "Required",
    "participants": "Required and must be a number"
  }
}
```

---

## Field Mapping: Frontend Form → Backend API

### Current Mismatch Analysis

⚠️ **IMPORTANT**: The current frontend form (workshop-configurator.tsx) does NOT match the backend schema exactly. Below is the mapping needed:

| Frontend Field | Type | Backend Field | Notes |
|---|---|---|---|
| `name` | string | `contactName` | **Rename required** |
| `email` | string | `email` | ✅ Direct mapping |
| `companyName` | string | `organization` | **Rename required** |
| `btwNumber` | string | ❌ Not stored | Can be added to `notes` or `organization` |
| `participantCount` | number | `participants` | **Rename required** |
| `workshops` | string[] | `activityType` | **Transform required** - Join array into string |
| `location` | string | `location` | ✅ Direct mapping |
| `customCity` | string | `location` | Use `customCity` when `location === "other"` |
| `date` | string | `preferredDate` | ✅ Direct mapping (ISO string) |
| `dateTbd` | boolean | - | If true, send `preferredDate: null` |
| `time` | string | ❌ Not stored | Can be added to `specialRequirements` or `notes` |
| `timeTbd` | boolean | - | Ignore |
| `duration` | number | ❌ Not stored | Can be added to `specialRequirements` or `notes` |

### Recommended Frontend Transformation

```typescript
// In frontend form submission handler
const transformToBackendFormat = (formData: WorkshopConfigValues) => {
  return {
    contactName: formData.name,
    email: formData.email,
    phone: null, // Not collected in current form - TODO: Add field?
    organization: formData.type === 'zakelijk' ? formData.companyName : null,
    activityType: formData.workshops.join(', '), // Join multiple workshops
    participants: formData.participantCount,
    preferredDate: formData.dateTbd ? null : formData.date,
    alternativeDate: null, // Not collected in current form - TODO: Add field?
    ageGroup: null, // Not collected in current form - TODO: Add field?
    location: formData.location === 'other' ? formData.customCity : formData.location,
    travelDistance: null, // Could be calculated based on location
    specialRequirements: [
      formData.timeTbd ? null : `Gewenste tijd: ${formData.time}`,
      `Duur: ${formData.duration} uren`,
      formData.type === 'zakelijk' && formData.btwNumber ? `BTW nummer: ${formData.btwNumber}` : null
    ].filter(Boolean).join('; '),
    dietaryRestrictions: null, // Not collected - TODO: Add field?
    accessibilityNeeds: null, // Not collected - TODO: Add field?
  }
}
```

---

## CORS Configuration

### Backend Setup (Already Configured)

The backend accepts requests from the frontend origin. No additional CORS configuration needed if both apps run on localhost during development.

### Frontend API Call Example

```typescript
// In frontend (Next.js API route or client component)
async function submitWorkshopRequest(data: WorkshopFormData) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003'

  const response = await fetch(`${backendUrl}/api/workshops/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transformToBackendFormat(data)),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit request')
  }

  return await response.json()
}
```

---

## Environment Variables

### Frontend `.env.local`

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3003

# Production
# NEXT_PUBLIC_BACKEND_URL=https://admin.goeduitje.nl
```

---

## Testing the Integration

### 1. Manual Testing with cURL

```bash
curl -X POST http://localhost:3003/api/workshops/requests \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "Test User",
    "email": "test@example.com",
    "activityType": "Kookworkshop",
    "participants": 15,
    "preferredDate": "2025-04-01",
    "location": "Utrecht"
  }'
```

### 2. Frontend Integration Test

Create a test page at `/test-workshop-form` in the frontend:

```typescript
'use client'

import { useState } from 'react'

export default function TestWorkshopForm() {
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:3003/api/workshops/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: 'Test User',
          email: 'test@example.com',
          activityType: 'Kookworkshop',
          participants: 15,
          preferredDate: '2025-04-01',
          location: 'Utrecht',
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Failed:', error)
      setResult({ error: error.message })
    }
  }

  return (
    <div className="p-8">
      <h1>Test Workshop Request Submission</h1>
      <button onClick={handleSubmit}>Submit Test Request</button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

### 3. Check Backend Admin Panel

After submitting from frontend:
1. Go to `http://localhost:3003/workshops`
2. Verify new request appears in table
3. Click "Details" to view full request
4. Test status workflow (Info → Quote → Confirm)

---

## Status Workflow (Backend Only)

**Important**: The frontend only creates requests. All status management happens in the backend admin panel.

Status Progression:
1. **leeg** - Initial state (frontend submits here)
2. **informatie verstrekt** - Admin contacted customer
3. **offerte gemaakt** - AI-generated quote sent (automated email + PDF)
4. **bevestigde opdracht** - Workshop confirmed (auto-creates confirmed workshop record)

Frontend does NOT need to handle statuses - requests always start as "leeg".

---

## Error Handling

### Common Errors

| Status Code | Error | Solution |
|---|---|---|
| 400 | Missing required fields | Check request body has all required fields |
| 400 | Invalid email format | Validate email on frontend before submission |
| 500 | Database error | Backend issue - contact admin |
| 500 | Failed to create request | Backend issue - check logs |

### Frontend Error Handling

```typescript
try {
  const result = await submitWorkshopRequest(formData)

  // Success - show confirmation
  toast.success('Aanvraag verzonden! We nemen binnen 24 uur contact op.')
  router.push('/bedankt')

} catch (error) {
  // Error - show user-friendly message
  if (error.message.includes('email')) {
    toast.error('Ongeldig e-mailadres. Controleer je invoer.')
  } else {
    toast.error('Er ging iets mis. Probeer het later opnieuw.')
  }

  // Log for debugging
  console.error('Workshop request failed:', error)
}
```

---

## Security Considerations

1. **Input Validation**: Always validate on frontend before sending
2. **Email Validation**: Use proper email regex or validation library
3. **Rate Limiting**: Backend has rate limiting (max 10 requests/minute per IP)
4. **No Authentication Required**: Public endpoint for customer submissions
5. **SQL Injection Protection**: Backend uses Drizzle ORM with parameterized queries

---

## Future Enhancements

### Missing Frontend Fields (To Add)

The current frontend form is missing these fields that the backend supports:

- [ ] `phone` - Customer phone number field
- [ ] `alternativeDate` - Alternative date picker
- [ ] `ageGroup` - Age group input/select
- [ ] `travelDistance` - Could auto-calculate or ask user
- [ ] `dietaryRestrictions` - Textarea for dietary needs
- [ ] `accessibilityNeeds` - Textarea for accessibility requirements

### Recommended Frontend Updates

1. Add phone number field (optional but recommended)
2. Add dietary restrictions textarea
3. Add accessibility needs checkbox/textarea
4. Consider adding alternative date picker
5. Transform `time` and `duration` into `specialRequirements` text

---

## Contact

**Questions about the API?**
- Check backend CLAUDE.md for full documentation
- Review backend code: `/src/app/api/workshops/requests/route.ts`
- Test with cURL before integrating

**Backend Repository**: `goeduitje-backend` (port 3003)
**Frontend Repository**: `goeduitje-nl-rebuild` (port 3000)
