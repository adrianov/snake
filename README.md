# Snake Game

A modern, feature-rich Snake game implemented in HTML5 Canvas and JavaScript. Control the snake using arrow keys, collect food to grow longer, and try to achieve the highest score possible!

## Features

- Smooth, responsive snake movement
- Beautiful day-to-night transition as the snake grows
- Animated moon phases and star field
- Multiple fruit types with different point values
- Dynamic soundtrack with various melodies
- Sound effects for all game actions
- High score persistence using localStorage
- Modern UI with clean, attractive design
- Auto-collision avoidance system (luck feature)
- Responsive design for all screen sizes

## How to Play

1. Open `index.html` in your web browser
2. Use arrow keys to start the game and control the snake's direction
3. Collect fruits to grow longer and increase your score
4. Avoid hitting the walls or the snake's own body
5. Try to beat your high score!

## Game Mechanics

- The snake speeds up as it eats fruits, making the game progressively more challenging
- The background gradually shifts from day to night as the snake grows
- Each fruit has a different point value: Apple (10), Banana (15), Orange (20), Strawberry (25)
- The "luck" feature gives your snake an 80% chance to auto-avoid collisions
- Press the opposite direction key to temporarily slow down the snake

## Controls

- ↑ Arrow Up: Move up
- ↓ Arrow Down: Move down
- ← Arrow Left: Move left
- → Arrow Right: Move right
- Space: Start game / Pause game
- S: Toggle sound effects
- M: Toggle background music
- L: Toggle luck feature (collision avoidance)
- V: Toggle snake vibration effect

## Tips & Tricks

- When the snake grows, its skin becomes darker
- The moon phase reflects the actual astronomical day, not gameplay time
- You can slow down the snake by pressing the arrow key opposite to current direction
- Each fruit has a different score value - strawberries are worth the most!
- The luck feature helps your snake avoid collisions automatically 80% of the time

## Running Locally

1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. No additional setup required!

## Technical Details

The game is built using:
- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- CSS3 for styling
- Web Audio API for sound generation
- LocalStorage for high score persistence

## License

This project is open source and available under the MIT License.
