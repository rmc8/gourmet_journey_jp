<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GourmetRecord } from '../data/mockData';
  import { getAllPrefectureData } from '../data/mockData';

  let { record }: { record: GourmetRecord } = $props();

  const dispatch = createEventDispatcher<{
    edit: void;
    delete: void;
  }>();

  const prefectureData = getAllPrefectureData();

  // 都道府県名を取得
  const prefectureName = prefectureData.find(p => p.id === record.prefecture)?.name || record.prefecture;

  // 日付のフォーマット
  function formatDate(date: Date): string {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // 価格のフォーマット
  function formatPrice(price?: number): string {
    if (!price) return '';
    return `¥${price.toLocaleString()}`;
  }

  // 星評価の表示
  function getStarRating(rating: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, rating))) + '☆'.repeat(5 - Math.max(0, Math.min(5, rating)));
  }

  function handleEdit() {
    dispatch('edit');
  }

  function handleDelete() {
    if (confirm(`「${record.productName}」の記録を削除しますか？`)) {
      dispatch('delete');
    }
  }
</script>

<div class="record-item">
  <div class="record-header">
    <div class="record-title-section">
      <h3 class="record-title">{record.productName}</h3>
      <div class="record-meta">
        <span class="prefecture-tag">{prefectureName}</span>
        <span class="status-badge {record.status}">
          {record.status === 'completed' ? '食事完了' : '購入済み'}
        </span>
      </div>
    </div>
    <div class="record-actions">
      <button class="action-btn edit-btn" onclick={handleEdit} aria-label="編集">
        ✏️
      </button>
      <button class="action-btn delete-btn" onclick={handleDelete} aria-label="削除">
        🗑️
      </button>
    </div>
  </div>

  <div class="record-content">
    <div class="record-details">
      <div class="detail-row">
        <span class="detail-label">注文日:</span>
        <span class="detail-value">{formatDate(record.orderDate)}</span>
      </div>

      {#if record.mealDate && record.status === 'completed'}
        <div class="detail-row">
          <span class="detail-label">食事日:</span>
          <span class="detail-value">{formatDate(record.mealDate)}</span>
        </div>
      {/if}

      {#if record.price}
        <div class="detail-row">
          <span class="detail-label">価格:</span>
          <span class="detail-value price">{formatPrice(record.price)}</span>
        </div>
      {/if}

      {#if record.shopName}
        <div class="detail-row">
          <span class="detail-label">ショップ:</span>
          <span class="detail-value">{record.shopName}</span>
        </div>
      {/if}

      {#if record.rating > 0 && record.status === 'completed'}
        <div class="detail-row">
          <span class="detail-label">評価:</span>
          <span class="detail-value rating">{getStarRating(record.rating)}</span>
        </div>
      {/if}
    </div>

    {#if record.productUrl}
      <div class="record-image">
        <img 
          src={record.productUrl} 
          alt={record.productName}
          class="product-image"
          loading="lazy"
          onerror={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />
        <div class="image-error" style="display: none;">
          <span class="error-icon">🖼️</span>
          <span class="error-text">画像を読み込めませんでした</span>
        </div>
      </div>
    {/if}

    {#if record.memo}
      <div class="record-memo">
        <p class="memo-text">{record.memo}</p>
      </div>
    {/if}
  </div>

  <div class="record-footer">
    <div class="record-links">
      {#if record.shopUrl}
        <a href={record.shopUrl} target="_blank" rel="noopener noreferrer" class="link-btn">
          🔗 商品ページ
        </a>
      {/if}
      {#if record.productUrl}
        <a href={record.productUrl} target="_blank" rel="noopener noreferrer" class="link-btn">
          🖼️ 商品画像
        </a>
      {/if}
    </div>
    <div class="record-dates">
      <span class="date-info">
        作成: {formatDate(record.createdAt)}
        {#if record.updatedAt.getTime() !== record.createdAt.getTime()}
          • 更新: {formatDate(record.updatedAt)}
        {/if}
      </span>
    </div>
  </div>
</div>

<style>
  .record-item {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
  }

  .record-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #ccc;
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .record-title-section {
    flex: 1;
  }

  .record-title {
    margin: 0 0 6px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
  }

  .record-meta {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .prefecture-tag {
    background: #f0f0f0;
    color: #666;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
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

  .record-actions {
    display: flex;
    gap: 4px;
    margin-left: 12px;
  }

  .action-btn {
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

  .action-btn:hover {
    background: #e0e0e0;
  }

  .edit-btn:hover {
    background: #e3f2fd;
    border-color: #2196f3;
  }

  .delete-btn:hover {
    background: #ffebee;
    border-color: #f44336;
  }

  .record-content {
    margin-bottom: 12px;
  }

  .record-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .detail-label {
    color: #666;
    font-weight: 500;
    min-width: 60px;
  }

  .detail-value {
    color: #333;
  }

  .detail-value.price {
    font-weight: 600;
    color: #2e7d32;
  }

  .detail-value.rating {
    color: #ffa000;
    font-size: 1rem;
  }

  .record-memo {
    background: #f8f9fa;
    border-left: 3px solid var(--primary-color);
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
  }

  .memo-text {
    margin: 0;
    font-size: 0.9rem;
    color: #555;
    line-height: 1.4;
  }

  .record-image {
    margin-bottom: 12px;
    text-align: center;
  }

  .product-image {
    max-width: 100%;
    max-height: 200px;
    width: auto;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }

  .product-image:hover {
    transform: scale(1.02);
    cursor: pointer;
  }

  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #f8f9fa;
    border: 2px dashed #ddd;
    border-radius: 8px;
    color: #666;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }

  .error-text {
    font-size: 0.9rem;
  }

  .record-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    gap: 12px;
  }

  .record-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .link-btn {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 0.85rem;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .link-btn:hover {
    background: rgba(255, 152, 0, 0.1);
    text-decoration: underline;
  }

  .record-dates {
    flex-shrink: 0;
  }

  .date-info {
    font-size: 0.75rem;
    color: #999;
  }

  /* モバイル対応 */
  @media (max-width: 768px) {
    .record-item {
      padding: 12px;
    }

    .record-header {
      flex-direction: column;
      gap: 8px;
    }

    .record-actions {
      align-self: flex-end;
      margin-left: 0;
    }

    .record-title {
      font-size: 1rem;
    }

    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .detail-label {
      min-width: auto;
      font-size: 0.8rem;
    }

    .record-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  /* 印刷対応 */
  @media print {
    .record-actions {
      display: none;
    }

    .link-btn {
      color: #333;
    }

    .record-item {
      border: 1px solid #ccc;
      break-inside: avoid;
      margin-bottom: 16px;
    }
  }
</style>