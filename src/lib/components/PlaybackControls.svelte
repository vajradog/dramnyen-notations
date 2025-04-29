<script>
    import { createEventDispatcher } from 'svelte';
    
    export let isPlaying = false;
    export let hasSelection = false;
    
    const dispatch = createEventDispatcher();
    
    function handlePlayback() {
      if (isPlaying) {
        dispatch('stop');
      } else {
        dispatch('play');
      }
    }
  </script>
  
  <div class="controls-container">
    <button 
      class="play-button {isPlaying ? 'stop-button' : ''}" 
      on:click={handlePlayback} 
      aria-label={isPlaying ? "Stop playback" : "Play notation"}
    >
      {#if isPlaying}
        <span class="button-icon">■</span> Stop
      {:else if hasSelection}
        <span class="button-icon">▶︎</span> Play Selection
      {:else}
        <span class="button-icon">▶︎</span> Play All
      {/if}
    </button>
    
    <div class="playback-info">
      {#if isPlaying}
        <p>Playing notation... Click Stop to end playback</p>
      {:else if hasSelection}
        <p>Click Play Selection to perform only the selected notes</p>
      {:else}
        <p>Click Play All to perform the entire notation</p>
      {/if}
    </div>
  </div>
  
  <style>
    .controls-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding: 0.5rem;
      border-top: 1px solid #eee;
    }
    
    .play-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #48bb78;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .play-button:hover:not(:disabled) {
      background-color: #38a169;
      transform: translateY(-1px);
    }
    
    .play-button:active:not(:disabled) {
      transform: translateY(1px);
    }
    
    .stop-button {
      background-color: #e53e3e;
    }
    
    .stop-button:hover {
      background-color: #c53030;
    }
    
    .button-icon {
      font-size: 1.2em;
    }
    
    .playback-info {
      font-size: 0.9rem;
      color: #666;
    }
    
    .playback-info p {
      margin: 0;
    }
    
    @media (max-width: 600px) {
      .controls-container {
        flex-direction: column;
        align-items: stretch;
      }
      
      .play-button {
        justify-content: center;
      }
    }
  </style>