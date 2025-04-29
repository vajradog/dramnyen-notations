<script>
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  
  // Default speed values
  const DEFAULT_SINGLE_NOTE_DELAY = 300;
  const DEFAULT_GROUPED_NOTE_DELAY = 500;
  const DEFAULT_UNDERLINED_NOTE_DELAY = 170;
  const DEFAULT_SPACE_DELAY = 200;
  
  // Export playback speeds with default values
  export let singleNoteDelay = DEFAULT_SINGLE_NOTE_DELAY;
  export let groupedNoteDelay = DEFAULT_GROUPED_NOTE_DELAY;
  export let underlinedNoteDelay = DEFAULT_UNDERLINED_NOTE_DELAY;
  export let spaceDelay = DEFAULT_SPACE_DELAY;
  export let isVisible = false;
  
  const dispatch = createEventDispatcher();
  
  function updateSpeeds() {
    dispatch('update', {
      singleNoteDelay,
      groupedNoteDelay,
      underlinedNoteDelay,
      spaceDelay
    });
  }
  
  // Ensure speeds are updated every time a slider changes
  afterUpdate(() => {
    updateSpeeds();
  });
  
  function toggleSettings() {
    isVisible = !isVisible;
  }
  
  // Reset all speeds to default values
  function resetToDefaults() {
    singleNoteDelay = DEFAULT_SINGLE_NOTE_DELAY;
    groupedNoteDelay = DEFAULT_GROUPED_NOTE_DELAY;
    underlinedNoteDelay = DEFAULT_UNDERLINED_NOTE_DELAY;
    spaceDelay = DEFAULT_SPACE_DELAY;
    
    // Make sure to trigger an update
    updateSpeeds();
  }
</script>

<div class="settings-container">
  <button class="settings-toggle" on:click={toggleSettings}>
    {isVisible ? 'Hide Settings' : 'Speed Settings'}
  </button>
  
  {#if isVisible}
    <div class="settings-panel">
      <div class="setting-group">
        <label for="single-note-delay">
          Single Note Speed <span class="value-display">{singleNoteDelay}ms</span>
        </label>
        <input 
          id="single-note-delay"
          type="range" 
          min="100" 
          max="1000" 
          step="50" 
          bind:value={singleNoteDelay} 
          on:change={updateSpeeds}
        />
        <div class="range-labels">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label for="grouped-note-delay">
          Grouped Notes Speed <span class="value-display">{groupedNoteDelay}ms</span>
        </label>
        <input 
          id="grouped-note-delay"
          type="range" 
          min="50" 
          max="800" 
          step="50" 
          bind:value={groupedNoteDelay} 
          on:change={updateSpeeds}
        />
        <div class="range-labels">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label for="underlined-note-delay">
          Underlined Notes Speed <span class="value-display">{underlinedNoteDelay}ms</span>
        </label>
        <input 
          id="underlined-note-delay"
          type="range" 
          min="20" 
          max="400" 
          step="10" 
          bind:value={underlinedNoteDelay} 
          on:change={updateSpeeds}
        />
        <div class="range-labels">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label for="space-delay">
          Space Gap <span class="value-display">{spaceDelay}ms</span>
        </label>
        <input 
          id="space-delay"
          type="range" 
          min="200" 
          max="2000" 
          step="50" 
          bind:value={spaceDelay} 
          on:change={updateSpeeds}
        />
        <div class="range-labels">
          <span>Short</span>
          <span>Long</span>
        </div>
      </div>
      
      <div class="reset-container">
        <button class="reset-button" on:click={resetToDefaults}>
          Reset to Defaults
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-container {
    margin-top: 0.5rem;
    width: 100%;
  }
  
  .settings-toggle {
    background-color: #4a5568;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .settings-toggle:hover {
    background-color: #2d3748;
  }
  
  .reset-container {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }
  
  .reset-button {
    background-color: #cbd5e0;
    color: #4a5568;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .reset-button:hover {
    background-color: #a0aec0;
  }
  
  .settings-panel {
    margin-top: 0.75rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background-color: #f8fafc;
  }
  
  .setting-group {
    margin-bottom: 1rem;
  }
  
  .setting-group:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: #4a5568;
  }
  
  input[type="range"] {
    width: 100%;
    margin: 0.25rem 0;
  }
  
  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #718096;
    margin-top: 0.25rem;
  }
  
  .value-display {
    font-weight: 400;
    background-color: #edf2f7;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }
</style>