import { useState, useEffect, useCallback } from 'react';
import { VolumeLevel, getSoundSettings as getLocalSoundSettings, saveSoundSettings as saveLocalSoundSettings } from '../utils/sound';
import type { User } from '@supabase/supabase-js';

const SUPABASE_AVAILABLE = typeof window !== 'undefined' && 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let supabase: any = null;
if (SUPABASE_AVAILABLE) {
  import('@supabase/supabase-js').then(({ createClient }) => {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    );
  });
}

const STORAGE_KEY = 'kaizen_sound_settings';

export interface SyncedSoundSettings {
  enabled: boolean;
  volumeLevel: VolumeLevel;
}

export function useSoundSettings(user: User | null) {
  const isSynced = !!user && supabase;
  const [settings, setSettings] = useState<SyncedSoundSettings>(() => {
    return getLocalSoundSettings();
  });
  const [initialized, setInitialized] = useState(false);

  // Load settings from Supabase or localStorage
  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (isSynced && user && supabase) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('sound_enabled, volume_level')
          .eq('user_id', user.id)
          .single();

        if (cancelled) return;

        if (error) {
          // Settings don't exist yet, fallback to localStorage
          const localSettings = getLocalSoundSettings();
          setSettings(localSettings);

          // Optionally create the settings row
          if (error.code === 'PGRST116') {
            await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                sound_enabled: localSettings.enabled,
                volume_level: localSettings.volumeLevel,
              });
          }
        } else {
          setSettings({
            enabled: data.sound_enabled ?? true,
            volumeLevel: data.volume_level ?? 'medium',
          });
        }
      } else {
        if (cancelled) return;
        const localSettings = getLocalSoundSettings();
        setSettings(localSettings);
      }
      setInitialized(true);
    }

    loadSettings();
    return () => { cancelled = true; };
  }, [isSynced, user?.id]);

  // Persist to localStorage when not synced
  useEffect(() => {
    if (!isSynced && initialized) {
      saveLocalSoundSettings(settings);
    }
  }, [settings, isSynced, initialized]);

  const updateSettings = useCallback((updates: Partial<SyncedSoundSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };

      if (isSynced && user && supabase) {
        supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            sound_enabled: newSettings.enabled,
            volume_level: newSettings.volumeLevel,
          })
          .then(({ error }: { error: any }) => {
            if (error) {
              console.error('Failed to sync sound settings:', error.message);
              // Fallback to localStorage
              saveLocalSoundSettings(newSettings);
            }
          });
      } else {
        saveLocalSoundSettings(newSettings);
      }

      return newSettings;
    });
  }, [isSynced, user?.id]);

  return { settings, updateSettings, initialized };
}
