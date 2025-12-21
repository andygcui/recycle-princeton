# recycle quest
created for Princeton VIS 216 -- Graphic Design: Visual Form 

gameplay demo: https://youtu.be/UewQcdBEVyg

<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 04 06" src="https://github.com/user-attachments/assets/b65b5581-d4bf-42d1-b854-f1ffe159b6c2" />
<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 04 49" src="https://github.com/user-attachments/assets/db965664-869c-4d9e-8b3b-fc16ba15dfe4" />
<img width="200" height="300" alt="Screenshot 2025-12-06 at 02 05 49" src="https://github.com/user-attachments/assets/92564327-fc09-4ae1-b7aa-e57adb1c2524" />

## about

recycle quest is an interactive, educational sorting game that teaches children aged 5--8 how to correctly sort common household plastic items based on recycling codes and local recycling rules. 

learn about different plastic types, contamination, and proper recycling practices while having fun! the game features:

- **location-based recycling rules** - enter your location to learn recycling rules specific to your area
- **progressive difficulty** - start with simple items and unlock more complex plastics as you level up
- **educational content** - learn about plastic codes (#1-7) and which bins they belong in
- **sound effects and music** - immersive audio experience

## gameplay

### objective

sort falling plastic items into the correct recycling bins before they hit the ground; items fall faster as you progress through levels, and incorrect sorting can contaminate bins or fill up your trash pile.

### three bin system
recycling bins are redesigned - 3 bins are labeled using a color-coded system to distinguish between the recyclability of their respective plastics. 

- **green bin** - widely recyclable (curbside pickup)
  - plastic codes #1 (PET) and #2 (HDPE)
  - examples: water bottles, milk jugs, detergent bottles, soda bottles

- **orange bin** - special dropoff needed
  - plastic codes #4 (LDPE) and #5 (PP)
  - examples: plastic bags, yogurt cups, takeout containers

- **red bin** - not recyclable curbside
  - plastic codes #3 (PVC), #6 (PS), #7 (Other/Mixed)
  - examples: Styrofoam cups, PVC pipes, mixed plastics

### game mechanics

- **levels**: progress through levels, unlocking new plastic items at each level
- **trash pile**: missed or incorrectly sorted items add to your trash pile; if it reaches 100%, you lose the game!
- **contamination**: wrong items in bins cause contamination; clean bins by completing the decontamination minigame
- **hints**: toggle educational hints on/off to see which bin each item belongs in
- **score**: earn points for correctly sorting items

## controls

### main game
- **← →** move falling item left/right
- **↓** move item down faster
- **shift**: hold to move item 3x faster
- **enter**: instantly drop item into bin directly below
- **space**: pause/Unpause game
- **X**: toggle hints on/off
- **H**: toggle sound effects and hand visibility
- **R**: restart game (when game over)
- **L**: toggle leaderboard
- **help button**: open help panel with controls and plastic codes info

### decontamination minigame
- **← →** - move bin left/right to catch correct items
- **T**: toggle decontamination tutorial

### installation

1. clone or download this repository
2. open `home.html` in your web browser
3. enter your location and click "PLAY"

### running Locally

open `home.html` in your web browser; the game runs entirely client-side with no server required

### electron version

if you want to run as a desktop app:

```bash
npm install
npm start
```

## project structure

```
recycle-princeton/
├── home.html          # home page with location input
├── index.html         # main game page
├── info.html          # educational information page
├── game.js            # main game logic and mechanics
├── main.js            # electron main process (if using Electron)
├── style.css          # game styling
├── images/            # game assets
│   ├── *.png          # item and bin images
│   ├── *.mp3          # sound effects and music
│   └── README.md      # image assets documentation
└── package.json       # node.js dependencies (for Electron)
```

## license

MIT License 

