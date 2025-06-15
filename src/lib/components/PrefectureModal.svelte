<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import type { PrefectureData, GourmetRecord } from '../data/mockData';
  import { getGourmetRecords, deleteGourmetRecord } from '../firebase/firestore';
  import { convertFromFirestoreRecord } from '../firebase';
  import ToastNotification from './ToastNotification.svelte';

  let { 
    isOpen = $bindable(false),
    prefecture = null
  }: {
    isOpen: boolean;
    prefecture: PrefectureData | null;
  } = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    addRecord: { prefecture: PrefectureData };
    editRecord: { record: GourmetRecord };
    deleteRecord: { record: GourmetRecord };
  }>();

  let prefectureRecords: GourmetRecord[] = $state([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let isDeleting = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('success');
  let showToast = $state(false);

  // 県別統計の計算
  let stats = $derived.by(() => {
    const completedCount = prefectureRecords.filter(r => r.status === 'completed').length;
    const purchasedCount = prefectureRecords.length;
    const totalSpent = prefectureRecords.reduce((sum, r) => sum + (r.price || 0), 0);
    const avgRating = prefectureRecords.filter(r => r.rating > 0).reduce((sum, r, _, arr) => 
      arr.length > 0 ? sum + r.rating / arr.length : 0, 0
    );
    
    return { completedCount, purchasedCount, totalSpent, avgRating };
  });

  async function loadPrefectureRecords() {
    if (!prefecture) return;
    
    isLoading = true;
    error = null;
    
    try {
      const result = await getGourmetRecords({
        where: [{ field: 'prefecture', operator: '==', value: prefecture.id }]
        // orderByは一旦無効化（Firebaseインデックス作成まで）
      });
      
      if (result.success && result.data) {
        prefectureRecords = result.data
          .map(convertFromFirestoreRecord)
          .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime()); // クライアント側でソート
      } else {
        error = result.error || '記録の取得に失敗しました';
        prefectureRecords = [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '不明なエラーが発生しました';
      prefectureRecords = [];
    } finally {
      isLoading = false;
    }
  }

  function handleClose() {
    isOpen = false;
    dispatch('close');
  }

  function handleAddRecord() {
    if (prefecture) {
      dispatch('addRecord', { prefecture });
    }
  }

  function handleEditRecord(record: GourmetRecord) {
    dispatch('editRecord', { record });
  }

  async function handleDeleteRecord(record: GourmetRecord) {
    if (!confirm(`「${record.productName}」の記録を削除しますか？`)) {
      return;
    }

    isDeleting = true;

    try {
      const result = await deleteGourmetRecord(record.id);
      
      if (result.success) {
        // ローカルの記録リストから即座に削除
        prefectureRecords = prefectureRecords.filter(r => r.id !== record.id);
        
        // 成功通知を表示
        toastMessage = `「${record.productName}」を削除しました`;
        toastType = 'success';
        showToast = true;
        
        // 親コンポーネントにも削除を通知（統計更新のため）
        dispatch('deleteRecord', { record });
      } else {
        toastMessage = `削除に失敗しました: ${result.error}`;
        toastType = 'error';
        showToast = true;
      }
    } catch (error) {
      toastMessage = `削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
      toastType = 'error';
      showToast = true;
    } finally {
      isDeleting = false;
    }
  }

  // 県が変更されたときに記録を読み込み
  $effect(() => {
    if (isOpen && prefecture) {
      loadPrefectureRecords();
    }
  });

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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeyDown}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          {prefecture.name}
        </h2>
        <button 
          class="close-button"
          onclick={handleClose}
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
              <span class="stat-value completed">{stats.completedCount}回</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">購入済み</span>
              <span class="stat-value purchased">{stats.purchasedCount}回</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">総支出</span>
              <span class="stat-value total">¥{stats.totalSpent.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均評価</span>
              <span class="stat-value rating">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) + '★' : '未評価'}</span>
            </div>
          </div>
        </div>

        <div class="records-section">
          <h3>記録一覧</h3>
          
          {#if isLoading}
            <div class="loading-message">記録を読み込み中...</div>
          {:else if error}
            <div class="error-message">{error}</div>
          {:else if prefectureRecords.length > 0}
            <div class="records-list">
              {#each prefectureRecords as record (record.id)}
                <div class="record-item">
                  {#if record.productUrl}
                    <div class="record-image-small">
                      <img 
                        src={record.productUrl} 
                        alt={record.productName}
                        class="small-product-image"
                        loading="lazy"
                        onerror={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  {/if}
                  <div class="record-info">
                    <div class="record-name">{record.productName}</div>
                    <div class="record-date">{record.orderDate.toLocaleDateString('ja-JP')}</div>
                    <div class="record-details">
                      <span class="status-badge {record.status}">
                        {record.status === 'completed' ? '食事完了' : '購入済み'}
                      </span>
                      {#if record.rating > 0}
                        <span class="rating">
                          {'★'.repeat(record.rating)}
                        </span>
                      {/if}
                      {#if record.price}
                        <span class="price">¥{record.price.toLocaleString()}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="record-actions">
                    <button 
                      class="btn-action btn-edit"
                      onclick={() => handleEditRecord(record)}
                      title="編集"
                      disabled={isDeleting}
                    >
                      ✏️
                    </button>
                    <button 
                      class="btn-action btn-delete"
                      onclick={() => handleDeleteRecord(record)}
                      title="削除"
                      disabled={isDeleting}
                    >
                      {#if isDeleting}
                        ⏳
                      {:else}
                        🗑️
                      {/if}
                    </button>
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
          onclick={handleAddRecord}
        >
          新しい記録を追加
        </button>
        <button 
          class="btn btn-secondary"
          onclick={handleClose}
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
{/if}

<ToastNotification 
  message={toastMessage} 
  type={toastType} 
  bind:visible={showToast} 
/>

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

  .record-image-small {
    flex-shrink: 0;
    margin-right: 12px;
  }

  .small-product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .record-info {
    flex: 1;
    min-width: 0;
  }

  .record-details {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 0.85rem;
  }

  .price {
    color: #2e7d32;
    font-weight: 500;
  }

  .record-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .btn-action {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-action:hover:not(:disabled) {
    background: #e0e0e0;
  }

  .btn-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-edit:hover:not(:disabled) {
    background: #e3f2fd;
    border-color: #2196f3;
  }

  .btn-delete:hover:not(:disabled) {
    background: #ffebee;
    border-color: #f44336;
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