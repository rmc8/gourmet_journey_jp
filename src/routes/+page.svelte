<script lang="ts">
  import { onMount } from 'svelte';
  import JapanMap from '$lib/components/JapanMap.svelte';
  import PrefectureModal from '$lib/components/PrefectureModal.svelte';
  import RouletteModalV2 from '$lib/components/RouletteModalV2.svelte';
  import GourmetRecordForm from '$lib/components/GourmetRecordForm.svelte';
  import GourmetRecordList from '$lib/components/GourmetRecordList.svelte';
  import DeleteConfirmDialog from '$lib/components/DeleteConfirmDialog.svelte';
  import ToastNotification from '$lib/components/ToastNotification.svelte';
  import { getAllPrefectureData, type PrefectureData, type GourmetRecord } from '$lib/data/mockData';
  import { testFirestoreConnection, deleteGourmetRecord, getPrefectureStats, initializeFirebase } from '$lib/firebase/firestore';
  import type { PrefectureStats } from '$lib/firebase/types';
  import { getPlatformInfo } from '$lib/utils/linkOpener';
  import { logger } from '$lib/utils/logger';

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
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('success');
  let showToast = $state(false);
  
  // 統計データの読み込み状態
  let isLoadingStats = $state(false);
  let statsError = $state<string | null>(null);

  // デバッグモード管理
  let debugMode = $state(false);
  let titleClickCount = $state(0);
  let titleClickTimer: ReturnType<typeof setTimeout> | null = null;

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
      logger.log('📊 取得した統計データ:', statsData);

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

      logger.log('🗺️ 更新されたヒートマップデータ:', prefectureData);
      
    } catch (error) {
      logger.error('❌ 統計データの読み込みエラー:', error);
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
    logger.log(debugMode ? '🔧 デバッグモードを有効にしました' : '✅ デバッグモードを無効にしました');
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
   * タイトルキーボード操作
   */
  function handleTitleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTitleClick();
    }
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
    
    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (titleClickTimer) clearTimeout(titleClickTimer);
    };
  });

  function handlePrefectureClick(prefecture: PrefectureData) {
    logger.log('📋 メインページで都道府県クリックを受信:', prefecture.name);
    selectedPrefecture = prefecture;
    isModalOpen = true;
  }

  function handlePrefectureHover(prefecture: PrefectureData | null) {
    hoveredPrefecture = prefecture;
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
    logger.log('新しい記録が追加されました:', event.detail.record);
    
    // 成功通知を表示
    toastMessage = `「${event.detail.record.productName}」を追加しました`;
    toastType = 'success';
    showToast = true;
    
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
    logger.log('記録が更新されました:', event.detail.record);
    
    // 成功通知を表示
    toastMessage = `「${event.detail.record.productName}」を更新しました`;
    toastType = 'success';
    showToast = true;
    
    // 統計データを更新してヒートマップに反映
    loadPrefectureStats();
    isRecordFormOpen = false;
    editingRecord = null;
  }

  function handleDeleteRecord(event: CustomEvent<{ record: GourmetRecord }>) {
    // 都道府県モーダルから直接削除された場合は統計のみ更新
    // 他のリスト画面からの場合は削除確認ダイアログを表示
    const record = event.detail.record;
    
    // PrefectureModalからの削除の場合は統計更新のみ
    if (isModalOpen) {
      loadPrefectureStats(); // ヒートマップ更新
      return;
    }
    
    // 他の画面からの削除確認
    deletingRecord = record;
    isDeleteDialogOpen = true;
  }

  async function handleDeleteConfirm() {
    if (!deletingRecord) return;

    isDeleting = true;

    try {
      const result = await deleteGourmetRecord(deletingRecord.id);
      
      if (result.success) {
        logger.log('記録が削除されました:', deletingRecord.productName);
        
        // 成功通知を表示
        toastMessage = `「${deletingRecord.productName}」を削除しました`;
        toastType = 'success';
        showToast = true;
        
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
        logger.error('削除に失敗しました:', result.error);
        toastMessage = `削除に失敗しました: ${result.error}`;
        toastType = 'error';
        showToast = true;
      }
    } catch (error) {
      logger.error('削除エラー:', error);
      toastMessage = `削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
      toastType = 'error';
      showToast = true;
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

  function handlePlatformTest() {
    const platformInfo = getPlatformInfo();
    alert(`プラットフォーム情報:
Platform: ${platformInfo.platform}
Tauri: ${platformInfo.isTauri ? 'Yes' : 'No'}
Touch: ${platformInfo.isTouch ? 'Yes' : 'No'}
UserAgent: ${platformInfo.userAgent}`);
  }

  // 統計情報の計算
  let totalCompleted = $derived(prefectureData.reduce((sum, p) => sum + p.completedCount, 0));
  let totalPurchased = $derived(prefectureData.reduce((sum, p) => sum + p.purchasedCount, 0));
  let completedPrefectures = $derived(prefectureData.filter(p => p.completedCount > 0).length);

</script>

<main class="app-container">
  <header class="app-header">
    <div class="header-top">
      <img src="/logo/logo.png" alt="グルメジャーニー" class="app-logo" />
      <div class="title-section">
        <button class="app-title" onclick={handleTitleClick} onkeydown={handleTitleKeyDown}>グルメジャーニー</button>
        <p class="app-subtitle">全国47都道府県のご当地グルメお取り寄せ管理</p>
      </div>
    </div>
    
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
      <div class="map-container">
        <JapanMap 
          {prefectureData}
          onPrefectureClick={handlePrefectureClick}
          onPrefectureHover={handlePrefectureHover}
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
          <button class="btn btn-info" onclick={handlePlatformTest}>
            🔍 プラットフォーム情報
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

  <RouletteModalV2 
    bind:isOpen={isRouletteOpen}
    {prefectureData}
    on:prefectureSelected={handleRouletteResult}
  />

  <DeleteConfirmDialog 
    bind:isOpen={isDeleteDialogOpen}
    record={deletingRecord}
    isDeleting={isDeleting}
    on:confirm={handleDeleteConfirm}
    on:cancel={handleDeleteCancel}
  />

  <ToastNotification 
    message={toastMessage} 
    type={toastType} 
    bind:visible={showToast} 
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

  .header-top {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .app-logo {
    height: 60px;
    width: auto;
    border-radius: 8px;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .app-logo:hover {
    transform: scale(1.05);
  }

  .title-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .app-title {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    /* ボタン要素のデフォルトスタイルをリセット */
    background: transparent;
    border: none;
    color: var(--white);
    padding: 0;
    font-family: inherit;
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
    margin: 0;
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


  .map-container {
    border-radius: 8px;
    position: relative;
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

  .btn-info {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: var(--white);
  }

  .btn-info:hover {
    background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
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

    .header-top {
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .app-logo {
      height: 50px;
    }

    .title-section {
      align-items: center;
      text-align: center;
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
