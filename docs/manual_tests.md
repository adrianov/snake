# Manual Tests

## Game Mechanics

### Core Gameplay
- Snake moves with arrow keys, grows after eating food
- Score increases based on fruit type (Apple: 10, Banana: 15, Orange: 20, Strawberry: 25)
- Game over occurs when snake hits wall without luck feature
- High score persists between sessions
- Space key: pause/unpause during gameplay, restart after game over
- Game starts with space key or any arrow key from initial screen (after interaction)

### Collision Mechanics
- L key toggles luck feature (auto-avoids collisions 80% of the time when enabled)
- Snake cuts tail on self-collision 50% of time with score reduction
- Visual feedback and sound effect play when luck or tail-cutting activates

### Speed Dynamics
- Snake speeds up as it eats more food
- Pressing opposite direction arrow key slows down snake
- Speed increases in current direction and slows in opposite direction
- Speed adjustments more gradual on touch devices
- Snake returns to base speed on game restart

### Special Features
- Background transitions day to night as snake grows
- Snake skin darkens with length
- Random fruit types spawn with correct probabilities
- V key toggles vibration effect

## Music and Sound

### Music Controls
- Music plays during gameplay, pauses when game paused, stops on game over
- M key toggles music ON/OFF (♫/♪ icon updates correctly)
- N key changes melody
- Music preferences and volume persist between sessions
- Audio initializes after first user interaction

### Sound Controls
- S key toggles sound effects ON/OFF (🔊/🔇 icon updates correctly)
- Audio handles tab focus/blur, device switching, and sleep/wake correctly
- Music handles browser tab switching and cleanup on page close
- Multiple rapid music changes work smoothly

## Touch Controls & Mobile
- Swipe gestures change direction, tapping slows snake
- Touch controls respond quickly with no delay
- On-screen arrow buttons function correctly on touch devices
- Screen doesn't scroll during gameplay, pinch zoom disabled
- Interface usable on small screens with proper margins
- Header/footer hide during gameplay, show after

## PWA Features
- Game installable as PWA with proper app icon
- Music pauses when switching away, resumes when returning
- Audio recreated on first user interaction after app switch
- Sound effects work properly after app switching
