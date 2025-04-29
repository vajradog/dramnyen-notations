<script>
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let notation = '';
  export let notationHtml = '';
  export let audioContext = null;
  export let audioBuffers = {};
  // We don't need playParsedNotation as we have our own implementation for audio export
  // export let playParsedNotation;
  export let parseNotation;
  export let singleNoteDelay = 300;
  export let groupedNoteDelay = 500;
  export let underlinedNoteDelay = 170;
  export let spaceDelay = 200;
  
  // State variables
  let songName = '';
  let isExporting = false;
  let exportProgress = 0;
  let exportType = '';
  let showModal = false;
  
  const dispatch = createEventDispatcher();
  
  // Show the song name input modal
  function openExportModal(type) {
    exportType = type;
    showModal = true;
  }
  
  // Close the modal
  function closeModal() {
    showModal = false;
    songName = '';
    isExporting = false;
    exportProgress = 0;
  }
  
  // Export audio using a recorder approach
  async function exportAudio() {
    if (!songName.trim()) {
      alert('Please enter a song name');
      return;
    }
    
    try {
      isExporting = true;
      exportProgress = 10;
      
      // Make sure we have an audio context
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Create a MediaStream destination to record
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks = [];
      
      // Set up recorder event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create a blob from the chunks
        const blob = new Blob(chunks, { type: 'audio/wav' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songName.trim().replace(/\s+/g, '_')}.wav`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        exportProgress = 100;
        setTimeout(() => {
          closeModal();
        }, 1000);
      };
      
      // Start recording
      mediaRecorder.start();
      
      exportProgress = 20;
      
      // Parse the notation
      const notesArray = parseNotation(notation, notationHtml);
      
      // Manual playback (similar to the main playback function)
      let notesToPlay = [];
      
      // First collect all notes to play
      for (const line of notesArray) {
        for (const note of line) {
          if (note.isGap) {
            notesToPlay.push({
              type: 'gap',
              gapLength: note.gapLength
            });
          } else if (note.digit) {
            notesToPlay.push({
              type: 'note',
              digit: note.digit,
              isUnderlined: note.isUnderlined,
              isGrouped: note.isGrouped
            });
          }
        }
      }
      
      // Filter out any invalid notes
      notesToPlay = notesToPlay.filter(note => 
        note.type === 'gap' || 
        (note.type === 'note' && audioBuffers[`note${note.digit}`])
      );
      
      exportProgress = 30;
      
      // Now play each note with proper timing
      let currentNote = 0;
      
      function playNextNote() {
        if (currentNote >= notesToPlay.length) {
          // No more notes to play, finalize recording
          setTimeout(() => {
            mediaRecorder.stop();
            exportProgress = 90;
          }, 500); // Add a small buffer at the end
          return;
        }
        
        const note = notesToPlay[currentNote];
        currentNote++;
        
        // Update progress
        exportProgress = 30 + Math.floor(60 * currentNote / notesToPlay.length);
        
        if (note.type === 'gap') {
          // Just wait for the gap duration
          const gapDuration = (spaceDelay * note.gapLength);
          setTimeout(playNextNote, gapDuration);
          return;
        }
        
        // Get the audio buffer for this note
        const buffer = audioBuffers[`note${note.digit}`];
        if (!buffer) {
          playNextNote(); // Skip invalid notes
          return;
        }
        
        // Play the note through the recorder destination
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(destination);
        source.connect(audioContext.destination); // Also play it live
        source.start();
        
        // Calculate the delay for the next note
        let delay;
        if (note.isUnderlined) {
          delay = underlinedNoteDelay;
        } else if (note.isGrouped) {
          delay = groupedNoteDelay;
        } else {
          delay = singleNoteDelay;
        }
        
        // Schedule the next note
        setTimeout(playNextNote, delay);
      }
      
      // Start playing notes
      playNextNote();
      
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('An error occurred while exporting audio. Please try again.');
      isExporting = false;
    }
  }
  
  // Export as text file with visual formatting
  async function exportText() {
    if (!songName.trim()) {
      alert('Please enter a song name');
      return;
    }
    
    try {
      isExporting = true;
      exportProgress = 20;
      
      // Create a simple text representation with underlines marked
      let formattedText = `${songName}\n`;
      formattedText += "=".repeat(songName.length) + "\n\n";
      
      // Get the actual text content (no HTML)
      const plainText = notation;
      
      // We need to find which parts are underlined
      const underlinedRanges = [];
      
      if (notationHtml) {
        // Create a temporary element to analyze the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = notationHtml;
        
        // Find all underlined elements
        const underlined = tempDiv.querySelectorAll('.underlined');
        underlined.forEach(el => {
          const text = el.textContent;
          // Find all occurrences of this text in the plain text
          let position = 0;
          let found;
          
          // We need to find each occurrence in the original text
          while ((found = plainText.indexOf(text, position)) !== -1) {
            underlinedRanges.push({
              start: found,
              end: found + text.length
            });
            position = found + 1;
          }
        });
      }
      
      exportProgress = 40;
      
      // Now process the text line by line
      const lines = plainText.split('\n');
      let currentPosition = 0;
      
      for (const line of lines) {
        let underlineMarkers = '';
        let hasUnderlines = false;
        
        // For each character in the line, check if it's underlined
        for (let i = 0; i < line.length; i++) {
          const globalPos = currentPosition + i;
          let isUnderlined = false;
          
          // Check if this position is in any underlined range
          for (const range of underlinedRanges) {
            if (globalPos >= range.start && globalPos < range.end) {
              isUnderlined = true;
              break;
            }
          }
          
          // Add an underline marker or space
          if (isUnderlined) {
            underlineMarkers += "̲";  // Unicode combining low line
            hasUnderlines = true;
          } else {
            underlineMarkers += " ";
          }
        }
        
        // Add the line and its underline markers if needed
        formattedText += line + "\n";
        
        // Update position counter
        currentPosition += line.length + 1; // +1 for the newline
      }
      
      // Add a footer
      formattedText += "\n\nGenerated by Dramnyen Notations App";
      formattedText += "\nCreated by Thupten Chakrishar aka vajradog";
      formattedText += "\nSounds recorded by Tenzin Norbu (Tenor)";
      
      exportProgress = 80;
      
      // Export as a simple text file
      const blob = new Blob([formattedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songName.trim().replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      exportProgress = 100;
      setTimeout(() => {
        closeModal();
      }, 1000);
      
    } catch (error) {
      console.error('Error exporting text:', error);
      
      // Fall back to simplest plain text
      try {
        const blob = new Blob([notation], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songName.trim().replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        exportProgress = 100;
        setTimeout(() => {
          closeModal();
        }, 1000);
      } catch (fallbackError) {
        console.error('Fallback export failed:', fallbackError);
        alert('Export failed. Please try again later.');
        isExporting = false;
      }
    }
  }
  
  // We don't need these functions anymore as we're using MediaRecorder API
  
  // Start the export process after collecting song name
  function startExport() {
    if (exportType === 'audio') {
      exportAudio();
    } else if (exportType === 'text') {
      exportText();
    } else {
      closeModal();
    }
  }
</script>

<div class="export-tools">
  <button class="export-button audio-export" on:click={() => openExportModal('audio')}>
    <span class="icon">🔊</span> Export Audio
  </button>
  <button class="export-button text-export" on:click={() => openExportModal('text')}>
    <span class="icon">📄</span> Export Text
  </button>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click|self={closeModal}>
    <div class="modal">
      <div class="modal-header">
        <h3>Export {exportType === 'audio' ? 'Audio' : 'Text'}</h3>
        <button class="close-button" on:click={closeModal}>✕</button>
      </div>
      
      {#if !isExporting}
        <div class="modal-body">
          <label for="song-name">Enter song name:</label>
          <input 
            type="text" 
            id="song-name" 
            bind:value={songName} 
            placeholder="Song Name"
            autofocus
          />
          <div class="modal-buttons">
            <button class="cancel-button" on:click={closeModal}>Cancel</button>
            <button class="export-button" on:click={startExport}>Export</button>
          </div>
        </div>
      {:else}
        <div class="modal-body">
          <p>Exporting {songName}...</p>
          <div class="progress-bar">
            <div class="progress" style="width: {exportProgress}%"></div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .export-tools {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .export-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }
  
  .audio-export {
    background-color: #4299e1;
    color: white;
  }
  
  .audio-export:hover {
    background-color: #3182ce;
  }
  
  .text-export {
    background-color: #48bb78;
    color: white;
  }
  
  .text-export:hover {
    background-color: #38a169;
  }
  
  .export-button:active {
    transform: translateY(1px);
  }
  
  .icon {
    font-size: 1.2em;
  }
  
  /* Modal styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f7fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2d3748;
  }
  
  .close-button {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #718096;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .cancel-button {
    padding: 0.5rem 1rem;
    background-color: #e2e8f0;
    color: #4a5568;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .progress-bar {
    width: 100%;
    height: 10px;
    background-color: #e2e8f0;
    border-radius: 5px;
    overflow: hidden;
  }
  
  .progress {
    height: 100%;
    background-color: #4299e1;
    transition: width 0.3s ease;
  }
</style>