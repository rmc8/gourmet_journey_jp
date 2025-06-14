<script lang="ts">
  import JapanMap from '$lib/components/JapanMap.svelte';
  import PrefectureModal from '$lib/components/PrefectureModal.svelte';
  import { getAllPrefectureData, type PrefectureData } from '$lib/data/mockData';

  let prefectureData = getAllPrefectureData();
  let isModalOpen = $state(false);
  let selectedPrefecture: PrefectureData | null = $state(null);
  let hoveredPrefecture: PrefectureData | null = $state(null);

  function handlePrefectureClick(event: CustomEvent<{ prefecture: PrefectureData }>) {
    selectedPrefecture = event.detail.prefecture;
    isModalOpen = true;
  }

  function handlePrefectureHover(event: CustomEvent<{ prefecture: PrefectureData | null }>) {
    hoveredPrefecture = event.detail.prefecture;
  }

  function handleModalClose() {
    isModalOpen = false;
    selectedPrefecture = null;
  }

  function handleAddRecord(event: CustomEvent<{ prefecture: PrefectureData }>) {
    // TODO: 記録追加フォームの実装
    console.log('記録追加:', event.detail.prefecture.name);
    handleModalClose();
  }

  // 統計情報の計算
  let totalCompleted = $derived(prefectureData.reduce((sum, p) => sum + p.completedCount, 0));
  let totalPurchased = $derived(prefectureData.reduce((sum, p) => sum + p.purchasedCount, 0));
  let completedPrefectures = $derived(prefectureData.filter(p => p.completedCount > 0).length);
</script>

<main class="app-container">
  <header class="app-header">
    <h1 class="app-title">グルメジャーニー</h1>
    <p class="app-subtitle">全国47都道府県のご当地グルメお取り寄せ管理</p>
    
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-number">{completedPrefectures}</span>
        <span class="stat-label">都道府県制覇</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{totalCompleted}</span>
        <span class="stat-label">食事完了</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{totalPurchased}</span>
        <span class="stat-label">購入済み</span>
      </div>
    </div>
  </header>

  <div class="main-content">
    <div class="map-section">
      <JapanMap 
        {prefectureData}
        on:prefectureClick={handlePrefectureClick}
        on:prefectureHover={handlePrefectureHover}
      />
      
      {#if hoveredPrefecture}
        <div class="hover-info">
          <strong>{hoveredPrefecture.name}</strong><br>
          食事完了: {hoveredPrefecture.completedCount}回<br>
          購入済み: {hoveredPrefecture.purchasedCount}回
        </div>
      {/if}
    </div>

    <div class="sidebar">
      <div class="action-buttons">
        <button class="btn btn-primary">
          🎲 ルーレット
        </button>
        <button class="btn btn-secondary">
          📝 記録追加
        </button>
        <button class="btn btn-secondary">
          📊 統計表示
        </button>
      </div>

      <div class="color-legend">
        <h3>ヒートマップ凡例</h3>
        <div class="legend-items">
          <div class="legend-item">
            <div class="color-box" style="background-color: #E0E0E0;"></div>
            <span>0回</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background-color: #FFE0B2;"></div>
            <span>1回</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background-color: #FFB74D;"></div>
            <span>2回</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background-color: #FF9800;"></div>
            <span>3回</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background-color: #F44336;"></div>
            <span>4-5回</span>
          </div>
          <div class="legend-item">
            <div class="color-box" style="background-color: #C62828;"></div>
            <span>6回以上</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <PrefectureModal 
    bind:isOpen={isModalOpen}
    prefecture={selectedPrefecture}
    on:close={handleModalClose}
    on:addRecord={handleAddRecord}
  />
</main>

<style>

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    color: var(--white);
    padding: 2rem;
    text-align: center;
    box-shadow: 0 4px 20px var(--shadow-primary);
  }

  .app-title {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .app-subtitle {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .stats-summary {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat-item {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    text-align: center;
    min-width: 100px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    opacity: 0.9;
    margin-top: 0.25rem;
  }

  .main-content {
    display: flex;
    flex: 1;
    gap: 2rem;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .map-section {
    flex: 1;
    position: relative;
    background: var(--white);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--shadow-neutral);
    padding: 1.5rem;
  }

  .hover-info {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    pointer-events: none;
    z-index: 10;
  }

  .sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .action-buttons {
    background: var(--white);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px var(--shadow-neutral);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-dark) 100%);
    color: var(--white);
    border: none;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, var(--secondary-dark) 0%, var(--secondary-color) 100%);
    transform: translateY(-1px);
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
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--shadow-neutral);
  }

  .color-legend {
    background: var(--white);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px var(--shadow-neutral);
  }

  .color-legend h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--neutral-800);
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .color-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--neutral-300);
  }

  /* レスポンシブデザイン */
  @media (max-width: 1024px) {
    .main-content {
      flex-direction: column;
      padding: 1rem;
    }

    .sidebar {
      width: 100%;
    }

    .stats-summary {
      gap: 1rem;
    }

    .stat-item {
      padding: 0.75rem 1rem;
      min-width: 80px;
    }

    .stat-number {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .app-header {
      padding: 1.5rem;
    }

    .app-title {
      font-size: 2rem;
    }

    .stats-summary {
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-item {
      width: 100%;
      max-width: 200px;
    }

    .main-content {
      gap: 1rem;
    }

    .action-buttons {
      padding: 1rem;
    }

    .color-legend {
      padding: 1rem;
    }
  }

</style>
