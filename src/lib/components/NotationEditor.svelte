<script>
    import { createEventDispatcher, onMount } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    let editorElement;
    let selection = { start: 0, end: 0 };
    let text = '';
    let audioContext;
    let audioBuffers = {};
    
    // Function to handle key press in the editor
    function handleKeyDown(event) {
      // Allow digits 1-8, Enter, Space, and navigation keys
      if (/^[1-8]$/.test(event.key)) {
        // Play the corresponding note
        playNote(parseInt(event.key));
        
        // Let the browser update the text field
        setTimeout(() => {
          // Update our text variable and dispatch change event
          text = editorElement.innerText;
          dispatch('change', { text });
        }, 0);
      } else if (
        event.key === 'Enter' ||
        event.key === ' ' ||  // Allow space
        event.key === 'Backspace' || 
        event.key === 'Delete' || 
        event.key === 'ArrowLeft' || 
        event.key === 'ArrowRight' || 
        event.key === 'ArrowUp' || 
        event.key === 'ArrowDown' ||
        event.ctrlKey || 
        event.metaKey
      ) {
        // Allow these keys
      } else {
        // Prevent any other characters
        event.preventDefault();
      }
    }
    
    // Handle input events (like paste operations)
    function handleInput() {
      // Filter out any non-allowed characters
      const cleanText = editorElement.innerText.replace(/[^1-8\s\n]/g, '');
      
      // Only update if the text has changed
      if (cleanText !== editorElement.innerText) {
        // Save current selection
        const sel = window.getSelection();
        const offset = sel.focusOffset;
        
        // Update the text
        editorElement.innerText = cleanText;
        
        // Try to restore selection position
        if (sel.rangeCount > 0) {
          try {
            const range = document.createRange();
            const textNode = editorElement.firstChild || editorElement;
            range.setStart(textNode, Math.min(offset, cleanText.length));
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (error) {
            console.error('Error restoring selection:', error);
          }
        }
      }
      
      // Update our text variable and dispatch change event
      text = cleanText;
      dispatch('change', { 
        text: cleanText,
        html: editorElement.innerHTML
      });
    }
    
    // Handle selection for underlining and playback
    function handleSelection() {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Get the selection text
        const selectedText = sel.toString();
        
        // Update selection range
        selection = {
          start: range.startOffset,
          end: range.endOffset,
          text: selectedText
        };
        
        // Dispatch selection event
        dispatch('selection', { 
          hasSelection: selectedText.length > 0,
          selectedText: selectedText
        });
      } else {
        // If no selection, clear it
        selection = { start: 0, end: 0, text: '' };
        dispatch('selection', { hasSelection: false, selectedText: '' });
      }
    }
    
    // Toggle underlining for selected text
    function applyUnderline() {
      if (selection.start === selection.end) return;
      
      const sel = window.getSelection();
      if (sel.rangeCount === 0) return;
      
      const range = sel.getRangeAt(0);
      
      try {
        // Check if the selection is already underlined
        let selectedNode = range.commonAncestorContainer;
        
        // If we selected text inside a node, go up to the parent node
        if (selectedNode.nodeType === Node.TEXT_NODE) {
          selectedNode = selectedNode.parentNode;
        }
        
        // Check if the current selection is already fully underlined
        const isAlreadyUnderlined = selectedNode.classList && 
                                    selectedNode.classList.contains('underlined');
        
        if (isAlreadyUnderlined) {
          // Remove the underline by extracting the text content
          const textContent = selectedNode.textContent;
          
          // Replace the underlined span with plain text
          const textNode = document.createTextNode(textContent);
          selectedNode.parentNode.replaceChild(textNode, selectedNode);
          
          // Select the newly inserted text
          const newRange = document.createRange();
          newRange.selectNodeContents(textNode);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Create a span with underlining
          const span = document.createElement('span');
          span.className = 'underlined';
          
          // Apply the underline to the selected text
          range.surroundContents(span);
        }
        
        // Dispatch the updated content
        text = editorElement.innerHTML;
        dispatch('change', { 
          text: editorElement.innerText,
          html: editorElement.innerHTML 
        });
      } catch (error) {
        console.error('Error toggling underline:', error);
        // If operation fails, we could implement a more complex approach here
      }
    }
    
    // Play a single note when typed
    function playNote(noteNumber) {
      if (!audioContext) {
        try {
          // Create audio context on first note (needed due to autoplay policies)
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          loadAudioFiles();
        } catch (error) {
          console.error('Error creating audio context:', error);
          return;
        }
      }
      
      const buffer = audioBuffers[`note${noteNumber}`];
      if (buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      } else {
        // Try to load the audio file if not already loaded
        loadAudioFile(noteNumber);
      }
    }
    
    // Load all audio files
    async function loadAudioFiles() {
      try {
        // Define the notes to load
        const notes = [
          { digit: 1, file: 'do.wav' },
          { digit: 2, file: 're.wav' },
          { digit: 3, file: 'mi.wav' },
          { digit: 4, file: 'fa.wav' },
          { digit: 5, file: 'so.wav' },
          { digit: 6, file: 'la.wav' },
          { digit: 7, file: 'thi.wav' },
          { digit: 8, file: 'do.wav' }
        ];
        
        // Load each audio file
        for (const note of notes) {
          await loadAudioFile(note.digit, note.file);
        }
        
        console.log('Audio files loaded in editor');
      } catch (error) {
        console.error('Error loading audio files:', error);
      }
    }
    
    // Load a single audio file
    async function loadAudioFile(noteNumber, fileName) {
      if (!audioContext) return;
      
      const file = fileName || `${getNoteNameByNumber(noteNumber)}.wav`;
      const basePath = window.location.pathname.includes('/dramnyen-notations') ? '/dramnyen-notations' : '';
      
      try {
        const response = await fetch(`${basePath}/assets/audio/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[`note${noteNumber}`] = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`Successfully loaded audio: ${basePath}/assets/audio/${file}`);
        return true;
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
        return false;
      }
    }
    
    // Get note name from number
    function getNoteNameByNumber(number) {
      const noteMap = {
        1: 'do',
        2: 're',
        3: 'mi',
        4: 'fa',
        5: 'so',
        6: 'la',
        7: 'thi',
        8: 'do' // High do is the same as low do
      };
      return noteMap[number] || '';
    }
    
    // Initialize component
    onMount(() => {
      // Set initial focus to the editor
      if (editorElement) {
        editorElement.focus();
      }
      
      // Create audio context and load audio files when component is mounted
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Use a timeout to ensure the component is fully rendered before loading audio
        setTimeout(() => {
          console.log('Initializing audio in editor component');
          loadAudioFiles();
        }, 500);
      } catch (error) {
        console.error('Error initializing audio in editor:', error);
      }
    });
  </script>
  
  <div class="editor-container">
    <div 
      class="notation-editor" 
      contenteditable="true" 
      bind:this={editorElement}
      on:keydown={handleKeyDown}
      on:input={handleInput}
      on:mouseup={handleSelection}
      on:selectstart={handleSelection}
    ></div>
    
    <div class="editor-controls">
      <button on:click={applyUnderline} class="underline-button">
        Toggle Underline
      </button>
      <div class="editor-info">
        <p>Type digits 1-8 for notes (Do-Re-Mi-Fa-So-La-Ti-Do)</p>
        <p>Select text <u>1</u> click "Toggle Underline" for faster/slower playback</p>
      </div>
    </div>
  </div>
  
  <style>
    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .notation-editor {
      min-height: 200px;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
      font-family: monospace;
      font-size: 1.2rem;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    
    .notation-editor:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }
    
    .editor-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .underline-button {
      padding: 0.5rem 1rem;
      background-color: #4299e1;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .underline-button:hover {
      background-color: #3182ce;
    }
    
    .editor-info {
      font-size: 0.8rem;
      color: #666;
    }
    
    .editor-info p {
      margin: 0;
    }
    
    :global(.underlined) {
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
  </style>