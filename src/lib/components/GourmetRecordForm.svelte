<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PrefectureData } from '../data/mockData';
  import { getAllPrefectureData } from '../data/mockData';
  import { addGourmetRecord, updateGourmetRecord } from '../firebase/firestore';
  import { convertToFirestoreRecord } from '../firebase';
  import type { GourmetRecord } from '../data/mockData';

  let { 
    isOpen = $bindable(false), 
    selectedPrefecture = null,
    editingRecord = null
  }: {
    isOpen: boolean;
    selectedPrefecture: PrefectureData | null;
    editingRecord: GourmetRecord | null;
  } = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    recordAdded: { record: any };
    recordUpdated: { record: any };
  }>();

  // フォームデータ
  let formData = $state({
    productName: '',
    prefecture: selectedPrefecture?.id || '',
    orderDate: new Date().toISOString().split('T')[0],
    price: '',
    shopName: '',
    shopUrl: '',
    productUrl: '',
    status: 'purchased' as 'purchased' | 'completed',
    rating: 0,
    mealDate: '',
    memo: '',
    photoUrl: ''
  });

  // バリデーション状態
  let errors = $state({
    productName: '',
    prefecture: '',
    orderDate: ''
  });

  let isSubmitting = $state(false);
  let submitError = $state<string | null>(null);
  let hoveredRating = $state(0);

  const prefectureData = getAllPrefectureData();

  // 編集モードかどうかの判定
  let isEditMode = $derived(editingRecord !== null);

  // 型安全な文字列処理ヘルパー関数
  function toSafeString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function isNotEmptyString(value: string): boolean {
    return value.trim().length > 0;
  }

  // 編集記録または選択された都道府県が変更された場合
  $effect(() => {
    if (editingRecord) {
      // 編集モード: 既存記録をフォームに設定（全て文字列として統一）
      formData = {
        productName: editingRecord.productName || '',
        prefecture: editingRecord.prefecture || '',
        orderDate: editingRecord.orderDate.toISOString().split('T')[0],
        price: editingRecord.price ? editingRecord.price.toString() : '',
        shopName: editingRecord.shopName || '',
        shopUrl: editingRecord.shopUrl || '',
        productUrl: editingRecord.productUrl || '',
        status: editingRecord.status,
        rating: editingRecord.rating || 0,
        mealDate: editingRecord.mealDate ? editingRecord.mealDate.toISOString().split('T')[0] : '',
        memo: editingRecord.memo || '',
        photoUrl: editingRecord.photoUrl || ''
      };
    } else if (selectedPrefecture) {
      // 新規作成モード: 選択された都道府県を設定
      formData.prefecture = selectedPrefecture.id;
    }
  });

  function validateForm(): boolean {
    // 必須項目のバリデーション
    const productName = toSafeString(formData.productName).trim();
    const prefecture = toSafeString(formData.prefecture).trim();
    const orderDate = toSafeString(formData.orderDate).trim();

    errors.productName = isNotEmptyString(productName) ? '' : '商品名は必須です';
    errors.prefecture = isNotEmptyString(prefecture) ? '' : '都道府県を選択してください';
    errors.orderDate = isNotEmptyString(orderDate) ? '' : '注文日は必須です';

    // 任意項目のフォーマットバリデーション
    const priceStr = toSafeString(formData.price).trim();
    if (isNotEmptyString(priceStr)) {
      const priceNum = parseFloat(priceStr);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.productName = '価格は正の数値で入力してください'; // 一時的にproductNameエラーに表示
      }
    }

    return !errors.productName && !errors.prefecture && !errors.orderDate;
  }

  async function handleSubmit(event?: Event) {
    event?.preventDefault();
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    submitError = null;

    try {
      // Date オブジェクトに変換
      const orderDate = new Date(formData.orderDate);
      const mealDate = formData.mealDate ? new Date(formData.mealDate) : undefined;

      // GourmetRecord 形式に変換（型安全な処理）
      const record: any = {
        productName: formData.productName.trim(),
        orderDate,
        prefecture: formData.prefecture,
        status: formData.status,
        rating: formData.rating,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Optional fields - 値がある場合のみ追加
      const productUrl = toSafeString(formData.productUrl).trim();
      if (isNotEmptyString(productUrl)) {
        record.productUrl = productUrl;
      }
      
      const priceStr = toSafeString(formData.price).trim();
      if (isNotEmptyString(priceStr)) {
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum > 0) {
          record.price = priceNum;
        }
      }
      
      const shopUrl = toSafeString(formData.shopUrl).trim();
      if (isNotEmptyString(shopUrl)) {
        record.shopUrl = shopUrl;
      }
      
      const shopName = toSafeString(formData.shopName).trim();
      if (isNotEmptyString(shopName)) {
        record.shopName = shopName;
      }
      
      const photoUrl = toSafeString(formData.photoUrl).trim();
      if (isNotEmptyString(photoUrl)) {
        record.photoUrl = photoUrl;
      }
      
      if (mealDate) {
        record.mealDate = mealDate;
      }
      
      const memo = toSafeString(formData.memo).trim();
      if (isNotEmptyString(memo)) {
        record.memo = memo;
      }

      let result;
      
      if (isEditMode && editingRecord) {
        // 編集モード: 既存記録を更新
        const firestoreRecord = convertToFirestoreRecord(record);
        result = await updateGourmetRecord(editingRecord.id, firestoreRecord);
        
        if (result.success) {
          dispatch('recordUpdated', { record: { ...record, id: editingRecord.id } });
          handleClose();
          resetForm();
        } else {
          submitError = result.error || '記録の更新に失敗しました';
        }
      } else {
        // 新規作成モード: 新しい記録を追加
        const firestoreRecord = convertToFirestoreRecord(record);
        result = await addGourmetRecord(firestoreRecord);

        if (result.success) {
          dispatch('recordAdded', { record: { ...record, id: result.data } });
          handleClose();
          resetForm();
        } else {
          submitError = result.error || '記録の保存に失敗しました';
        }
      }
    } catch (error) {
      submitError = error instanceof Error ? error.message : '不明なエラーが発生しました';
    } finally {
      isSubmitting = false;
    }
  }

  function resetForm() {
    formData = {
      productName: '',
      prefecture: selectedPrefecture?.id || '',
      orderDate: new Date().toISOString().split('T')[0],
      price: '',
      shopName: '',
      shopUrl: '',
      productUrl: '',
      status: 'purchased',
      rating: 0,
      mealDate: '',
      memo: '',
      photoUrl: ''
    };
    errors = { productName: '', prefecture: '', orderDate: '' };
    submitError = null;
  }

  function handleClose() {
    if (!isSubmitting) {
      isOpen = false;
      dispatch('close');
      resetForm();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isSubmitting) {
      handleClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  }

  function handleRatingClick(rating: number) {
    formData.rating = rating;
  }

  function handleStarMouseEnter(rating: number) {
    if (!isSubmitting) {
      hoveredRating = rating;
    }
  }

  function handleStarMouseLeave() {
    if (!isSubmitting) {
      hoveredRating = 0;
    }
  }
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
          {isEditMode ? '記録を編集' : '新しい記録を追加'}
        </h2>
        <button 
          class="close-button"
          onclick={handleClose}
          aria-label="モーダルを閉じる"
          disabled={isSubmitting}
        >
          ×
        </button>
      </div>

      <form class="modal-body" onsubmit={handleSubmit}>
        {#if submitError}
          <div class="error-message">
            {submitError}
          </div>
        {/if}

        <!-- 商品名 -->
        <div class="form-group">
          <label for="productName" class="form-label">商品名 *</label>
          <input
            id="productName"
            type="text"
            class="form-input"
            class:error={errors.productName}
            bind:value={formData.productName}
            placeholder="例: 博多明太子"
            disabled={isSubmitting}
            required
          />
          {#if errors.productName}
            <span class="error-text">{errors.productName}</span>
          {/if}
        </div>

        <!-- 都道府県 -->
        <div class="form-group">
          <label for="prefecture" class="form-label">都道府県 *</label>
          <select
            id="prefecture"
            class="form-select"
            class:error={errors.prefecture}
            bind:value={formData.prefecture}
            disabled={isSubmitting}
            required
          >
            <option value="">都道府県を選択</option>
            {#each prefectureData as prefecture}
              <option value={prefecture.id}>{prefecture.name}</option>
            {/each}
          </select>
          {#if errors.prefecture}
            <span class="error-text">{errors.prefecture}</span>
          {/if}
        </div>

        <!-- 注文日 -->
        <div class="form-group">
          <label for="orderDate" class="form-label">注文日 *</label>
          <input
            id="orderDate"
            type="date"
            class="form-input"
            class:error={errors.orderDate}
            bind:value={formData.orderDate}
            disabled={isSubmitting}
            required
          />
          {#if errors.orderDate}
            <span class="error-text">{errors.orderDate}</span>
          {/if}
        </div>

        <!-- ステータス -->
        <div class="form-group">
          <fieldset>
            <legend class="form-label">ステータス</legend>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                bind:group={formData.status}
                value="purchased"
                disabled={isSubmitting}
              />
              購入済み
            </label>
            <label class="radio-label">
              <input
                type="radio"
                bind:group={formData.status}
                value="completed"
                disabled={isSubmitting}
              />
              食事完了
            </label>
          </div>
          </fieldset>
        </div>

        <!-- 評価（食事完了の場合のみ） -->
        {#if formData.status === 'completed'}
          <div class="form-group">
            <fieldset>
              <legend class="form-label">評価</legend>
            <div class="rating-input">
              {#each [1, 2, 3, 4, 5] as star}
                <button
                  type="button"
                  class="star-button"
                  class:active={star <= formData.rating}
                  class:hovered={hoveredRating > 0 && star <= hoveredRating}
                  onmouseenter={() => handleStarMouseEnter(star)}
                  onmouseleave={handleStarMouseLeave}
                  onclick={() => handleRatingClick(star)}
                  disabled={isSubmitting}
                  aria-label="{star}つ星"
                >
                  ★
                </button>
              {/each}
              <button
                type="button"
                class="rating-reset"
                onclick={() => handleRatingClick(0)}
                disabled={isSubmitting}
              >
                リセット
              </button>
            </div>
            </fieldset>
          </div>

          <!-- 食事日 -->
          <div class="form-group">
            <label for="mealDate" class="form-label">食事日</label>
            <input
              id="mealDate"
              type="date"
              class="form-input"
              bind:value={formData.mealDate}
              disabled={isSubmitting}
            />
          </div>
        {/if}

        <!-- 価格 -->
        <div class="form-group">
          <label for="price" class="form-label">価格</label>
          <input
            id="price"
            type="number"
            class="form-input"
            bind:value={formData.price}
            placeholder="例: 3000"
            min="0"
            step="1"
            disabled={isSubmitting}
          />
        </div>

        <!-- ショップ名 -->
        <div class="form-group">
          <label for="shopName" class="form-label">ショップ名</label>
          <input
            id="shopName"
            type="text"
            class="form-input"
            bind:value={formData.shopName}
            placeholder="例: 福岡グルメショップ"
            disabled={isSubmitting}
          />
        </div>

        <!-- 商品ページURL -->
        <div class="form-group">
          <label for="shopUrl" class="form-label">商品ページURL</label>
          <input
            id="shopUrl"
            type="url"
            class="form-input"
            bind:value={formData.shopUrl}
            placeholder="https://example.com/product/12345"
            disabled={isSubmitting}
          />
        </div>

        <!-- 商品画像URL -->
        <div class="form-group">
          <label for="productUrl" class="form-label">商品画像URL</label>
          <input
            id="productUrl"
            type="url"
            class="form-input"
            bind:value={formData.productUrl}
            placeholder="https://example.com/images/product.jpg"
            disabled={isSubmitting}
          />
        </div>

        <!-- メモ -->
        <div class="form-group">
          <label for="memo" class="form-label">メモ</label>
          <textarea
            id="memo"
            class="form-textarea"
            bind:value={formData.memo}
            placeholder="感想や注意点など..."
            disabled={isSubmitting}
            rows="3"
          ></textarea>
        </div>
      </form>

      <div class="modal-footer">
        <button 
          type="button"
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditMode ? '更新中...' : '保存中...') : (isEditMode ? '更新' : '保存')}
        </button>
        <button 
          type="button"
          class="btn btn-secondary"
          onclick={handleClose}
          disabled={isSubmitting}
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
    max-width: 600px;
    max-height: 90vh;
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

  .close-button:hover:not(:disabled) {
    background-color: #f5f5f5;
    color: #333;
  }

  .close-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-body {
    padding: 20px 24px;
  }

  .error-message {
    background: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    border: 1px solid #ffcdd2;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 0.95rem;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
  }

  .form-input.error,
  .form-select.error {
    border-color: #f44336;
    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
  }

  .form-input:disabled,
  .form-select:disabled,
  .form-textarea:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .error-text {
    color: #f44336;
    font-size: 0.85rem;
    margin-top: 4px;
    display: block;
  }

  .radio-group {
    display: flex;
    gap: 20px;
    margin-top: 8px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .radio-label input[type="radio"] {
    margin: 0;
  }

  .rating-input {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }

  .star-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #ddd;
    cursor: pointer;
    transition: color 0.2s;
    padding: 4px;
  }

  .star-button.active {
    color: #ffa000;
  }

  .star-button.hovered {
    color: #ffb74d;
  }

  .star-button:hover:not(:disabled) {
    color: inherit;
  }

  .star-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .rating-reset {
    background: none;
    border: none;
    color: #666;
    font-size: 0.85rem;
    cursor: pointer;
    margin-left: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .rating-reset:hover:not(:disabled) {
    background-color: #f5f5f5;
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
    min-width: 100px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-dark) 100%);
    color: var(--white);
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--secondary-dark) 0%, var(--secondary-color) 100%);
    box-shadow: 0 4px 12px var(--shadow-secondary);
  }

  .btn-secondary {
    background: var(--neutral-200);
    color: var(--neutral-800);
    border: 1px solid var(--neutral-300);
  }

  .btn-secondary:hover:not(:disabled) {
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

    .modal-body {
      padding: 16px 20px;
    }

    .radio-group {
      flex-direction: column;
      gap: 12px;
    }

    .rating-input {
      flex-wrap: wrap;
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