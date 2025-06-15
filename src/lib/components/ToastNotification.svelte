<script lang="ts">
  let { 
    message = '',
    type = 'success',
    duration = 3000,
    visible = $bindable(false)
  }: {
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
    visible: boolean;
  } = $props();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // visible が true になったらタイマー開始
  $effect(() => {
    if (visible) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        visible = false;
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });

  function handleClose() {
    if (timeoutId) clearTimeout(timeoutId);
    visible = false;
  }
</script>

{#if visible}
  <div class="toast-notification {type}" role="alert">
    <div class="toast-content">
      <span class="toast-icon">
        {#if type === 'success'}✅{:else if type === 'error'}❌{:else}ℹ️{/if}
      </span>
      <span class="toast-message">{message}</span>
      <button class="toast-close" onclick={handleClose} aria-label="通知を閉じる">×</button>
    </div>
  </div>
{/if}

<style>
  .toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    max-width: 500px;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  }

  .toast-notification.success {
    background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
    color: white;
  }

  .toast-notification.error {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
  }

  .toast-notification.info {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
  }

  .toast-icon {
    font-size: 1.2rem;
  }

  .toast-message {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* モバイル対応 */
  @media (max-width: 768px) {
    .toast-notification {
      left: 20px;
      right: 20px;
      min-width: auto;
      max-width: none;
    }
  }
</style>