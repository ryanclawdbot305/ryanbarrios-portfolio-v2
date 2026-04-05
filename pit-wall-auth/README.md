# Pit Wall — Supabase Auth Setup

## Step 1 — Run the Database Schema

1. Go to **supabase.com** → your project → **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the contents of `pit-wall-supabase-schema.sql`
4. Click **Run**

This creates:
- `profiles` — user profiles
- `laps` — individual lap uploads
- `leaderboard_entries` — best times per track
- `posts` — social feed
- Row-level security policies (users can only edit their own data)

---

## Step 2 — Install Supabase Client

In your pit-wall project directory:

```bash
npm install @supabase/supabase-js
```

---

## Step 3 — Add Files

Copy these files into your `src/` folder:

```
src/supabase.js      ← API helpers + auth
src/AuthModal.jsx    ← Login/Register modal
```

---

## Step 4 — Integrate into Dashboard2.jsx

Add at the top of `Dashboard2.jsx`:

```jsx
import { supabase, onAuthStateChange, getCurrentUser, getProfile, saveLap, getLeaderboard, upsertLeaderboardEntry } from './supabase';
import AuthModal from './AuthModal';
```

Add state near the top of your component:

```jsx
const [user, setUser] = useState(null);
const [profile, setProfile] = useState(null);
const [showAuth, setShowAuth] = useState(false);
const [cloudLaps, setCloudLaps] = useState([]);
```

Add auth listener in `useEffect`:

```jsx
useEffect(() => {
  getCurrentUser().then(u => {
    if (u) {
      setUser(u);
      getProfile(u.id).then(p => setProfile(p.data));
    }
  });

  const { data: { subscription } } = onAuthStateChange((_event, session) => {
    if (session?.user) {
      setUser(session.user);
      getProfile(session.user.id).then(p => setProfile(p.data));
    } else {
      setUser(null);
      setProfile(null);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

Add the auth modal in your render:

```jsx
<AuthModal
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  onUser={async (u) => {
    setUser(u);
    if (u?.id !== 'guest') {
      const { data } = await getProfile(u.id);
      setProfile(data);
    }
  }}
/>
```

---

## Step 5 — Wire Up "Post to Leaderboard"

Replace or augment the existing local leaderboard logic:

```jsx
async function postToLeaderboardCloud(session) {
  if (!user || user.id === 'guest') { alert('Sign in to post to the leaderboard'); return; }
  if (!session.bestLap) return;

  const { data, error } = await upsertLeaderboardEntry({
    user_id: user.id,
    track: session.track,
    layout: 'Full Course',
    best_time: session.bestLap.totalTime,
    top_speed: session.bestLap.maxSpeed,
    car: profile?.car || 'BMW M2',
  });

  if (error) alert('Error posting: ' + error.message);
  else alert('Posted to cloud leaderboard!');
}
```

---

## Step 6 — Cloud Lap Storage

When uploading a .bin file, also save to cloud:

```jsx
async function handleFileUpload(files) {
  // ... existing parsing logic ...

  // Save each parsed lap to cloud
  if (user && user.id !== 'guest') {
    for (const lap of parsedLaps) {
      await saveLap({
        user_id: user.id,
        track: session.track,
        layout: 'Full Course',
        lap_number: lap.lapNum,
        lap_time: lap.totalTime,
        top_speed: lap.maxSpeed,
        avg_speed: lap.avgSpeed,
        max_lat_g: lap.maxLatG,
        max_lon_g: lap.maxLonG,
      });
    }
  }
}
```

---

## Step 7 — Rebuild and Deploy

```bash
npm run build
```

Then drag the new `dist/` folder to **app.netlify.com/drop**.

---

## What's Included

| File | Purpose |
|------|---------|
| `supabase.js` | All API calls: auth, profiles, laps, leaderboard, posts |
| `AuthModal.jsx` | Login/Register modal with email + password |
| `pit-wall-supabase-schema.sql` | Run once in Supabase SQL Editor |

## Next Up After Phase 1

- Profile page with avatar + car info
- Cloud leaderboard tab (fetch from Supabase instead of localStorage)
- Social feed — follow other drivers
- Lap comparison overlay (your lap vs. anyone on the leaderboard)
