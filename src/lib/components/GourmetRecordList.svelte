<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { getGourmetRecords } from '../firebase/firestore';
  import { convertFromFirestoreRecord } from '../firebase';
  import type { GourmetRecord } from '../data/mockData';
  import type { FirestoreGourmetRecord } from '../firebase/types';
  import GourmetRecordItem from './GourmetRecordItem.svelte';

  let { isOpen = $bindable(false) }: {
    isOpen: boolean;
  } = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    editRecord: { record: GourmetRecord };
    deleteRecord: { record: GourmetRecord };
  }>();

  // 状態管理
  let records = $state<GourmetRecord[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchTerm = $state('');
  let statusFilter = $state<'all' | 'purchased' | 'completed'>('all');
  let sortBy = $state<'orderDate' | 'productName' | 'prefecture'>('orderDate');
  let sortOrder = $state<'asc' | 'desc'>('desc');

  // フィルタリングされた記録
  let filteredRecords = $derived.by(() => {
    let filtered = records;

    // 検索フィルタ
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.productName.toLowerCase().includes(search) ||
        record.prefecture.toLowerCase().includes(search) ||
        record.shopName?.toLowerCase().includes(search) ||
        record.memo?.toLowerCase().includes(search)
      );
    }

    // ステータスフィルタ
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // ソート
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'orderDate':
          aValue = a.orderDate.getTime();
          bValue = b.orderDate.getTime();
          break;
        case 'productName':
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case 'prefecture':
          aValue = a.prefecture.toLowerCase();
          bValue = b.prefecture.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  });

  // 統計情報
  let stats = $derived.by(() => {
    const total = records.length;
    const completed = records.filter(r => r.status === 'completed').length;
    const purchased = records.filter(r => r.status === 'purchased').length;
    const totalSpent = records
      .filter(r => r.price)
      .reduce((sum, r) => sum + (r.price || 0), 0);

    return { total, completed, purchased, totalSpent };
  });

  async function loadRecords() {
    loading = true;
    error = null;

    try {
      const result = await getGourmetRecords({
        orderBy: { field: 'orderDate', direction: 'desc' }
      });

      if (result.success && result.data) {
        records = result.data.map(convertFromFirestoreRecord);
      } else {
        error = result.error || '記録の取得に失敗しました';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '不明なエラー';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    isOpen = false;
    dispatch('close');
  }

  function handleEditRecord(record: GourmetRecord) {
    dispatch('editRecord', { record });
  }

  function handleDeleteRecord(record: GourmetRecord) {
    dispatch('deleteRecord', { record });
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

  // コンポーネントマウント時とisOpenが変更された時に記録を読み込み
  $effect(() => {
    if (isOpen) {
      loadRecords();
    }
  });
</script>

{#if isOpen}
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
          記録一覧
        </h2>
        <button 
          class="close-button"
          onclick={handleClose}
          aria-label="モーダルを閉じる"
        >
          ×
        </button>
      </div>

      <!-- 統計情報 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{stats.total}</span>
            <span class="stat-label">総記録数</span>
          </div>
          <div class="stat-item">
            <span class="stat-number completed">{stats.completed}</span>
            <span class="stat-label">食事完了</span>
          </div>
          <div class="stat-item">
            <span class="stat-number purchased">{stats.purchased}</span>
            <span class="stat-label">購入済み</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">¥{stats.totalSpent.toLocaleString()}</span>
            <span class="stat-label">総支出</span>
          </div>
        </div>
      </div>

      <!-- フィルタ・検索 -->
      <div class="filters-section">
        <div class="search-group">
          <input
            type="text"
            class="search-input"
            placeholder="商品名、都道府県、ショップ名で検索..."
            bind:value={searchTerm}
          />
        </div>
        
        <div class="filter-group">
          <select class="filter-select" bind:value={statusFilter}>
            <option value="all">すべて</option>
            <option value="purchased">購入済み</option>
            <option value="completed">食事完了</option>
          </select>

          <select class="filter-select" bind:value={sortBy}>
            <option value="orderDate">注文日順</option>
            <option value="productName">商品名順</option>
            <option value="prefecture">都道府県順</option>
          </select>

          <button 
            class="sort-button"
            class:desc={sortOrder === 'desc'}
            onclick={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
            aria-label="ソート順を変更"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <!-- 記録一覧 -->
      <div class="records-section">
        {#if loading}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>記録を読み込み中...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <p class="error-message">エラー: {error}</p>
            <button class="retry-button" onclick={loadRecords}>
              再試行
            </button>
          </div>
        {:else if filteredRecords.length === 0}
          <div class="empty-state">
            {#if records.length === 0}
              <p>まだ記録がありません</p>
              <p class="empty-subtitle">新しい記録を追加してみましょう</p>
            {:else}
              <p>検索条件に一致する記録がありません</p>
            {/if}
          </div>
        {:else}
          <div class="records-list">
            {#each filteredRecords as record (record.id)}
              <GourmetRecordItem 
                {record}
                on:edit={() => handleEditRecord(record)}
                on:delete={() => handleDeleteRecord(record)}
              />
            {/each}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
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
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    animation: modalSlideIn 0.2s ease-out;
    display: flex;
    flex-direction: column;
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
    flex-shrink: 0;
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

  .stats-section {
    padding: 16px 24px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
  }

  .stat-number.completed {
    color: #f44336;
  }

  .stat-number.purchased {
    color: #ff9800;
  }

  .stat-label {
    display: block;
    font-size: 0.85rem;
    color: #666;
    margin-top: 4px;
  }

  .filters-section {
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .search-group {
    margin-bottom: 12px;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
  }

  .filter-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .filter-select {
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
  }

  .sort-button {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s;
  }

  .sort-button:hover {
    background: #e0e0e0;
  }

  .sort-button.desc {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .records-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    color: #f44336;
    margin-bottom: 16px;
  }

  .retry-button {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .retry-button:hover {
    background: var(--primary-dark);
  }

  .empty-subtitle {
    font-size: 0.9rem;
    margin-top: 8px;
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
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
      margin: 10px;
      max-height: calc(100vh - 20px);
    }

    .modal-header {
      padding: 16px 20px 12px;
    }

    .modal-title {
      font-size: 1.3rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .filters-section {
      padding: 12px 20px;
    }

    .filter-group {
      flex-wrap: wrap;
    }

    .records-section {
      padding: 12px 20px;
    }

    .modal-footer {
      padding: 12px 20px 16px;
    }

    .btn {
      width: 100%;
    }
  }
</style>