# Manual Tests

## Game Mechanics

### Core Gameplay
- Snake should move in the direction of arrow key press
- Snake should grow after eating food
- Score should increase based on fruit type (Apple: 10, Banana: 15, Orange: 20, Strawberry: 25)
- Game over should occur when snake hits wall and not evades it with luck feature
- High score should persist between sessions
- Game should pause/unpause with space key

### Collision Mechanics
- Luck feature should auto-avoid collisions 80% of the time when enabled
- Snake should cut its tail when self-collision occurs 50% of the time
- Score should be reduced proportionally when tail is cut
- Clear visual feedback should occur when luck or tail-cutting activates
- Sound effect should play when tail is cut

### Speed Dynamics
- Snake should speed up gradually as it eats more food
- Pressing opposite direction key should temporarily slow down snake
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

### Music Controls
- Toggle music button should stop/start music
- Change music button should switch to different melody
- Music volume should persist between sessions
- Music should respect browser autoplay policies

### Browser Compatibility
- Music should work on Chrome, Firefox, Safari
- Music should initialize after first user interaction
- Music should handle tab focus/blur correctly
- Music should work on mobile devices

### Edge Cases
- Quick game restarts should not cause audio glitches
- Multiple rapid music changes should work smoothly
- Music should handle browser tab switching
- Music should clean up properly on page close 