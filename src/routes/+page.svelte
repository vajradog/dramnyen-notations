<script>
    import NotationEditor from '$lib/components/NotationEditor.svelte';
    import PlaybackControls from '$lib/components/PlaybackControls.svelte';
    import PlaybackSettings from '$lib/components/PlaybackSettings.svelte';
    import ExportTools from '$lib/components/ExportTools.svelte';
    import { onMount } from 'svelte';
    
    let notation = '';
    let notationHtml = '';
    let audioContext;
    let audioBuffers = {};
    let isPlaying = false;
    let hasSelection = false;
    let selectedText = '';
    let stopPlaybackFunction = null;
    
    // Playback speed settings with default values
    let singleNoteDelay = 300;
    let groupedNoteDelay = 500;
    let underlinedNoteDelay = 170;
    let spaceDelay = 200; // Delay for each space character
    
    // Function to handle notation changes from the editor
    function handleNotationChange(event) {
      notation = event.detail.text;
      notationHtml = event.detail.html || '';
    }
    
    // Handle selection changes
    function handleSelectionChange(event) {
      hasSelection = event.detail.hasSelection;
      selectedText = event.detail.selectedText;
    }
    
    // Stop playback
    function stopPlayback() {
      if (stopPlaybackFunction) {
        stopPlaybackFunction();
        stopPlaybackFunction = null;
      }
      isPlaying = false;
    }
    
    // Function to play notation
    async function playNotation() {
      if (isPlaying) return;
      isPlaying = true;
      
      try {
        let textToPlay = hasSelection ? selectedText : notation;
        let htmlToPlay = hasSelection ? null : notationHtml;
        
        // Use both text and HTML for parsing to detect underlines
        const notesArray = parseNotation(textToPlay, htmlToPlay);
        stopPlaybackFunction = await playParsedNotation(notesArray);
      } catch (error) {
        console.error('Error during playback:', error);
        isPlaying = false;
      }
    }
    
    // Parse the notation text into a structured format with HTML
    function parseNotation(text, html = null) {
      const lines = text.split('\n');
      const result = [];
      
      // Use DOM parsing if HTML is provided, to detect underlined sections
      const underlinedPositions = [];
      if (html) {
        // Create a document fragment to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find all text inside underlined elements
        function findUnderlinedText(element, isUnderlined = false) {
          // Check if this element is underlined
          if (element.classList && element.classList.contains('underlined')) {
            isUnderlined = true;
          }
          
          // If it's a text node and is underlined, mark all positions
          if (element.nodeType === Node.TEXT_NODE && isUnderlined) {
            const textContent = element.textContent;
            const allMatches = [...text.matchAll(new RegExp(textContent, 'g'))];
            
            for (const match of allMatches) {
              const startPos = match.index;
              for (let i = 0; i < textContent.length; i++) {
                underlinedPositions.push(startPos + i);
              }
            }
          }
          
          // Process all child nodes
          if (element.childNodes) {
            for (const child of element.childNodes) {
              findUnderlinedText(child, isUnderlined);
            }
          }
        }
        
        // Start the recursive search from the editor element
        const editorElement = doc.querySelector('.notation-editor');
        if (editorElement) {
          findUnderlinedText(editorElement);
        } else {
          // Fallback to body if editor element not found
          findUnderlinedText(doc.body);
        }
      }
      
      // Parse the text and apply underlining
      for (const line of lines) {
        const lineNotes = [];
        let globalPosition = text.indexOf(line);
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const currentPosition = globalPosition + i;
          
          if (/[1-8]/.test(char)) {
            // Found a digit (note)
            const note = {
              digit: parseInt(char),
              isGrouped: false,
              isUnderlined: underlinedPositions.includes(currentPosition)
            };
            
            // Check if this note is part of a group
            let j = i + 1;
            let isInGroup = false;
            
            while (j < line.length && /[1-8]/.test(line[j]) && !line[j-1].match(/\s/)) {
              isInGroup = true;
              j++;
            }
            
            if (isInGroup) {
              note.isGrouped = true;
            }
            
            lineNotes.push(note);
          } else if (char === ' ') {
            // Count consecutive spaces
            let spaceCount = 1;
            let j = i + 1;
            
            while (j < line.length && line[j] === ' ') {
              spaceCount++;
              j++;
            }
            
            // Add a gap marker (represented by null digit)
            lineNotes.push({
              digit: null,
              isGap: true,
              gapLength: spaceCount,
              isUnderlined: underlinedPositions.includes(currentPosition)
            });
            
            // Skip the spaces we've already counted
            i = j - 1;
          }
        }
        
        if (lineNotes.length > 0) {
          result.push(lineNotes);
        }
      }
      
      return result;
    }
    
    // Play the parsed notation
    async function playParsedNotation(notesArray) {
      if (!audioContext) return () => {};
      
      // If there are no notes to play, return early
      if (!notesArray || notesArray.length === 0 || 
          (notesArray.length === 1 && notesArray[0].length === 0)) {
        isPlaying = false;
        return () => {};
      }
      
      let currentTime = audioContext.currentTime;
      const sources = [];
      const scheduledNotes = [];
      
      // Schedule all the notes but don't play them yet
      for (const line of notesArray) {
        for (const note of line) {
          if (note.isGap) {
            // This is a space - just add delay without playing a note
            scheduledNotes.push({
              type: 'gap',
              gapLength: note.gapLength
            });
            continue;
          }
          
          // Add a note to be played
          scheduledNotes.push({
            type: 'note',
            digit: note.digit,
            isUnderlined: note.isUnderlined,
            isGrouped: note.isGrouped
          });
        }
      }
      
      // Function to dynamically get current delay values
      function getDelay(note) {
        if (note.isUnderlined) {
          return underlinedNoteDelay;
        } else if (note.isGrouped) {
          return groupedNoteDelay;
        } else {
          return singleNoteDelay;
        }
      }
      
      // Function to get gap delay
      function getGapDelay(gapLength) {
        return spaceDelay * gapLength;
      }
      
      // Now play all scheduled notes with current delay settings
      for (const item of scheduledNotes) {
        if (item.type === 'gap') {
          // This is a space - just add delay
          const gapTime = getGapDelay(item.gapLength) / 1000;
          currentTime += gapTime;
          continue;
        }
        
        // Get the corresponding audio buffer
        const buffer = audioBuffers[`note${item.digit}`];
        
        if (buffer) {
          // Create and start an audio source
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(currentTime);
          sources.push(source);
          
          // Get current delay setting for this note type
          const delay = getDelay(item);
          currentTime += delay / 1000; // Convert ms to seconds
        }
      }
      
      // Calculate total playback duration
      const totalDuration = currentTime - audioContext.currentTime;
      
      // Set a timeout to update the playing state when finished
      const timer = setTimeout(() => {
        isPlaying = false;
      }, totalDuration * 1000 + 100); // Add a small buffer
      
      // Return a function to stop all playing sources
      return function stopAllSources() {
        sources.forEach(source => {
          try {
            source.stop();
          } catch (e) {
            // Ignore errors from already stopped sources
          }
        });
        clearTimeout(timer);
        isPlaying = false;
      };
    }
    
    // Load audio files
    onMount(async () => {
      try {
        // Initialize the audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Define the notes with file names
        const notes = [
          { digit: 1, file: 'do.wav' },
          { digit: 2, file: 're.wav' },
          { digit: 3, file: 'mi.wav' },
          { digit: 4, file: 'fa.wav' },
          { digit: 5, file: 'so.wav' },
          { digit: 6, file: 'la.wav' },
          { digit: 7, file: 'thi.wav' },
          { digit: 8, file: 'do.wav' } // High do is the same as low do
        ];
        
        // Hard-code paths for GitHub Pages
        // Possible base paths to try
        const basePaths = [
          '/dramnyen-notations/assets/audio/',
          '/assets/audio/',
          '/dramnyen-notations/audio/'
        ];
        
        // Try to load audio files
        for (const note of notes) {
          let loaded = false;
          
          // Try each possible base path
          for (const basePath of basePaths) {
            if (loaded) break;
            
            const path = basePath + note.file;
            try {
              console.log(`Trying to load: ${path}`);
              const response = await fetch(path);
              
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers[`note${note.digit}`] = await audioContext.decodeAudioData(arrayBuffer);
                console.log(`Successfully loaded: ${path}`);
                loaded = true;
              }
            } catch (error) {
              console.log(`Failed to load: ${path}`);
            }
          }
          
          if (!loaded) {
            console.error(`Could not load audio for note ${note.digit} from any path`);
          }
        }
        
        console.log('Audio loading complete. Successfully loaded:', Object.keys(audioBuffers));
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    });
  </script>
  
  <svelte:head>
    <title>Dramnyen Notations</title>
  </svelte:head>
  
  <main>
    <div style="text-align: center;">
      <h1>Dramnyen Notations</h1>
         <p>Application created by Thupten Chakrishar aka vajradog<br>
        Sounds recorded by Tenzin Norbu (Tenor)</p>
    </div>
    
    <div class="app-container">
      
      <NotationEditor 
        on:change={handleNotationChange}
        on:selection={handleSelectionChange} 
      />
      <PlaybackControls 
        on:play={playNotation}
        on:stop={stopPlayback}
        {isPlaying}
        {hasSelection}
      />
      <PlaybackSettings 
        bind:singleNoteDelay 
        bind:groupedNoteDelay 
        bind:underlinedNoteDelay
        bind:spaceDelay
        on:update={() => {
          // Force reactivity when speeds are updated
          singleNoteDelay = singleNoteDelay;
          groupedNoteDelay = groupedNoteDelay;
          underlinedNoteDelay = underlinedNoteDelay;
          spaceDelay = spaceDelay;
        }}
      />
      
      <ExportTools
        {notation}
        {notationHtml}
        {audioContext}
        {audioBuffers}
        {singleNoteDelay}
        {groupedNoteDelay}
        {underlinedNoteDelay}
        {spaceDelay}
        parseNotation={parseNotation}
      />
    </div>
  </main>
  
  <style>
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .app-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background-color: #f9f9f9;
    }
    
    .hide-button {
      padding: 0.5rem;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>