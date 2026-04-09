<div align="center">
  <h1>🌸 Kaizen</h1>
  <p><em>A Minimalist To-Do System</em></p>
  <p>Continuous improvement, one task at a time.</p>
</div>

---

## Screenshots

<div align="center">
  <img src="assets/images/1.png" alt="Splash Screen" width="800" />

  <img src="assets/images/2.png" alt="Main App" width="800" />

  <img src="assets/images/3.png" alt="Task Creation" width="800" />

  <img src="assets/images/4.png" alt="Pomodoro Timer" width="800" />

</div>

---

## Overview

Kaizen is an intelligent to-do list application designed to automate daily planning using productivity heuristics. Inspired by the philosophy of continuous improvement (*改善*), Kaizen reduces decision fatigue by automatically scheduling tasks based on priority, deadlines, and adaptive repetition rules. With account-based syncing, sound feedback, and integrated Pomodoro sessions, Kaizen transforms a basic to-do list into a focused productivity engine.

## Features

### 🧠 Smart Scheduling

The system automatically organizes your tasks so you don't have to:

| Priority | Schedule Rule |
|----------|--------------|
| **High** | Always scheduled for TODAY |
| **Medium** | Every 2 days |
| **Low** | Every 3 days |
| **Overdue** | Forced back to TODAY |

### ⚠️ Deadline Constraint Detection

When a task's deadline is too close to follow its normal cycle, the system:
1. Detects the infeasible scheduling window
2. Forces the task into TODAY
3. Notifies you with a clear warning

> *"This task must be done today as it cannot be further scheduled."*

### 📅 Enhanced Overdue Visibility

Tasks that can no longer be scheduled or have passed their deadline display detailed overdue indicators:

| State | Display |
|-------|---------|
| **Overdue** | `OVERDUE by X days` (red) |
| **Constraint-triggered** | `MUST DO TODAY` (red) |
| **High priority — due soon** | `Due soon (Overdue in X days)` (orange) — when deadline is within 3 days |
| **Normal** | `TODAY` or `In X days` |

All overdue tasks are automatically highlighted with a red border and alert icon for immediate visibility.

### ⏱️ Integrated Pomodoro Loop (25/5)

Click **DO** on any task to start a fully automated Pomodoro session:

* **25-minute Focus Session** → automatically transitions to **5-minute Break**
* Loops continuously until you manually **STOP**
* Progress prompt only appears when you stop (not during auto-transitions)
* Visual indicators: red for focus, green for break
* Live progress bar shows session completion
* **Browser tab title** updates in real-time (e.g., `25:00 - Focus | Kaizen` or `05:00 - Break | Kaizen`)

#### Timer Controls
* **Play/Pause** — pause and resume the current session
* **Stop** — end the loop and log progress
* **Mark as Done** — complete the task at 100%
* **Progress Slider** — adjust completion (0–100%) with quick presets (25%, 50%, 75%, 100%)

### 🔊 Sound & Feedback System

Subtle audio cues reinforce session transitions without breaking focus:

* **Focus End** — alarm sound plays when the 25-minute session ends
* **Break End** — same alarm sound plays when the 5-minute break ends
* Sounds play once per transition (no looping or repeated ringing)

#### Sound Settings
Access via the ⚙️ gear icon in the header:

| Control | Options |
|---------|---------|
| **Enable/Disable** | Toggle all sounds ON or OFF |
| **Volume** | Low / Medium / High |
| **Preview** | Automatically plays when enabling or adjusting volume so you can hear the loudness |

The sound system handles rapid clicks gracefully — only the last clicked volume button plays, stopping any previously playing test sounds.

#### Sound File Setup

Place a single `alarm.mp3` file in:
```
assets/sounds/alarm.mp3
```

The same sound is used for both focus-end and break-end transitions.

### 👤 Account Sync with Cloud Settings

| Mode | Storage | Cross-Device Sync |
|------|---------|-------------------|
| **Guest** | LocalStorage | ❌ |
| **Authenticated** | Supabase Cloud | ✅ |

