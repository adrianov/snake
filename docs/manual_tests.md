# Manual Tests

## Game Mechanics

### Core Gameplay
- Snake should move in the direction of arrow key press
- Snake should grow after eating food
- Score should increase based on fruit type (Apple: 10, Banana: 15, Orange: 20, Strawberry: 25)
- Game over should occur when snake hits wall and not evades it with luck feature
- High score should persist between sessions
- Game should pause/unpause with space key
- Game should restart with space key after game over
- Game should start with space key or any arrow key from initial screen (after interaction)

### Collision Mechanics
- Luck feature should auto-avoid collisions 80% of the time when enabled
- Snake should cut its tail when self-collision occurs 50% of the time
- Score should be reduced proportionally when tail is cut
- Clear visual feedback should occur when luck or tail-cutting activates
- Sound effect should play when tail is cut

### Speed Dynamics
- Snake should speed up gradually as it eats more food
- Pressing opposite direction key should slow down snake
- Speed should increase by current direction and slow in opposite direction
- Speed adjustments should be more gradual on touch devices
- Snake should return to base speed on game restart

### Special Features
- Background should transition from day to night as snake grows
- Snake skin should darken as it grows longer
- Random fruit types should spawn with correct probabilities
- Vibration effect should toggle on/off with V key
- Luck feature should toggle on/off with L key

## Music and sound

### Music Playback
- Start game, music should begin playing
- Pause game, music should fade out
- Unpause game, music should resume
- Game over, music should stop
- Start new game, music should begin again
- Toggle music ON when in menu screen should not start playing music (only preference is changed)
- Toggle music ON when on game over screen should not start playing music (only preference is changed)
- Toggle music OFF and ON during gameplay should stop and restart music
- Game should respect music preference during gameplay (ON = music plays, OFF = no music)

### Device Audio Muting
- When device audio is muted (e.g., iPhone mute switch), music should pause automatically
- When device audio is unmuted, music should resume if it was playing before
- When device audio is muted, music should not start when starting a new game
- When device audio is muted, music should not start when toggling music ON

### Music Controls
- Toggle music button (M key) should stop/start music only during gameplay
- Toggle music button (M key) visual state (♫/♪ icon) should update correctly
- Toggle music button (M key) in menu or game over screen should only change the setting but not play music
- Change music button (N key) should switch to different melody only during gameplay
- Change music button (N key) in menu or game over screen should only change the selected melody but not play it
- Music volume should persist between sessions
- Music should respect browser autoplay policies

### Sound Controls
- Toggle sound button (S key) should enable/disable sound effects
- Toggle sound button (S key) visual state (🔊/🔇 icon) should update correctly

### Browser Compatibility
- Music should work on Chrome, Firefox, Safari
- Music should initialize after first user interaction
- Music should handle tab focus/blur correctly
- Music should work on mobile devices
- Music and sound effects should resume properly after switching to another app and back on iPhone/iPad
- Audio should resume properly when returning to browser after device lock/sleep on mobile

### PWA Mode Audio
- Music should resume properly when returning to PWA from another app
- Music should resume properly when returning to PWA after device lock/sleep
- Music should resume properly when returning to PWA from background state
- Music should maintain the same melody when resuming in PWA mode
- Sound effects should work properly in PWA mode
- Audio should initialize correctly when launching the game in PWA mode
- Music should respect user preferences (ON/OFF) when resuming in PWA mode

### Edge Cases
- Quick game restarts should not cause audio glitches
- Multiple rapid music changes should work smoothly
- Music should handle browser tab switching
- Music should clean up properly on page close

## Touch Controls & Mobile Experience

### Touch Interaction
- Swipe gestures should correctly change snake direction
- Tapping should slow down the snake
- Direction controls should work during active gameplay
- Screen should not scroll during active gameplay
- Pinch zoom should be disabled always
- Normal scrolling should work when not in active gameplay (menus, game over screen)
- Touch controls should respond quickly with no noticeable delay
- On-screen arrow buttons should function correctly
- The play area should be centered with proper margins on small screens

### Mobile-Specific Features
- Page should not bounce or scroll during gameplay on iOS/Safari
- Mobile controls should appear only on touch devices
- Game should handle device rotation gracefully
- Interface should be fully usable on small mobile screens
- Game should handle mobile browser tab switching correctly
- Header and footer should properly hide during gameplay and show after

## PWA Features

### Installation & Launch
- Game should be installable as a PWA on supported devices
- Game should display proper app icon when installed

### PWA Audio Behavior
- Music should automatically pause when switching away from the PWA
- Music should automatically resume when returning to the PWA
- Music should maintain the same melody when returning to the PWA
- Music should maintain state after device lock/sleep and wake
- Music should resume properly when returning from background state after short period
- Music should resume properly when returning from background state after long period (>10 minutes)
- Music should respect user preferences (enabled/disabled) when resuming
- Multiple app switches in quick succession should not break audio playback
- Sound effects should work properly after app switching in PWA mode
- Audio should be completely recreated when returning to the app after switching
- Context should be closed and recreated on first user interaction after app switch
