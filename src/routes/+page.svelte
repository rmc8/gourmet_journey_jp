<script lang="ts">
  import { onMount } from 'svelte';
  import JapanMap from '$lib/components/JapanMap.svelte';
  import PrefectureModal from '$lib/components/PrefectureModal.svelte';
  import RouletteModalV2 from '$lib/components/RouletteModalV2.svelte';
  import GourmetRecordForm from '$lib/components/GourmetRecordForm.svelte';
  import GourmetRecordList from '$lib/components/GourmetRecordList.svelte';
  import DeleteConfirmDialog from '$lib/components/DeleteConfirmDialog.svelte';
  import { getAllPrefectureData, type PrefectureData, type GourmetRecord } from '$lib/data/mockData';
  import { testFirestoreConnection, deleteGourmetRecord, getPrefectureStats, initializeFirebase } from '$lib/firebase/firestore';
  import type { PrefectureStats } from '$lib/firebase/types';

  // 基本の都道府県データ（テンプレート）
  let basePrefectureData = getAllPrefectureData();
  
  // 実際の統計データで更新されるヒートマップ用データ
  let prefectureData: PrefectureData[] = $state([]);
  
  // UIの状態管理
  let isModalOpen = $state(false);
  let isRouletteOpen = $state(false);
  let isRecordFormOpen = $state(false);
  let isRecordListOpen = $state(false);
  let isDeleteDialogOpen = $state(false);
  let selectedPrefecture: PrefectureData | null = $state(null);
  let editingRecord: GourmetRecord | null = $state(null);
  let deletingRecord: GourmetRecord | null = $state(null);
  let hoveredPrefecture: PrefectureData | null = $state(null);
  let testingConnection = $state(false);
  let connectionResult = $state<{success: boolean, error?: string} | null>(null);
  let isDeleting = $state(false);
  
  // 統計データの読み込み状態
  let isLoadingStats = $state(false);
  let statsError = $state<string | null>(null);

  // デバッグモード管理
  let debugMode = $state(false);
  let titleClickCount = $state(0);
  let titleClickTimer: number | null = null;

  // 地図ズーム機能
  let mapContainer: HTMLDivElement;
  let mapZoom = $state(1);
  let mapPanX = $state(0);
  let mapPanY = $state(0);
  
  // 地図ドラッグ機能
  let isDragging = $state(false);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let lastPanX = $state(0);
  let lastPanY = $state(0);

  /**
   * Firestore から都道府県別統計を取得してヒートマップデータを更新
   */
  async function loadPrefectureStats() {
    isLoadingStats = true;
    statsError = null;
    
    try {
      // Firebase初期化
      const initResult = await initializeFirebase();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // 統計データ取得
      const statsResult = await getPrefectureStats();
      if (!statsResult.success || !statsResult.data) {
        throw new Error(statsResult.error || '統計データの取得に失敗しました');
      }

      const statsData = statsResult.data;
      console.log('📊 取得した統計データ:', statsData);

      // 基本データと統計データをマージして完全な都道府県データを作成
      prefectureData = basePrefectureData.map(baseData => {
        const stats = statsData.find(stat => stat.prefectureId === baseData.id);
        
        return {
          ...baseData,
          completedCount: stats?.completedCount || 0,
          purchasedCount: stats?.purchasedCount || 0,
          totalSpent: stats?.totalSpent || 0,
          averageRating: stats?.averageRating || 0,
          lastOrderDate: stats?.lastOrderDate || null,
          // 既存のrecordsは空配列（PrefectureModalで個別取得）
          records: []
        };
      });

      console.log('🗺️ 更新されたヒートマップデータ:', prefectureData);
      
    } catch (error) {
      console.error('❌ 統計データの読み込みエラー:', error);
      statsError = error instanceof Error ? error.message : '不明なエラー';
      // エラー時は基本データを使用
      prefectureData = basePrefectureData.map(baseData => ({
        ...baseData,
        completedCount: 0,
        purchasedCount: 0,
        totalSpent: 0,
        averageRating: 0,
        lastOrderDate: null,
        records: []
      }));
    } finally {
      isLoadingStats = false;
    }
  }

  /**
   * デバッグモードの切り替え
   */
  function toggleDebugMode() {
    debugMode = !debugMode;
    // ローカルストレージに保存
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gourmet-journey-debug', debugMode.toString());
    }
    console.log(debugMode ? '🔧 デバッグモードを有効にしました' : '✅ デバッグモードを無効にしました');
  }

  /**
   * タイトルクリック処理（隠しコマンド）
   */
  function handleTitleClick() {
    titleClickCount++;
    
    // 既存のタイマーをクリア
    if (titleClickTimer) {
      clearTimeout(titleClickTimer);
    }
    
    // 5回クリックでデバッグモード切り替え
    if (titleClickCount >= 5) {
      toggleDebugMode();
      titleClickCount = 0;
      return;
    }
    
    // 2秒でカウントリセット
    titleClickTimer = setTimeout(() => {
      titleClickCount = 0;
    }, 2000);
  }

  /**
   * キーボードショートカット処理
   */
  function handleKeyDown(event: KeyboardEvent) {
    // Ctrl+Shift+D (Windows/Linux) または Cmd+Shift+D (Mac)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      toggleDebugMode();
    }
  }

  /**
   * 地図ズーム・移動機能
   */
  function updateMapTransform() {
    if (mapContainer) {
      const japanMap = mapContainer.querySelector('.japan-map-container');
      if (japanMap) {
        (japanMap as HTMLElement).style.transform = 
          `scale(${mapZoom}) translate(${mapPanX}px, ${mapPanY}px)`;
      }
    }
  }

  function handleZoomIn() {
    mapZoom = Math.min(mapZoom * 1.2, 3);
    updateMapTransform();
  }

  function handleZoomOut() {
    mapZoom = Math.max(mapZoom / 1.2, 0.5);
    updateMapTransform();
  }

  function handleZoomReset() {
    mapZoom = 1;
    mapPanX = 0;
    mapPanY = 0;
    lastPanX = 0;
    lastPanY = 0;
    updateMapTransform();
  }

  /**
   * 地図ドラッグ機能（マウス・タッチ対応）
   */
  function handleMapMouseDown(event: MouseEvent) {
    if (mapZoom <= 1) return; // ズームしていない時はドラッグ無効
    
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastPanX = mapPanX;
    lastPanY = mapPanY;
  }

  function handleMapTouchStart(event: TouchEvent) {
    if (mapZoom <= 1) return; // ズームしていない時はドラッグ無効
    event.preventDefault(); // スクロール防止
    
    const touch = event.touches[0];
    isDragging = true;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    lastPanX = mapPanX;
    lastPanY = mapPanY;
  }

  function handleMapMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = (event.clientX - dragStartX) / mapZoom;
    const deltaY = (event.clientY - dragStartY) / mapZoom;
    
    mapPanX = lastPanX + deltaX;
    mapPanY = lastPanY + deltaY;
    
    updateMapTransform();
  }

  function handleMapTouchMove(event: TouchEvent) {
    if (!isDragging) return;
    event.preventDefault(); // スクロール防止
    
    const touch = event.touches[0];
    const deltaX = (touch.clientX - dragStartX) / mapZoom;
    const deltaY = (touch.clientY - dragStartY) / mapZoom;
    
    mapPanX = lastPanX + deltaX;
    mapPanY = lastPanY + deltaY;
    
    updateMapTransform();
  }

  function handleMapMouseUp() {
    isDragging = false;
  }

  function handleMapTouchEnd() {
    isDragging = false;
  }

  // アプリ起動時の初期化
  onMount(() => {
    // 統計データ読み込み
    loadPrefectureStats();
    
    // デバッグモード状態をローカルストレージから復元
    if (typeof localStorage !== 'undefined') {
      const savedDebugMode = localStorage.getItem('gourmet-journey-debug');
      debugMode = savedDebugMode === 'true';
    }
    
    // キーボードイベントリスナー追加
    document.addEventListener('keydown', handleKeyDown);
    
    // 地図ドラッグ用グローバルイベントリスナー（マウス・タッチ対応）
    document.addEventListener('mousemove', handleMapMouseMove);
    document.addEventListener('mouseup', handleMapMouseUp);
    document.addEventListener('touchmove', handleMapTouchMove, { passive: false });
    document.addEventListener('touchend', handleMapTouchEnd);
    
    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMapMouseMove);
      document.removeEventListener('mouseup', handleMapMouseUp);
      document.removeEventListener('touchmove', handleMapTouchMove);
      document.removeEventListener('touchend', handleMapTouchEnd);
      if (titleClickTimer) clearTimeout(titleClickTimer);
    };
  });

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
    selectedPrefecture = event.detail.prefecture;
    isModalOpen = false;
    isRecordFormOpen = true;
  }

  function handleOpenRecordForm() {
    selectedPrefecture = null; // 都道府県未選択で開く
    editingRecord = null; // 新規作成モード
    isRecordFormOpen = true;
  }

  function handleRecordFormClose() {
    isRecordFormOpen = false;
    selectedPrefecture = null;
    editingRecord = null;
  }

  function handleRecordAdded(event: CustomEvent<{ record: any }>) {
    console.log('新しい記録が追加されました:', event.detail.record);
    // 統計データを更新してヒートマップに反映
    loadPrefectureStats();
    isRecordFormOpen = false;
    selectedPrefecture = null;
  }

  function handleOpenRecordList() {
    isRecordListOpen = true;
  }

  function handleRecordListClose() {
    isRecordListOpen = false;
  }

  function handleEditRecord(event: CustomEvent<{ record: GourmetRecord }>) {
    editingRecord = event.detail.record;
    selectedPrefecture = null;
    isRecordListOpen = false;
    isRecordFormOpen = true;
  }

  function handleRecordUpdated(event: CustomEvent<{ record: any }>) {
    console.log('記録が更新されました:', event.detail.record);
    // 統計データを更新してヒートマップに反映
    loadPrefectureStats();
    isRecordFormOpen = false;
    editingRecord = null;
  }

  function handleDeleteRecord(event: CustomEvent<{ record: GourmetRecord }>) {
    deletingRecord = event.detail.record;
    isDeleteDialogOpen = true;
  }

  async function handleDeleteConfirm() {
    if (!deletingRecord) return;

    isDeleting = true;

    try {
      const result = await deleteGourmetRecord(deletingRecord.id);
      
      if (result.success) {
        console.log('記録が削除されました:', deletingRecord.productName);
        // 統計データを更新してヒートマップに反映
        loadPrefectureStats();
        isDeleteDialogOpen = false;
        deletingRecord = null;
        
        // 記録一覧を自動更新するため、一度閉じて再開
        if (isRecordListOpen) {
          isRecordListOpen = false;
          setTimeout(() => {
            isRecordListOpen = true;
          }, 100);
        }
      } else {
        console.error('削除に失敗しました:', result.error);
        alert(`削除に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert(`削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      isDeleting = false;
    }
  }

  function handleDeleteCancel() {
    isDeleteDialogOpen = false;
    deletingRecord = null;
  }

  function handleOpenRoulette() {
    isRouletteOpen = true;
  }

  // ルーレット結果からの都道府県選択処理
  function handleRouletteResult(event: Event) {
    const customEvent = event as CustomEvent<{ prefecture: PrefectureData }>;
    selectedPrefecture = customEvent.detail.prefecture;
    isRouletteOpen = false;
    isModalOpen = true;
  }

  async function handleFirebaseTest() {
    testingConnection = true;
    connectionResult = null;
    
    try {
      const result = await testFirestoreConnection();
      connectionResult = result;
    } catch (error) {
      connectionResult = {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    } finally {
      testingConnection = false;
    }
  }

  // 統計情報の計算
  let totalCompleted = $derived(prefectureData.reduce((sum, p) => sum + p.completedCount, 0));
  let totalPurchased = $derived(prefectureData.reduce((sum, p) => sum + p.purchasedCount, 0));
  let completedPrefectures = $derived(prefectureData.filter(p => p.completedCount > 0).length);

</script>

<main class="app-container">
  <header class="app-header">
    <h1 class="app-title" onclick={handleTitleClick} role="button" tabindex="0">グルメジャーニー</h1>
    <p class="app-subtitle">全国47都道府県のご当地グルメお取り寄せ管理</p>
    
    {#if debugMode}
      <div class="debug-indicator">
        🔧 デバッグモード (Ctrl+Shift+D で切り替え)
      </div>
    {/if}
    
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
      <div class="map-controls">
        <button class="zoom-btn" onclick={handleZoomIn} title="拡大">🔍+</button>
        <button class="zoom-btn" onclick={handleZoomOut} title="縮小">🔍-</button>
        <button class="zoom-btn" onclick={handleZoomReset} title="リセット">⌂</button>
      </div>
      
      <div 
        class="map-container {mapZoom > 1 ? 'zoomed' : ''} {isDragging ? 'dragging' : ''}" 
        bind:this={mapContainer} 
        onmousedown={handleMapMouseDown}
        ontouchstart={handleMapTouchStart}
      >
        <JapanMap 
          {prefectureData}
          on:prefectureClick={handlePrefectureClick}
          on:prefectureHover={handlePrefectureHover}
        />
      </div>
      
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
        <button class="btn btn-accent" onclick={handleOpenRoulette}>
          🎲 ルーレット
        </button>
        <button class="btn btn-primary" onclick={handleOpenRecordForm}>
          📝 記録追加
        </button>
        <button class="btn btn-secondary-warm" onclick={handleOpenRecordList}>
          📊 記録一覧
        </button>
        
        {#if debugMode}
          <button class="btn {connectionResult?.success ? 'btn-success' : 'btn-warning'}" onclick={handleFirebaseTest} disabled={testingConnection}>
            {testingConnection ? '🔄 テスト中...' : '🔥 Firebase接続テスト'}
          </button>
          {#if connectionResult}
            <div class="connection-result {connectionResult.success ? 'success' : 'error'}">
              {connectionResult.success ? '✅ Firebase接続成功' : `❌ 接続失敗: ${connectionResult.error}`}
            </div>
          {/if}
        {/if}
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
    on:editRecord={handleEditRecord}
    on:deleteRecord={handleDeleteRecord}
  />

  <GourmetRecordForm 
    bind:isOpen={isRecordFormOpen}
    selectedPrefecture={selectedPrefecture}
    editingRecord={editingRecord}
    on:close={handleRecordFormClose}
    on:recordAdded={handleRecordAdded}
    on:recordUpdated={handleRecordUpdated}
  />

  <GourmetRecordList 
    bind:isOpen={isRecordListOpen}
    on:close={handleRecordListClose}
    on:editRecord={handleEditRecord}
    on:deleteRecord={handleDeleteRecord}
  />

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div onprefectureSelected={handleRouletteResult}>
    <RouletteModalV2 
      bind:isOpen={isRouletteOpen}
      {prefectureData}
    />
  </div>

  <DeleteConfirmDialog 
    bind:isOpen={isDeleteDialogOpen}
    record={deletingRecord}
    isDeleting={isDeleting}
    on:confirm={handleDeleteConfirm}
    on:cancel={handleDeleteCancel}
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
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }

  .app-title:hover {
    transform: scale(1.02);
    text-shadow: 0 3px 6px rgba(0,0,0,0.4);
  }

  .app-title:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 4px;
  }

  .debug-indicator {
    background: rgba(255, 255, 255, 0.2);
    color: #FFE0B2;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    animation: debugPulse 2s ease-in-out infinite;
  }

  @keyframes debugPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
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
    width: 140px;
    flex-shrink: 0;
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
    font-size: 0.85rem;
    opacity: 0.9;
    margin-top: 0.25rem;
    white-space: nowrap;
    font-weight: 500;
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

  .map-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
  }

  .zoom-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .zoom-btn:hover {
    background: rgba(255, 255, 255, 1);
    border-color: #bbb;
    transform: scale(1.05);
  }

  .zoom-btn:active {
    transform: scale(0.95);
  }

  .map-container {
    overflow: hidden;
    border-radius: 8px;
    position: relative;
    cursor: default;
  }

  .map-container :global(.japan-map-container) {
    transition: transform 0.3s ease;
    transform-origin: center center;
  }

  .map-container.zoomed {
    cursor: grab;
  }

  .map-container.dragging {
    cursor: grabbing;
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
    background: linear-gradient(135deg, #FFAB40 0%, #FF6F00 100%);
    color: var(--white);
    border: none;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #FF8F00 0%, #FF5722 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 143, 0, 0.3);
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

  .btn-secondary-warm {
    background: linear-gradient(135deg, #FFAB40 0%, #FF8F00 100%);
    color: var(--white);
    border: none;
  }

  .btn-secondary-warm:hover {
    background: linear-gradient(135deg, #FF8F00 0%, #FF6F00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }

  .btn-accent {
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
    color: var(--white);
    border: none;
    font-weight: 500;
  }

  .btn-accent:hover {
    background: linear-gradient(135deg, #FF9800 0%, #FF8F00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
  }

  .btn-warning {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
    color: var(--white);
  }

  .btn-warning:hover {
    background: linear-gradient(135deg, #F57C00 0%, #E65100 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }

  .btn-success {
    background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
    color: var(--white);
  }

  .btn-success:hover {
    background: linear-gradient(135deg, #388E3C 0%, #2E7D32 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }

  .connection-result {
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: center;
  }

  .connection-result.success {
    background: rgba(76, 175, 80, 0.1);
    color: #2E7D32;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .connection-result.error {
    background: rgba(244, 67, 54, 0.1);
    color: #C62828;
    border: 1px solid rgba(244, 67, 54, 0.3);
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
      width: 120px;
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
      width: 140px;
      max-width: 140px;
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
