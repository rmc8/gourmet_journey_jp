<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PrefectureData } from '../data/mockData';

  export let isOpen: boolean = false;
  export let prefecture: PrefectureData | null = null;

  const dispatch = createEventDispatcher<{
    close: void;
    addRecord: { prefecture: PrefectureData };
  }>();

  function handleClose() {
    isOpen = false;
    dispatch('close');
  }

  function handleAddRecord() {
    if (prefecture) {
      dispatch('addRecord', { prefecture });
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

{#if isOpen && prefecture}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          {prefecture.name}
        </h2>
        <button 
          class="close-button"
          on:click={handleClose}
          aria-label="モーダルを閉じる"
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        <div class="stats-section">
          <h3>統計情報</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">食事完了</span>
              <span class="stat-value completed">{prefecture.completedCount}回</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">購入済み</span>
              <span class="stat-value purchased">{prefecture.purchasedCount}回</span>
            </div>
          </div>
        </div>

        <div class="records-section">
          <h3>記録一覧</h3>
          {#if prefecture.records.length > 0}
            <div class="records-list">
              {#each prefecture.records as record (record.id)}
                <div class="record-item">
                  <div class="record-name">{record.productName}</div>
                  <div class="record-status">
                    <span class="status-badge {record.status}">
                      {record.status === 'completed' ? '食事完了' : '購入済み'}
                    </span>
                    {#if record.rating > 0}
                      <span class="rating">
                        {'★'.repeat(record.rating)}
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="no-records">まだ記録がありません</p>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn btn-primary"
          on:click={handleAddRecord}
        >
          新しい記録を追加
        </button>
        <button 
          class="btn btn-secondary"
          on:click={handleClose}
        >
          閉じる
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    animation: modalSlideIn 0.2s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .close-button:hover {
    background-color: #f5f5f5;
    color: #333;
  }

  .modal-body {
    padding: 20px 24px;
  }

  .stats-section {
    margin-bottom: 24px;
  }

  .stats-section h3 {
    margin: 0 0 12px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .stat-item {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 4px;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .stat-value.completed {
    color: #f44336;
  }

  .stat-value.purchased {
    color: #ff9800;
  }

  .records-section h3 {
    margin: 0 0 12px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .record-name {
    font-weight: 500;
    color: #333;
  }

  .record-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-badge {
    padding: 4px 8px;
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

  .rating {
    color: #ffa000;
    font-size: 0.9rem;
  }

  .no-records {
    text-align: center;
    color: #666;
    font-style: italic;
    margin: 20px 0;
  }

  .modal-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid #e0e0e0;
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
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-dark) 100%);
    color: var(--white);
    border: none;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, var(--secondary-dark) 0%, var(--secondary-color) 100%);
    box-shadow: 0 4px 12px var(--shadow-secondary);
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

  /* モバイル対応 */
  @media (max-width: 768px) {
    .modal-content {
      margin: 20px;
      max-height: calc(100vh - 40px);
    }

    .modal-header {
      padding: 16px 20px 12px;
    }

    .modal-title {
      font-size: 1.3rem;
    }

    .modal-body {
      padding: 16px 20px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .modal-footer {
      padding: 12px 20px 16px;
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }
</style>