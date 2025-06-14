<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { PrefectureData } from '../data/mockData';
  import { 
    executeRoulette, 
    generateAnimationSequence, 
    generateRouletteStats 
  } from '../utils/rouletteLogic';
  import { 
    generateAllSearchUrls, 
    type SearchService,
    searchServiceMap 
  } from '../utils/searchUtils';
  import { open } from '@tauri-apps/plugin-opener';

  let { 
    isOpen = $bindable(false),
    prefectureData = []
  }: {
    isOpen: boolean;
    prefectureData: PrefectureData[];
  } = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    prefectureSelected: { prefecture: PrefectureData };
  }>();

  // ルーレット状態管理
  let isSpinning = $state(false);
  let currentDisplayPrefecture: PrefectureData | null = $state(null);
  let selectedPrefecture: PrefectureData | null = $state(null);
  let animationSequence: PrefectureData[] = $state([]);
  let animationIndex = $state(0);
  let rouletteResult: any = $state(null);
  let searchUrls: any = $state({});
  let stats: any = $state(null);

  // アニメーション設定
  const ANIMATION_DURATION = 3000; // 3秒
  const ANIMATION_INTERVAL = 100; // 100ms間隔

  /**
   * ルーレットを開始
   */
  async function startRoulette() {
    if (isSpinning || prefectureData.length === 0) return;

    // 状態をリセット
    isSpinning = true;
    selectedPrefecture = null;
    currentDisplayPrefecture = null;
    animationIndex = 0;

    // ルーレット実行
    rouletteResult = executeRoulette(prefectureData);
    
    if (!rouletteResult.selected) {
      // 選択できる都道府県がない場合
      isSpinning = false;
      return;
    }

    // アニメーションシーケンス生成
    animationSequence = generateAnimationSequence(
      rouletteResult.candidates, 
      Math.floor(ANIMATION_DURATION / ANIMATION_INTERVAL)
    );

    // 統計情報生成
    stats = generateRouletteStats(rouletteResult, prefectureData.length);

    // アニメーション開始
    const animationTimer = setInterval(() => {
      if (animationIndex < animationSequence.length) {
        currentDisplayPrefecture = animationSequence[animationIndex];
        animationIndex++;
      } else {
        // アニメーション終了
        clearInterval(animationTimer);
        selectedPrefecture = rouletteResult.selected;
        currentDisplayPrefecture = selectedPrefecture;
        isSpinning = false;

        // 検索URLを生成
        if (selectedPrefecture) {
          searchUrls = generateAllSearchUrls(selectedPrefecture);
        }
      }
    }, ANIMATION_INTERVAL);

    // 安全装置：最大時間後にアニメーション強制終了
    setTimeout(() => {
      clearInterval(animationTimer);
      if (isSpinning) {
        selectedPrefecture = rouletteResult.selected;
        currentDisplayPrefecture = selectedPrefecture;
        isSpinning = false;
        if (selectedPrefecture) {
          searchUrls = generateAllSearchUrls(selectedPrefecture);
        }
      }
    }, ANIMATION_DURATION + 500);
  }

  /**
   * 外部検索リンクを開く
   */
  async function openSearchUrl(service: SearchService) {
    if (!selectedPrefecture) return;

    try {
      const url = searchUrls[service]?.url;
      if (url) {
        console.log(`🔗 外部検索URL を開こうとしています: ${url}`);
        await open(url);
        console.log('✅ 外部検索URL を正常に開きました');
      }
    } catch (error) {
      console.error('❌ 検索URLを開けませんでした:', error);
      
      // Android などでTauri opener が機能しない場合の代替手段
      if (typeof window !== 'undefined') {
        try {
          // ブラウザでの代替手段を試行
          const url = searchUrls[service]?.url;
          if (url) {
            console.log('🔄 代替手段で外部URL を開こうとしています');
            window.open(url, '_blank', 'noopener,noreferrer');
            console.log('✅ 代替手段で外部URL を開きました');
          }
        } catch (fallbackError) {
          console.error('❌ 代替手段も失敗しました:', fallbackError);
          
          // ユーザーに手動でURLをコピーしてもらう最終手段
          const url = searchUrls[service]?.url;
          if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(url);
              alert(`URLをクリップボードにコピーしました。\nブラウザで開いてください:\n${url}`);
            } catch (clipboardError) {
              alert(`外部リンクを開けませんでした。\n下記URLを手動でブラウザで開いてください:\n${url}`);
            }
          } else {
            alert(`外部リンクを開けませんでした。\n下記URLを手動でブラウザで開いてください:\n${url}`);
          }
        }
      }
    }
  }

  /**
   * 地図で選択結果を表示
   */
  function showOnMap() {
    if (selectedPrefecture) {
      dispatch('prefectureSelected', { prefecture: selectedPrefecture });
      handleClose();
    }
  }

  /**
   * モーダルを閉じる
   */
  function handleClose() {
    if (!isSpinning) {
      isOpen = false;
      dispatch('close');
      // 状態をリセット
      selectedPrefecture = null;
      currentDisplayPrefecture = null;
      rouletteResult = null;
      searchUrls = {};
      stats = null;
    }
  }

  /**
   * キーボード操作
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSpinning) {
      handleClose();
    } else if (event.key === 'Enter' && !isSpinning && !selectedPrefecture) {
      startRoulette();
    }
  }

  /**
   * バックドロップクリック
   */
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isSpinning) {
      handleClose();
    }
  }

  // モーダルが開かれた時の初期化
  $effect(() => {
    if (isOpen) {
      selectedPrefecture = null;
      currentDisplayPrefecture = null;
      rouletteResult = null;
      searchUrls = {};
      stats = null;
    }
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="roulette-title"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeyDown}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="roulette-title" class="modal-title">
          🎲 グルメルーレット
        </h2>
        <button 
          class="close-button"
          onclick={handleClose}
          aria-label="モーダルを閉じる"
          disabled={isSpinning}
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        {#if !selectedPrefecture && !isSpinning}
          <!-- 開始前の説明 -->
          <div class="intro-section">
            <div class="roulette-icon">🎯</div>
            <h3>お取り寄せの新しい発見</h3>
            <p>
              お取り寄せ回数が最も少ない都道府県から<br>
              ランダムに次の目標を選択します！
            </p>
            <button 
              class="btn btn-primary btn-large"
              onclick={startRoulette}
              disabled={prefectureData.length === 0}
            >
              🎲 ルーレット開始
            </button>
            {#if prefectureData.length === 0}
              <p class="error-message">都道府県データが読み込まれていません</p>
            {/if}
          </div>
        {:else if isSpinning}
          <!-- ルーレット中のアニメーション -->
          <div class="spinning-section">
            <div class="roulette-spinner">
              <div class="spinner-icon">🎲</div>
              <div class="prefecture-display">
                {currentDisplayPrefecture?.name || '選択中...'}
              </div>
            </div>
            {#if stats}
              <div class="spin-info">
                <p>{stats.encouragementMessage}</p>
                <div class="candidate-info">
                  候補: {stats.candidateCount}都道府県
                </div>
              </div>
            {/if}
            <div class="loading-bar">
              <div class="loading-progress" style="animation-duration: {ANIMATION_DURATION}ms;"></div>
            </div>
          </div>
        {:else if selectedPrefecture}
          <!-- 結果表示 -->
          <div class="result-section">
            <div class="result-header">
              <div class="result-icon">🎉</div>
              <h3>選択されました！</h3>
            </div>
            
            <div class="selected-prefecture">
              <div class="prefecture-name">{selectedPrefecture.name}</div>
              <div class="prefecture-stats">
                食事完了: {selectedPrefecture.completedCount}回 | 
                購入済み: {selectedPrefecture.purchasedCount}回
              </div>
            </div>

            {#if stats}
              <div class="stats-info">
                <p>{stats.encouragementMessage}</p>
                <div class="stats-details">
                  同じ回数の都道府県: {stats.candidateCount}個 
                  ({stats.completionRate}%)
                </div>
              </div>
            {/if}

            <!-- 検索リンク -->
            <div class="search-section">
              <h4>🔍 商品を探してみましょう</h4>
              <div class="search-buttons">
                {#each Object.entries(searchUrls) as [service, data]}
                  <button 
                    class="search-button"
                    onclick={() => openSearchUrl(service)}
                  >
                    <span class="search-icon">{data.service.icon}</span>
                    <span class="search-name">{data.service.name}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- アクション -->
            <div class="action-section">
              <button 
                class="btn btn-primary"
                onclick={showOnMap}
              >
                📍 地図で確認
              </button>
              <button 
                class="btn btn-secondary"
                onclick={startRoulette}
              >
                🎲 もう一度
              </button>
            </div>
          </div>
        {/if}
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
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.95);
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
    padding: 24px 28px 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #666;
    width: 36px;
    height: 36px;
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
    padding: 28px;
  }

  /* 開始前セクション */
  .intro-section {
    text-align: center;
  }

  .roulette-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  .intro-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
    font-weight: 600;
    color: #333;
  }

  .intro-section p {
    margin: 0 0 2rem 0;
    color: #666;
    line-height: 1.6;
  }

  /* スピニングセクション */
  .spinning-section {
    text-align: center;
  }

  .roulette-spinner {
    margin-bottom: 2rem;
  }

  .spinner-icon {
    font-size: 3rem;
    animation: spin 0.5s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .prefecture-display {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    padding: 1rem;
    border: 3px solid var(--primary-color);
    border-radius: 12px;
    background: rgba(255, 152, 0, 0.1);
    transition: all 0.1s;
    min-height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spin-info {
    margin: 1.5rem 0;
  }

  .spin-info p {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.95rem;
  }

  .candidate-info {
    font-size: 0.9rem;
    color: var(--primary-color);
    font-weight: 500;
  }

  .loading-bar {
    width: 100%;
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
  }

  .loading-progress {
    height: 100%;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    border-radius: 3px;
    animation: progress linear;
    width: 100%;
    transform: translateX(-100%);
  }

  @keyframes progress {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  /* 結果セクション */
  .result-section {
    text-align: center;
  }

  .result-header {
    margin-bottom: 1.5rem;
  }

  .result-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    animation: celebration 0.6s ease-out;
  }

  @keyframes celebration {
    0% { transform: scale(0.5) rotate(-180deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .result-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
  }

  .selected-prefecture {
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%);
    border: 2px solid var(--primary-color);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
  }

  .prefecture-name {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }

  .prefecture-stats {
    font-size: 0.9rem;
    color: #666;
  }

  .stats-info {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .stats-info p {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 0.95rem;
  }

  .stats-details {
    font-size: 0.85rem;
    color: #666;
  }

  /* 検索セクション */
  .search-section {
    margin: 2rem 0;
  }

  .search-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .search-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 12px 16px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
  }

  .search-button:hover {
    border-color: var(--primary-color);
    background: rgba(255, 152, 0, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .search-icon {
    font-size: 1.2rem;
  }

  .search-name {
    font-weight: 500;
    color: #333;
  }

  /* アクションセクション */
  .action-section {
    display: flex;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  /* ボタンスタイル */
  .btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-large {
    padding: 16px 32px;
    font-size: 1.1rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }

  .btn-secondary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #e0e0e0;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e9ecef;
    border-color: #ced4da;
  }

  .error-message {
    color: #f44336;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  /* モバイル対応 */
  @media (max-width: 768px) {
    .modal-content {
      margin: 10px;
      max-height: calc(100vh - 20px);
    }

    .modal-header {
      padding: 20px 24px 16px;
    }

    .modal-title {
      font-size: 1.4rem;
    }

    .modal-body {
      padding: 24px;
    }

    .prefecture-display {
      font-size: 1.6rem;
      min-height: 3.5rem;
    }

    .prefecture-name {
      font-size: 1.6rem;
    }

    .action-section {
      flex-direction: column;
    }
  }
</style>