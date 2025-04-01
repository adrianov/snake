# Snake Game TODO List

## Mobile Experience

### Sound Management on Mobile
- [ ] Implement a "silent mode" detection feature that checks device settings
- [ ] Add visual indicator when game is in silent mode on mobile - use existing sound off and music off switch that could not turned on unless user switches sound on on mobile

### Use Case: Sound Turned Off on Mobile
Players often play mobile games in public settings (commute, waiting rooms, workplace) where audio would be disruptive. Currently, when a mobile user has their device on silent/vibrate:
- They may not realize sound is disabled system-wide
- They might toggle the in-game sound button but hear nothing
- There's no visual feedback that the system is overriding the game's sound settings

#### Solution Requirements:
1. Detect when system audio is disabled/muted on mobile
2. Display a small, non-intrusive indicator showing sound is unavailable
3. Update sound toggle UI to reflect that system settings are overriding game settings
5. Save user preferences separately from system state for a consistent experience
