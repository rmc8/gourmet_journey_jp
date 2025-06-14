<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GourmetRecord } from '../data/mockData';

  let { 
    isOpen = $bindable(false),
    record = null,
    isDeleting = false
  }: {
    isOpen: boolean;
    record: GourmetRecord | null;
    isDeleting?: boolean;
  } = $props();

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    if (!isDeleting) {
      isOpen = false;
      dispatch('cancel');
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter') {
      handleConfirm();
    }
  }
</script>

{#if isOpen && record}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeyDown}
  >
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="warning-icon">⚠️</div>
        <h2 id="dialog-title" class="dialog-title">
          記録を削除しますか？
        </h2>
      </div>

      <div class="dialog-body">
        <div class="record-preview">
          <div class="record-info">
            <strong class="product-name">{record.productName}</strong>
            <div class="record-details">
              <span class="prefecture">{record.prefecture}</span>
              <span class="order-date">
                {record.orderDate.toLocaleDateString('ja-JP')}
              </span>
              <span class="status-badge {record.status}">
                {record.status === 'completed' ? '食事完了' : '購入済み'}
              </span>
            </div>
          </div>
        </div>
        
        <div class="warning-message">
          <p>この操作は取り消すことができません。</p>
          <p>記録に関連する評価やメモもすべて削除されます。</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          class="btn btn-danger"
          onclick={handleConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? '🔄 削除中...' : '🗑️ 削除する'}
        </button>
        <button 
          class="btn btn-secondary"
          onclick={handleCancel}
          disabled={isDeleting}
        >
          キャンセル
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    padding: 20px;
  }

  .dialog-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    width: 100%;
    max-width: 480px;
    animation: dialogSlideIn 0.2s ease-out;
  }

  @keyframes dialogSlideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 24px 16px;
  }

  .warning-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .dialog-title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: #d32f2f;
  }

  .dialog-body {
    padding: 0 24px 16px;
  }

  .record-preview {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .record-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .product-name {
    font-size: 1.1rem;
    color: #333;
  }

  .record-details {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .prefecture {
    background: #e0e0e0;
    color: #666;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  .order-date {
    color: #666;
    font-size: 0.9rem;
  }

  .status-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .status-badge.completed {
    background: #c8e6c9;
    color: #2e7d32;
  }

  .status-badge.purchased {
    background: #ffe0b2;
    color: #f57c00;
  }

  .warning-message {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .warning-message p {
    margin: 0 0 8px 0;
  }

  .warning-message p:last-child {
    margin-bottom: 0;
  }

  .dialog-footer {
    padding: 16px 24px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
  }

  .btn-danger {
    background: #d32f2f;
    color: white;
  }

  .btn-danger:hover {
    background: #b71c1c;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
  }

  .btn-danger:active {
    transform: translateY(0);
  }

  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-danger:disabled:hover {
    background: #d32f2f;
    transform: none;
    box-shadow: none;
  }

  .btn-secondary {
    background: var(--neutral-200);
    color: var(--neutral-800);
    border: 1px solid var(--neutral-300);
  }

  .btn-secondary:hover {
    background: var(--neutral-300);
    color: var(--neutral-900);
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary:disabled:hover {
    background: var(--neutral-200);
    color: var(--neutral-800);
  }

  /* モバイル対応 */
  @media (max-width: 768px) {
    .dialog-content {
      margin: 10px;
    }

    .dialog-header {
      padding: 20px 20px 12px;
    }

    .dialog-title {
      font-size: 1.2rem;
    }

    .dialog-body {
      padding: 0 20px 12px;
    }

    .record-preview {
      padding: 12px;
    }

    .record-details {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .dialog-footer {
      padding: 12px 20px 20px;
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }

  /* アクセシビリティ */
  @media (prefers-reduced-motion: reduce) {
    .dialog-content {
      animation: none;
    }
    
    .btn {
      transition: none;
    }
  }

  /* ダークモード対応 */
  @media (prefers-color-scheme: dark) {
    .dialog-content {
      background: #2d2d2d;
      color: white;
    }

    .dialog-title {
      color: #ff6b6b;
    }

    .record-preview {
      background: #3d3d3d;
      border-color: #555;
    }

    .product-name {
      color: white;
    }

    .prefecture {
      background: #555;
      color: #ccc;
    }

    .order-date {
      color: #ccc;
    }

    .warning-message {
      color: #ccc;
    }
  }
</style>