# Bodhya — Feature 1: Time & Activity Tracking

## Integration Steps

### 1. Copy the feature files

Copy all files from:

Feature_1_Time_Tracking/

into:

frontend/src/features/time-tracking/

---

### 2. Run the database setup

Open:

SUPABASE.sql

Run the complete SQL script in the Bodhya Supabase project.

This updates the existing `time_logs` table and enables the required policies/indexes.

---

### 3. Add the Time Tracking Provider

Open:

frontend/src/main.jsx

Import:

```jsx
import {
  TimeTrackingProvider,
} from "./features/time-tracking";