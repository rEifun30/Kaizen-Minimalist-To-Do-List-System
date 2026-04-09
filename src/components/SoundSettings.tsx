import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { VolumeLevel, playTestSound } from '../utils/sound';
import { cn } from '../lib/utils';
import { SyncedSoundSettings } from '../hooks/useSoundSettings';

interface SoundSettingsProps {
  settings: SyncedSoundSettings;
  onUpdateSettings: (updates: Partial<SyncedSoundSettings>) => void;
  onClose?: () => void;
}

export function SoundSettings({ settings, onUpdateSettings, onClose }: SoundSettingsProps) {
  const toggleEnabled = () => {
    const newEnabled = !settings.enabled;
    onUpdateSettings({ enabled: newEnabled });

    // Play test sound when enabling
    if (newEnabled) {
      playTestSound({ ...settings, enabled: true });
    }
  };

  const setVolume = (volume: VolumeLevel) => {
    onUpdateSettings({ volumeLevel: volume });

    // Play test sound with the new volume (pass settings directly to avoid stale localStorage read)
    playTestSound({ ...settings, volumeLevel: volume });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Sound Settings</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-sm"
          >
            Close
          </button>
        )}
      </div>

      {/* Toggle Sound */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.enabled ? <Volume2 size={18} className="text-white/70" /> : <VolumeX size={18} className="text-white/40" />}
          <span className="text-white/70 text-sm">Enable Sounds</span>
        </div>
        <button
          onClick={toggleEnabled}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-200",
            settings.enabled ? "bg-red-500" : "bg-white/20"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200",
              settings.enabled ? "translate-x-6" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Volume Level */}
      <div className="space-y-3">
        <span className="text-white/50 text-sm">Volume</span>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as VolumeLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setVolume(level)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm capitalize transition-colors",
                settings.volumeLevel === level
                  ? "bg-red-500/20 border-red-500/50 text-red-500"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
