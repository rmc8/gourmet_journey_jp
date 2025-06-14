<script lang="ts">
  import type { PrefectureData } from '../data/mockData';
  import { generatePerplexitySearchUrl } from '../utils/searchUtils';

  interface Props {
    isOpen: boolean;
    prefectureData: PrefectureData[];
  }

  interface RouletteResult {
    selected: PrefectureData;
    candidates: PrefectureData[];
    minCompletedCount: number;
    candidateCount: number;
    encouragementMessage: string;
  }

  let { 
    isOpen = $bindable(false),
    prefectureData = []
  }: Props = $props();

  // ルーレット状態管理
  let isSpinning = $state(false);
  let currentDisplayPrefecture = $state<PrefectureData | null>(null);
  let result = $state<RouletteResult | null>(null);
  let animationIndex = $state(0);
  let animationSequence = $state<PrefectureData[]>([]);

  // アニメーション設定
  const ANIMATION_DURATION = 2000; // 2秒
  const ANIMATION_INTERVAL = 100; // 100ms間隔

  /**
   * ルーレット実行のコアロジック
   */
  function executeRoulette(): RouletteResult | null {
    if (prefectureData.length === 0) return null;

    const minCompletedCount = Math.min(...prefectureData.map(p => p.completedCount));
    const candidates = prefectureData.filter(p => p.completedCount === minCompletedCount);
    
    if (candidates.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];

    let encouragementMessage = '';
    if (minCompletedCount === 0) {
      encouragementMessage = `まだ${candidates.length}都道府県が未体験です！新しい味覚の発見に出かけましょう🍽️`;
    } else if (candidates.length <= 5) {
      encouragementMessage = `残り${candidates.length}都道府県！制覇まであと少しです🎯`;
    } else {
      encouragementMessage = `${candidates.length}都道府県からの選択です。お取り寄せの冒険を始めましょう🚀`;
    }

    return {
      selected,
      candidates,
      minCompletedCount,
      candidateCount: candidates.length,
      encouragementMessage
    };
  }

  /**
   * アニメーション用シーケンス生成
   */
  function generateAnimationSequence(candidates: PrefectureData[], length: number): PrefectureData[] {
    const sequence: PrefectureData[] = [];
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      sequence.push(candidates[randomIndex]);
    }
    return sequence;
  }

  /**
   * ルーレット開始
   */
  function startRoulette() {
    if (isSpinning) return;

    // ルーレット実行
    const rouletteResult = executeRoulette();
    if (!rouletteResult) {
      alert('選択可能な都道府県がありません');
      return;
    }

    // アニメーション準備
    isSpinning = true;
    result = null;
    animationIndex = 0;
    currentDisplayPrefecture = null;

    // アニメーションシーケンス生成
    const animationSteps = Math.floor(ANIMATION_DURATION / ANIMATION_INTERVAL);
    animationSequence = generateAnimationSequence(rouletteResult.candidates, animationSteps);

    // アニメーション実行
    const animationTimer = setInterval(() => {
      if (animationIndex < animationSequence.length) {
        currentDisplayPrefecture = animationSequence[animationIndex];
        animationIndex++;
      } else {
        // アニメーション終了
        clearInterval(animationTimer);
        result = rouletteResult;
        currentDisplayPrefecture = rouletteResult.selected;
        isSpinning = false;
      }
    }, ANIMATION_INTERVAL);

    // 安全装置
    setTimeout(() => {
      if (isSpinning) {
        clearInterval(animationTimer);
        result = rouletteResult;
        currentDisplayPrefecture = rouletteResult.selected;
        isSpinning = false;
      }
    }, ANIMATION_DURATION + 500);
  }

  /**
   * 検索URL生成（シンプル版）
   */
  function generateSearchUrl(prefecture: PrefectureData, service: 'yahoo' | 'rakuten' | 'perplexity'): string {
    const keyword = prefecture.name.replace(/[県府都道]$/, '');
    const query = encodeURIComponent(`${keyword} 特産品 グルメ お取り寄せ`);
    
    switch (service) {
      case 'yahoo':
        return `https://shopping.yahoo.co.jp/search?p=${query}`;
      case 'rakuten':
        return `https://search.rakuten.co.jp/search/mall/${query}/`;
      case 'perplexity':
        return generatePerplexitySearchUrl(prefecture);
      default:
        return '';
    }
  }

  /**
   * 検索リンクを開く（fallback付き）
   */
  function openSearchLink(service: 'yahoo' | 'rakuten' | 'perplexity') {
    if (!result) return;

    const url = generateSearchUrl(result.selected, service);
    
    try {
      // ブラウザで開く
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // フォールバック：クリップボードにコピー
      try {
        navigator.clipboard.writeText(url);
        alert(`URLをクリップボードにコピーしました:\n${url}`);
      } catch (clipError) {
        alert(`外部リンクを開けませんでした:\n${url}`);
      }
    }
  }

  /**
   * 地図で表示
   */
  function showOnMap() {
    if (!result) return;
    
    // 親コンポーネントに通知するためのイベント発火
    const event = new CustomEvent('prefectureSelected', {
      detail: { prefecture: result.selected },
      bubbles: true
    });
    
    // モーダルのDOM要素からイベントを発火
    const modalElement = document.querySelector('.modal-backdrop');
    if (modalElement) {
      modalElement.dispatchEvent(event);
    }
    
    handleClose();
  }

  /**
   * モーダルを閉じる
   */
  function handleClose() {
    if (isSpinning) return;
    
    isOpen = false;
    result = null;
    currentDisplayPrefecture = null;
    animationSequence = [];
    animationIndex = 0;
  }

  /**
   * キーボード操作
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSpinning) {
      handleClose();
    } else if (event.key === 'Enter' && !isSpinning && !result) {
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
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    tabindex="-1"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">🎲 グルメルーレット</h2>
        <button 
          class="close-button"
          onclick={handleClose}
          disabled={isSpinning}
          aria-label="モーダルを閉じる"
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        {#if !result && !isSpinning}
          <!-- 開始前 -->
          <div class="intro-section">
            <div class="roulette-icon">🎯</div>
            <h3>お取り寄せの新しい発見</h3>
            <p>
              お取り寄せ回数が最も少ない都道府県から<br>
              ランダムに次の目標を選択します！
            </p>
            <div class="button-container">
              <button 
                class="btn btn-primary btn-large"
                onclick={startRoulette}
                disabled={prefectureData.length === 0}
              >
                🎲 ルーレット開始
              </button>
            </div>
          </div>
        {:else if isSpinning}
          <!-- ルーレット中 -->
          <div class="spinning-section">
            <div class="spinner-icon">🎲</div>
            <div class="prefecture-display spinning">
              {currentDisplayPrefecture?.name || '選択中...'}
            </div>
            <div class="loading-bar">
              <div class="loading-progress"></div>
            </div>
          </div>
        {:else if result}
          <!-- 結果表示 -->
          <div class="result-section">
            <div class="result-icon">🎉</div>
            <h3>選択されました！</h3>
            
            <div class="selected-prefecture">
              <div class="prefecture-name">{result.selected.name}</div>
              <div class="prefecture-stats">
                食事完了: {result.selected.completedCount}回 | 
                購入済み: {result.selected.purchasedCount}回
              </div>
            </div>

            <div class="stats-info">
              <p>{result.encouragementMessage}</p>
              <div class="stats-details">
                候補数: {result.candidateCount}都道府県
              </div>
            </div>

            <!-- 検索リンク -->
            <div class="search-section">
              <h4>🔍 商品を探してみましょう</h4>
              <div class="search-buttons">
                <button class="search-button perplexity-button" onclick={() => openSearchLink('perplexity')}>
                  🔍 Perplexity
                </button>
                <button class="search-button" onclick={() => openSearchLink('yahoo')}>
                  🛒 Yahoo!ショッピング
                </button>
                <button class="search-button" onclick={() => openSearchLink('rakuten')}>
                  🛍️ 楽天市場
                </button>
              </div>
            </div>

            <!-- アクション -->
            <div class="action-section">
              <button class="btn btn-primary" onclick={showOnMap}>
                📍 地図で確認
              </button>
              <button class="btn btn-secondary" onclick={startRoulette}>
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

  .button-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* スピニングセクション */
  .spinning-section {
    text-align: center;
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
    color: #FF9800;
    padding: 1rem;
    border: 3px solid #FF9800;
    border-radius: 12px;
    background: rgba(255, 152, 0, 0.1);
    min-height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .prefecture-display.spinning {
    animation: pulse 0.5s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
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
    background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%);
    border-radius: 3px;
    animation: progress 2s linear;
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

  .result-section h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
  }

  .selected-prefecture {
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%);
    border: 2px solid #FF9800;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
  }

  .prefecture-name {
    font-size: 2rem;
    font-weight: 700;
    color: #FF9800;
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
    padding: 12px 16px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
    text-align: left;
  }

  .search-button:hover {
    border-color: #FF9800;
    background: rgba(255, 152, 0, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .perplexity-button {
    background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
    color: white;
    border: 2px solid #1a1a1a;
    font-weight: 600;
  }

  .perplexity-button:hover {
    background: linear-gradient(135deg, #333333 0%, #1a1a1a 100%);
    border-color: #333333;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(26, 26, 26, 0.3);
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
    background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
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

  /* モバイル対応 */
  @media (max-width: 768px) {
    .modal-content {
      margin: 10px;
      max-height: calc(100vh - 20px);
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