Sign up anytime to sync your **tasks** and **sound preferences** across devices. Guest sessions can be upgraded — local data is uploaded automatically.

Sound settings (`sound_enabled`, `volume_level`) are stored per-user in Supabase and persist across sessions and devices.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion (`motion/react`) |
| **Database & Auth** | Supabase |
| **Date Handling** | date-fns |
| **Icons** | Lucide React |

## Run Locally

**Prerequisites:** Node.js

1. Clone the repository:
   ```bash
   git clone https://github.com/rEifun30/Kaizen-Minimalist-To-Do-List-System.git
   cd Kaizen-Minimalist-To-Do-List-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
   ```

4. Set up the database in your Supabase SQL Editor:

   **Tasks Table**
   ```sql
   CREATE TABLE tasks (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     title TEXT NOT NULL,
     priority TEXT NOT NULL,
     deadline TEXT,
     created_at TEXT NOT NULL,
     next_schedule_date TEXT NOT NULL,
     progress INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'active',
     last_completed_at TEXT,
     constraint_flag BOOLEAN DEFAULT false,
     constraint_reason TEXT
   );

   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can only access their own tasks"
     ON tasks FOR ALL
     USING (auth.uid() = user_id);
   ```

   **User Settings Table** (for synced sound preferences)
   ```sql
   CREATE TABLE user_settings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
     sound_enabled BOOLEAN DEFAULT true,
     volume_level TEXT DEFAULT 'medium' CHECK (volume_level IN ('low', 'medium', 'high')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own settings"
     ON user_settings FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own settings"
     ON user_settings FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own settings"
     ON user_settings FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own settings"
     ON user_settings FOR DELETE
     USING (auth.uid() = user_id);
   ```

5. Place your alarm sound file:
   ```
   assets/sounds/alarm.mp3
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx         # Login/signup with animated transitions
│   ├── PomodoroTimer.tsx    # Focus/break timer with auto-loop & sound toggle
│   ├── SoundSettings.tsx    # Sound preferences panel (enable/disable, volume)
│   ├── SplashScreen.tsx     # Animated splash with sakura bloom
│   ├── TaskForm.tsx         # Guided task creation flow
│   └── TaskItem.tsx         # Task card with overdue indicators & urgency warnings
├── hooks/
│   ├── useAuth.ts           # Supabase auth state management
│   ├── usePomodoro.ts       # 25/5 auto-loop Pomodoro logic + document title
│   ├── useSoundSettings.ts  # Cloud/local sound settings sync
│   └── useTasks.ts          # Task CRUD with cloud/local sync
├── lib/
│   ├── taskUtils.ts         # Scheduling, constraint & overdue logic
│   └── utils.ts             # General utility functions
├── utils/
│   ├── sound.ts             # Audio playback, settings persistence, test sound
│   └── supabase.ts          # Supabase browser client
├── types.ts                 # TypeScript type definitions
├── App.tsx                  # Main app with auth guard & sound settings panel
├── index.css                # Tailwind + global styles
└── main.tsx                 # Entry point
```

## Data Model

### User (Supabase Auth)
| Field | Type |
|-------|------|
| id | UUID |
| email | String |
| created_at | Timestamp |

### Task
| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| user_id | UUID | Owner (Supabase auth.users) |
| title | String | Task name |
| priority | Enum | high / medium / low |
| deadline | String | Optional ISO date |
| created_at | String | Creation timestamp |
| next_schedule_date | String | Next appearance date |
| progress | Number | 0–100 |
| status | Enum | active / completed |
| last_completed_at | String | Last completion time |
| constraint_flag | Boolean | Deadline constraint active |
| constraint_reason | String | Constraint notification message |

### User Settings (Synced Sound Preferences)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | Owner (Supabase auth.users) |
| sound_enabled | Boolean | Sound feedback enabled/disabled |
| volume_level | Enum | low / medium / high |

## License

MIT
