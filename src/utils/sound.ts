export type VolumeLevel = 'low' | 'medium' | 'high';

export interface SoundSettings {
  enabled: boolean;
  volumeLevel: VolumeLevel;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volumeLevel: 'medium',
};

const VOLUME_MAP: Record<VolumeLevel, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
};

let alarmAudio: HTMLAudioElement | null = null;
let testAudio: HTMLAudioElement | null = null;
let isInitialized = false;

export function getSoundSettings(): SoundSettings {
  try {
    const stored = localStorage.getItem('kaizen_sound_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load sound settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSoundSettings(settings: SoundSettings): void {
  try {
    localStorage.setItem('kaizen_sound_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save sound settings:', e);
  }
}

export function initializeSounds(): void {
  if (isInitialized) return;

  alarmAudio = new Audio('/assets/sounds/alarm.mp3');
  alarmAudio.load();

  isInitialized = true;
}

export function playAlarmSound(): void {
  const settings = getSoundSettings();
  if (!settings.enabled) return;

  if (!isInitialized) initializeSounds();

  if (alarmAudio) {
    alarmAudio.volume = VOLUME_MAP[settings.volumeLevel];
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch((err) => {
      console.warn('Alarm sound blocked by browser autoplay policy:', err.message);
    });
  }
}

export function playTestSound(settings?: SoundSettings): void {
  const currentSettings = settings || getSoundSettings();
  if (!currentSettings.enabled) return;

  if (!isInitialized) initializeSounds();

  // Stop any currently playing test sound before starting a new one
  if (testAudio) {
    testAudio.pause();
    testAudio.currentTime = 0;
  }

  testAudio = new Audio('/assets/sounds/alarm.mp3');
  testAudio.volume = VOLUME_MAP[currentSettings.volumeLevel];
  testAudio.play().catch((err) => {
    console.warn('Test sound blocked by browser autoplay policy:', err.message);
  });
}
