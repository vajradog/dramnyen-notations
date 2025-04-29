/**
 * Utility functions for audio handling in the Dramnyen Notations app
 */

/**
 * Maps note numbers (1-8) to their corresponding note names
 * @param {number} number - The note number (1-8)
 * @returns {string} The note name
 */
export function getNoteNameByNumber(number) {
    const noteMap = {
      1: 'do',
      2: 're',
      3: 'mi',
      4: 'fa',
      5: 'so',
      6: 'la',
      7: 'thi',
      8: 'do' // High do is same as low do
    };
    return noteMap[number] || '';
  }
  
  /**
   * Loads all audio files for the notes
   * @param {AudioContext} audioContext - The Web Audio API context
   * @returns {Promise<Object>} A map of note names to their audio buffers
   */
  export async function loadAudioFiles(audioContext) {
    if (!audioContext) return {};
    
    try {
      const noteNames = [
        { digit: 1, file: 'do.wav' },
        { digit: 2, file: 're.wav' },
        { digit: 3, file: 'mi.wav' },
        { digit: 4, file: 'fa.wav' },
        { digit: 5, file: 'so.wav' },
        { digit: 6, file: 'la.wav' },
        { digit: 7, file: 'thi.wav' },
        { digit: 8, file: 'do.wav' } // High do is same as low do
      ];
      
      const buffers = {};
      
      // Get the correct base path for the deployment environment
      const appBasePath = typeof window !== 'undefined' && window.location.pathname.includes('/dramnyen-notations') 
        ? '/dramnyen-notations' 
        : '';
      
      for (const note of noteNames) {
        try {
          const path = `${appBasePath}/assets/audio/${note.file}`;
          console.log(`Utils loading audio from: ${path}`);
          const response = await fetch(path);
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            buffers[`note${note.digit}`] = await audioContext.decodeAudioData(arrayBuffer);
            console.log(`Utils successfully loaded: ${path}`);
          } else {
            console.error(`Utils failed to load ${path}: ${response.status} ${response.statusText}`);
            
            // Fallback to try without base path if the first attempt failed
            const fallbackPath = `/assets/audio/${note.file}`;
            const fallbackResponse = await fetch(fallbackPath);
            
            if (fallbackResponse.ok) {
              const fallbackArrayBuffer = await fallbackResponse.arrayBuffer();
              buffers[`note${note.digit}`] = await audioContext.decodeAudioData(fallbackArrayBuffer);
              console.log(`Utils successfully loaded fallback: ${fallbackPath}`);
            }
          }
        } catch (error) {
          console.error(`Error loading ${note.file} in utils:`, error);
        }
      }
      
      return buffers;
    } catch (error) {
      console.error('Error loading audio files in utils:', error);
      return {};
    }
  }
  
  /**
   * Plays a single note
   * @param {number} noteNumber - The note number (1-8)
   * @param {AudioContext} audioContext - The Web Audio API context
   * @param {Object} audioBuffers - Map of note names to audio buffers
   * @returns {AudioBufferSourceNode|null} The audio source node or null if playback failed
   */
  export function playNote(noteNumber, audioContext, audioBuffers) {
    if (!audioContext) return null;
    
    const buffer = audioBuffers[`note${noteNumber}`];
    
    if (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      return source;
    }
    
    return null;
  }
  
  /**
   * Analyzes the notation text to extract information about groups and spacing
   * @param {string} text - The notation text
   * @returns {Array} An array of notes with their properties
   */
  export function analyzeNotation(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (const line of lines) {
      const lineNotes = [];
      let i = 0;
      
      while (i < line.length) {
        const char = line[i];
        
        if (/[1-8]/.test(char)) {
          // This is a note (digit 1-8)
          const noteNumber = parseInt(char);
          
          // Check if this is part of a group (consecutive digits without spaces)
          let isGrouped = false;
          let j = i + 1;
          
          while (j < line.length && /[1-8]/.test(line[j])) {
            isGrouped = true;
            j++;
          }
          
          // Create the note object
          const note = {
            digit: noteNumber,
            position: i,
            isGrouped: isGrouped,
            isUnderlined: false // Will be set separately
          };
          
          lineNotes.push(note);
        }
        
        i++;
      }
      
      if (lineNotes.length > 0) {
        result.push(lineNotes);
      }
    }
    
    return result;
  }
  
  /**
   * Parses HTML content to extract underlined notes
   * @param {string} html - The HTML content
   * @returns {Array} An array of notes with their underline status
   */
  export function parseHtmlNotation(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const notes = [];
    
    // Helper function to process nodes
    function processNode(node, isUnderlined = false) {
      // Check if this node is underlined
      let nodeIsUnderlined = isUnderlined;
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check for underline class or style
        if (node.classList.contains('underlined') || 
            window.getComputedStyle(node).textDecoration.includes('underline')) {
          nodeIsUnderlined = true;
        }
        
        // Process child nodes
        for (const child of node.childNodes) {
          processNode(child, nodeIsUnderlined);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // This is a text node - check for digits
        const text = node.textContent;
        
        for (let i = 0; i < text.length; i++) {
          if (/[1-8]/.test(text[i])) {
            notes.push({
              digit: parseInt(text[i]),
              isUnderlined: nodeIsUnderlined
            });
          }
        }
      }
    }
    
    // Start processing from the body
    processNode(doc.body);
    
    return notes;
  }
  
  /**
   * Plays the entire notation with appropriate timing
   * @param {Array} notesArray - The array of notes to play
   * @param {AudioContext} audioContext - The Web Audio API context
   * @param {Object} audioBuffers - Map of note names to audio buffers
   * @returns {Function} A function to stop playback
   */
  export function playParsedNotation(notesArray, audioContext, audioBuffers) {
    if (!audioContext || !notesArray) return () => {};
    
    const baseDelay = 500; // 0.5 seconds for single notes
    const groupDelay = 300; // Faster for grouped notes
    const underlinedDelay = 150; // Much faster for underlined notes
    
    let currentTime = audioContext.currentTime;
    const sources = [];
    
    // Schedule all notes for playback
    for (const line of notesArray) {
      for (const note of line) {
        const buffer = audioBuffers[`note${note.digit}`];
        
        if (buffer) {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(currentTime);
          sources.push(source);
          
          // Calculate delay based on note properties
          let delay;
          if (note.isUnderlined) {
            delay = underlinedDelay;
          } else if (note.isGrouped) {
            delay = groupDelay;
          } else {
            delay = baseDelay;
          }
          
          // Add the delay to the current time
          currentTime += delay / 1000; // Convert ms to seconds
        }
      }
    }
    
    // Return a function to stop all playing sources
    return function stopPlayback() {
      sources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      });
    };
  }