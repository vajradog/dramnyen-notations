# Dramnyen Notations

A web application for writing and playing Tibetan dramnyen musical notation by Thupten Chakrishar and Dramnyen notes by Tenzin Norbu. For more information on the project visit - [Chakrishar](https://chakrishar.com)
## Features

- Text editor that accepts digits 1-8 (representing Do-Re-Mi-Fa-So-La-Ti-Do)
- Immediate sound playback when a digit is typed
- Group detection based on spacing
- Selection and underlining for faster playback
- Play button to perform the entire composition

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone this repository or download the source code:

```bash
git clone https://github.com/yourusername/dramnyen-notations.git
cd dramnyen-notations
```

2. Install dependencies:

```bash
npm install
```

3. Add your audio files to the `static/audio` directory:
   - `do.wav` - First note (1)
   - `re.wav` - Second note (2)
   - `mi.wav` - Third note (3)
   - `fa.wav` - Fourth note (4)
   - `so.wav` - Fifth note (5)
   - `la.wav` - Sixth note (6)
   - `ti.wav` - Seventh note (7)
   - `do_high.wav` - Eighth note (8)

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## How to Use

### Writing Notation

1. Click in the editor area
2. Type digits 1-8 to input notes (they will play as you type)
3. Use the Enter key to create new lines
4. Space between digits creates separate notes
5. Consecutive digits without spaces are treated as groups (played faster)

### Adding Underlining for Faster Playback

1. Select a portion of text in the editor
2. Click the "Underline" button
3. The selected text will be underlined and will play much faster during playback

### Playing the Notation

1. Click the "Play" button to perform the entire notation
2. Notes will play at different speeds:
   - Single notes: 0.5 seconds per note
   - Grouped notes: 0.3 seconds per note
   - Underlined notes: 0.15 seconds per note

## Deployment

To deploy this application to GitHub Pages:

1. Update the `svelte.config.js` file with your repository name
2. Run the deploy command:

```bash
npm run deploy
```

## Technology Stack

- [SvelteKit](https://kit.svelte.dev/) - Application framework
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio playback
- [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) - Static site generation
- [gh-pages](https://github.com/tschaub/gh-pages) - GitHub Pages deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Project developed by Thupten Chakrishar aka vajradog
- Dramnyen sounds by former TIPA Artist Tenzin Norbu (Tenor)
- Thanks to the Tibetan dramnyen community for inspiration