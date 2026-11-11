# Bodhya — Feature 2: Lock System

## Integration Steps

### 1. Copy the feature

Copy the contents of this folder:

lock system/

into:

frontend/src/features/lock-system/

---

### 2. Run the database setup

Open:

SUPABASE.sql

Run the complete SQL script in the Bodhya Supabase project.

---

### 3. Add the providers

Feature 2 uses Feature 1 (Time Tracking) for active usage calculation.

In:

frontend/src/main.jsx

Import:

import {
  TimeTrackingProvider,
} from "./features/time-tracking";

import {
  ParentalLockProvider,
} from "./features/lock-system";

Wrap the application in this order:

<AuthProvider>
  <AgeProvider>
    <TimeTrackingProvider>
      <ParentalLockProvider>
        <App />
      </ParentalLockProvider>
    </TimeTrackingProvider>
  </AgeProvider>
</AuthProvider>

---

### 4. Add the Lock System page

Import:

import {
  ParentalLockPanel,
} from "./features/lock-system";

Add the panel to the appropriate Bodhya route.

Example:

<Route
  path="/lock-system"
  element={<ParentalLockPanel />}
/>

---

### 5. Configure feature restrictions

Open:

lockConfig.js

Update the feature identifiers in:

RESTRICTABLE_FEATURES

so they match the actual Bodhya feature routes/identifiers.

---

### 6. Apply feature restrictions

For any feature that should be restricted, use:

<RestrictionGuard feature="ai_tutor">
  <YourFeature />
</RestrictionGuard>

Import:

import {
  RestrictionGuard,
} from "./features/lock-system";

---

### 7. Verify dependencies

The Lock System uses Bodhya's existing:

src/context/AuthContext.jsx

src/lib/supabaseClient.js

It also depends on:

src/features/time-tracking/

---

### 8. Test

Verify:

- No daily limit option
- Daily usage limit option
- Limit selection
- Parent PIN creation
- Active-time based limit
- Automatic lock when limit is reached
- Parent PIN unlock
- Temporary unlock
- Manual Lock Now
- Feature restrictions
- Emergency contacts
- Supabase synchronization
- RLS permissions

---

## Integration Complete