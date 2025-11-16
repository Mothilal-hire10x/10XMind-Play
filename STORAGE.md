# Storage System Documentation

## Overview

10XMindPlay uses Spark's persistent key-value (KV) store for all data persistence. This ensures that student accounts, game results, and all other data persist indefinitely across sessions, page refreshes, and app restarts.

## How Data is Stored

### Primary Storage Keys

1. **`users`** - Stores all user accounts (students and admin)
   - Type: Object (Record)
   - Structure: `{ [userId]: { password: string, user: User } }`
   - Contains: Email, role, creation date for each user
   - Persistence: Permanent

2. **`game-results`** - Stores all game session results
   - Type: Array
   - Structure: `GameResult[]`
   - Contains: User ID, game ID, scores, accuracy, reaction times, timestamps
   - Persistence: Permanent

3. **`currentUserId`** - Stores the currently logged-in user
   - Type: String (nullable)
   - Structure: `string | null`
   - Contains: User ID of logged-in user
   - Persistence: Permanent (maintains login across sessions)

## Storage Implementation

### Using useKV Hook (Recommended)

The `useKV` hook from `@github/spark/hooks` is used for reactive state management with persistence:

```typescript
import { useKV } from '@github/spark/hooks'

// Reading and writing data
const [users, setUsers] = useKV<Record<string, UserData>>('users', {})

// Always use functional updates to avoid stale closure issues
setUsers(current => ({
  ...(current || {}),
  [userId]: newUserData
}))
```

### Direct API Usage

For non-React contexts, use the Spark KV API directly:

```typescript
// Get data
const users = await window.spark.kv.get('users')

// Set data
await window.spark.kv.set('users', updatedUsers)

// Delete data
await window.spark.kv.delete('key')

// List all keys
const keys = await window.spark.kv.keys()
```

## Data Persistence Guarantees

✅ **Long-term storage** - Data persists indefinitely
✅ **Session independent** - Survives page refreshes
✅ **Browser independent** - Not tied to browser storage (localStorage/sessionStorage)
✅ **App-scoped** - Data is tied to your Spark app instance
✅ **Automatic backups** - Admin can export full data backups

## Common Issues and Solutions

### Issue: Student data disappearing

**Root Cause**: Improper use of state updates causing race conditions

**Solution**: Always use functional updates with `setUsers`:

```typescript
// ❌ WRONG - Can lose data due to stale closure
setUsers({
  ...users,
  [newUserId]: newUser
})

// ✅ CORRECT - Always gets current state
setUsers(current => ({
  ...(current || {}),
  [newUserId]: newUser
}))
```

### Issue: Data not showing immediately

**Root Cause**: React state not synced with KV store

**Solution**: The `useKV` hook automatically syncs state. Ensure you're not mixing direct API calls with useKV in the same component.

## Admin Storage Diagnostics

Administrators can monitor storage health via the **Storage** tab in the admin dashboard:

### Features:
- View all storage keys and their sizes
- See item counts for each storage key
- Monitor total students and game results
- Export complete data backup as JSON
- Verify data persistence

### How to Access:
1. Log in as admin (admin@10xscale.ai / Jack@123)
2. Navigate to "Storage" tab
3. Click "Check Storage" to load diagnostics
4. Click "Backup All Data" to download complete backup

## Data Backup and Export

### For Admins

1. **Complete Backup**
   - Click "Backup All Data" in Storage tab
   - Downloads: `10xmindplay-backup-YYYY-MM-DD.json`
   - Contains: All users, game results, and settings

2. **Student Reports**
   - Export → Student Summary (CSV)
   - Contains: Individual student performance metrics

3. **Game Reports**
   - Export → Game Summary (CSV)
   - Contains: Game-specific statistics

4. **Detailed Reports**
   - Export → Detailed Report (CSV or PDF)
   - Contains: Complete session-by-session data

## Best Practices

1. **Always use functional updates** when modifying KV-backed state
2. **Don't mix direct API with useKV** in the same component
3. **Regularly export backups** via the admin dashboard
4. **Monitor storage diagnostics** to verify data persistence
5. **Use type safety** with TypeScript interfaces for all stored data

## Troubleshooting

### Check if data is persisting:
1. Add a student account
2. Complete a game session
3. Refresh the page
4. Log in as admin
5. Check Storage tab - students and results should show

### Verify storage health:
1. Admin dashboard → Storage tab
2. Click "Check Storage"
3. Verify `users` and `game-results` keys exist
4. Check item counts match expected values

### Emergency data recovery:
1. If you've exported a backup, you can manually restore data
2. The backup JSON contains all KV store data
3. Contact Spark support for data recovery assistance

## Technical Details

### Storage Limits
- Spark KV store has generous storage limits
- Typical usage: ~50KB per 100 students
- Game results: ~2KB per session
- No explicit limits on number of entries

### Data Structure Examples

**User Object:**
```json
{
  "id": "user_1234567890_abc123",
  "email": "student@example.com",
  "role": "student",
  "createdAt": 1704067200000
}
```

**Game Result Object:**
```json
{
  "id": "result_1234567890_xyz789",
  "userId": "user_1234567890_abc123",
  "gameId": "stroop",
  "score": 850,
  "accuracy": 95.5,
  "reactionTime": 543,
  "timestamp": 1704067800000,
  "details": {
    "trials": [...]
  }
}
```

## Support

If you experience persistent storage issues:
1. Check browser console for errors
2. Verify you're using the latest version
3. Export a backup before troubleshooting
4. Check the Storage tab diagnostics
5. Contact Spark support with storage diagnostic details
