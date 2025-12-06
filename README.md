<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 04 06" src="https://github.com/user-attachments/assets/b65b5581-d4bf-42d1-b854-f1ffe159b6c2" />
<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 04 49" src="https://github.com/user-attachments/assets/db965664-869c-4d9e-8b3b-fc16ba15dfe4" />
<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 05 49" src="https://github.com/user-attachments/assets/92564327-fc09-4ae1-b7aa-e57adb1c2524" />

gameplay demo: https://youtu.be/UewQcdBEVyg
# recycle quest
Created for Princeton VIS 216 -- Graphic Design: Visual Form 


## About

Recycle Question is an interactive, educational sorting game that teaches children aged 5--8 how to correctly sort common household plastic items based on recycling codes and local recycling rules. Learn about different plastic types, contamination, and proper recycling practices while having fun! The game features:

- **Location-based recycling rules** - Enter your location to learn recycling rules specific to your area
- **Progressive difficulty** - Start with simple items and unlock more complex plastics as you level up
- **Educational content** - Learn about plastic codes (#1-7) and which bins they belong in
- **Sound effects and music** - Immersive audio experience

## Gameplay

### Objective

Sort falling plastic items into the correct recycling bins before they hit the ground. Items fall faster as you progress through levels, and incorrect sorting can contaminate bins or fill up your trash pile.

### The Three Bins
Three bins are labeled using a color-coded system to distinguish between the recyclability of plastics. 

- **Green Bin** - Widely recyclable (curbside pickup)
  - Plastic codes #1 (PET) and #2 (HDPE)
  - Examples: Water bottles, milk jugs, detergent bottles, soda bottles

- **Orange Bin** - Special dropoff needed
  - Plastic codes #4 (LDPE) and #5 (PP)
  - Examples: Plastic bags, yogurt cups, takeout containers

- **Red Bin** - Not recyclable curbside
  - Plastic codes #3 (PVC), #6 (PS), #7 (Other/Mixed)
  - Examples: Styrofoam cups, PVC pipes, mixed plastics

### Game Mechanics

- **Levels**: Progress through levels, unlocking new plastic items at each level
- **Trash Pile**: Incorrectly sorted items add to your trash pile. If it reaches 100%, you lose the game!
- **Contamination**: Wrong items in bins cause contamination. Clean contaminated bins by winning the decontamination minigame
- **Hints**: Toggle educational hints on/off to see which bin each item belongs in
- **Score**: Earn points for correctly sorting items

## Controls

### Main Game
- **← → Arrow Keys** - Move falling item left/right
- **↓ Arrow Key** - Move item down faster
- **Shift** - Hold to move item 3x faster
- **Enter** - Instantly drop item into bin directly below
- **Space** - Pause/Unpause game
- **X** - Toggle hints on/off
- **H** - Toggle sound effects and hand visibility
- **R** - Restart game (when game over)
- **L** - Toggle leaderboard
- **Click Help Button** - Open help panel with controls and plastic codes info

### Decontamination Minigame
- **← → Arrow Keys** - Move bin left/right to catch correct items
- **T** - Toggle decontamination tutorial

### Tutorial
- **→ Arrow Key** or **Enter** - Advance to next step
- **← Arrow Key** - Go back to previous step
- **Escape** - Skip tutorial

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required for web version

### Installation

1. Clone or download this repository
2. Open `home.html` in your web browser
3. Enter your location and click "PLAY"

### Running Locally

Simply open `home.html` in your web browser. The game runs entirely client-side with no server required.

### Electron Version (Optional)

If you want to run as a desktop app:

```bash
npm install
npm start
```

## Project Structure

```
recycle-princeton/
├── home.html          # Home page with location input
├── index.html         # Main game page
├── info.html          # Educational information page
├── game.js            # Main game logic and mechanics
├── main.js            # Electron main process (if using Electron)
├── style.css          # Game styling
├── images/            # Game assets
│   ├── *.png          # Item and bin images
│   ├── *.mp3          # Sound effects and music
│   └── README.md      # Image assets documentation
└── package.json       # Node.js dependencies (for Electron)
```

## License

MIT License - feel free to use and modify for educational purposes.

## Credits

Created as an educational tool to promote proper recycling practices and environmental awareness.

---

**Remember**: Always check your local recycling guidelines! This game is for educational purposes only.

