<script lang="ts">
  import { onMount } from 'svelte';
  import type { PrefectureData } from '../data/mockData';
  import { getHeatmapColor, getHoverColor, getSelectedColor } from '../utils/heatmapColors';

  interface Props {
    prefectureData: PrefectureData[];
    onPrefectureClick?: (prefecture: PrefectureData) => void;
    onPrefectureHover?: (prefecture: PrefectureData | null) => void;
  }

  let { 
    prefectureData = [],
    onPrefectureClick,
    onPrefectureHover
  }: Props = $props();

  let svgContainer: HTMLDivElement;
  let hoveredPrefecture: string | null = null;
  let selectedPrefecture: string | null = null;

  const prefectureMap: Record<string, string> = {
    '01': 'hokkaido', '02': 'aomori', '03': 'iwate', '04': 'miyagi', '05': 'akita',
    '06': 'yamagata', '07': 'fukushima', '08': 'ibaraki', '09': 'tochigi', '10': 'gunma',
    '11': 'saitama', '12': 'chiba', '13': 'tokyo', '14': 'kanagawa', '15': 'niigata',
    '16': 'toyama', '17': 'ishikawa', '18': 'fukui', '19': 'yamanashi', '20': 'nagano',
    '21': 'gifu', '22': 'shizuoka', '23': 'aichi', '24': 'mie', '25': 'shiga',
    '26': 'kyoto', '27': 'osaka', '28': 'hyogo', '29': 'nara', '30': 'wakayama',
    '31': 'tottori', '32': 'shimane', '33': 'okayama', '34': 'hiroshima', '35': 'yamaguchi',
    '36': 'tokushima', '37': 'kagawa', '38': 'ehime', '39': 'kochi', '40': 'fukuoka',
    '41': 'saga', '42': 'nagasaki', '43': 'kumamoto', '44': 'oita', '45': 'miyazaki',
    '46': 'kagoshima', '47': 'okinawa'
  };

  function getPrefectureByDataCode(dataCode: string): PrefectureData | undefined {
    const prefectureId = prefectureMap[dataCode];
    return prefectureData.find(p => p.id === prefectureId);
  }

  function handlePrefectureClick(prefecture: PrefectureData) {
    console.log('🗺️ 都道府県がクリックされました:', prefecture.name);
    selectedPrefecture = prefecture.id;
    onPrefectureClick?.(prefecture);
    
    updatePrefectureStyles();
  }

  function handlePrefectureMouseEnter(prefecture: PrefectureData) {
    hoveredPrefecture = prefecture.id;
    onPrefectureHover?.(prefecture);
    updatePrefectureStyles();
  }

  function handlePrefectureMouseLeave() {
    hoveredPrefecture = null;
    onPrefectureHover?.(null);
    updatePrefectureStyles();
  }

  function getPrefectureStyle(prefecture: PrefectureData) {
    if (selectedPrefecture === prefecture.id) {
      return getSelectedColor();
    } else if (hoveredPrefecture === prefecture.id) {
      return getHoverColor(prefecture.completedCount);
    } else {
      return getHeatmapColor(prefecture.completedCount);
    }
  }

  function updatePrefectureStyles() {
    if (!svgContainer) return;
    
    const prefectureElements = svgContainer.querySelectorAll('[data-code]');
    prefectureElements.forEach(element => {
      const dataCode = element.getAttribute('data-code');
      if (dataCode) {
        const prefecture = getPrefectureByDataCode(dataCode);
        if (prefecture) {
          const style = getPrefectureStyle(prefecture);
          element.setAttribute('fill', style.fill);
          element.setAttribute('stroke', style.stroke);
          element.setAttribute('stroke-width', style.strokeWidth.toString());
        }
      }
    });
  }

  onMount(async () => {
    try {
      console.log('🗾 日本地図の読み込み開始...');
      console.log('📊 prefectureData:', prefectureData);
      
      // Load the SVG content from local file first, fallback to external URL
      let response: Response;
      try {
        response = await fetch('/japan-map.svg');
        if (!response.ok) {
          throw new Error(`Local SVG not found: ${response.status}`);
        }
        console.log('✅ ローカルSVGファイルを読み込みました');
      } catch (localError) {
        console.warn('⚠️ ローカルSVGの読み込みに失敗、外部URLを試行:', localError);
        response = await fetch('https://raw.githubusercontent.com/geolonia/japanese-prefectures/master/map-mobile.svg');
        if (!response.ok) {
          throw new Error(`External SVG fetch failed: ${response.status}`);
        }
        console.log('✅ 外部SVGファイルを読み込みました');
      }
      
      const svgContent = await response.text();
      
      if (!svgContent || svgContent.trim().length === 0) {
        throw new Error('SVG content is empty');
      }
      
      // Insert the SVG content
      svgContainer.innerHTML = svgContent;
      console.log('✅ SVGコンテンツを挿入しました');
      
      // 既存の都道府県要素を準備
      const prefectureElements = svgContainer.querySelectorAll('[data-code]');
      console.log(`🏷️ 都道府県要素を${prefectureElements.length}個発見しました`);
      
      // 各要素にスタイルとアクセシビリティ属性を設定
      prefectureElements.forEach((element) => {
        const dataCode = element.getAttribute('data-code');
        if (dataCode) {
          const prefecture = getPrefectureByDataCode(dataCode);
          if (prefecture) {
            element.classList.add('prefecture');
            element.setAttribute('role', 'button');
            element.setAttribute('tabindex', '0');
            element.setAttribute('aria-label', prefecture.name);
            
            // 直接スタイルを注入してタッチ可能にする
            (element as SVGElement).style.cursor = 'pointer';
            (element as SVGElement).style.pointerEvents = 'all';
            (element as SVGElement).style.touchAction = 'manipulation';
          }
        }
      });
      
      // イベント委譲パターン: SVGコンテナ全体で1つのイベントリスナー
      const handleContainerEvent = (e: Event) => {
        const target = e.target as Element;
        
        // data-code属性を持つ要素、またはその親要素を探す
        let prefectureElement = target.closest('[data-code]');
        
        if (prefectureElement) {
          const dataCode = prefectureElement.getAttribute('data-code');
          if (dataCode) {
            const prefecture = getPrefectureByDataCode(dataCode);
            if (prefecture) {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎯 イベント委譲でキャッチ:', prefecture.name, 'イベントタイプ:', e.type);
              handlePrefectureClick(prefecture);
            }
          }
        }
      };
      
      // SVGコンテナにイベントリスナーを設定（委譲パターン）
      svgContainer.addEventListener('click', handleContainerEvent, { passive: false });
      svgContainer.addEventListener('touchend', handleContainerEvent, { passive: false });
      svgContainer.addEventListener('pointerup', handleContainerEvent, { passive: false });
      
      // ホバー効果用のイベント委譲
      svgContainer.addEventListener('mouseover', (e: Event) => {
        const target = e.target as Element;
        const prefectureElement = target.closest('[data-code]');
        
        if (prefectureElement) {
          const dataCode = prefectureElement.getAttribute('data-code');
          if (dataCode) {
            const prefecture = getPrefectureByDataCode(dataCode);
            if (prefecture) {
              handlePrefectureMouseEnter(prefecture);
            }
          }
        }
      });
      
      svgContainer.addEventListener('mouseout', (e: Event) => {
        handlePrefectureMouseLeave();
      });
      
      console.log('🎨 イベント委譲パターンを設定しました');
      
      // Apply initial styles
      updatePrefectureStyles();
      console.log('🎨 初期スタイルを適用しました');
      
    } catch (error) {
      console.error('❌ 日本地図の読み込みに失敗:', error);
      
      // Fallback: 簡単な都道府県リスト表示
      const fallbackHtml = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          <h3>🗾 地図の読み込みに失敗しました</h3>
          <p>エラー: ${error instanceof Error ? error.message : '不明なエラー'}</p>
          <p>代替として都道府県リストを表示します:</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 1rem;">
            ${prefectureData.map(pref => `
              <button 
                onclick="handleFallbackClick('${pref.id}')" 
                style="
                  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
                  color: white;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 0.9rem;
                "
              >
                ${pref.name}
              </button>
            `).join('')}
          </div>
          <button onclick="location.reload()" style="
            background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 2rem;
            font-size: 1rem;
          ">🔄 地図を再読み込み</button>
        </div>
      `;
      
      svgContainer.innerHTML = fallbackHtml;
      
      // フォールバック用のクリックハンドラーをグローバルに設定
      (window as any).handleFallbackClick = (prefectureId: string) => {
        const prefecture = prefectureData.find(p => p.id === prefectureId);
        if (prefecture && onPrefectureClick) {
          onPrefectureClick(prefecture);
        }
      };
    }
  });

  // Update styles when prefecture data changes
  $effect(() => {
    if (prefectureData && svgContainer) {
      updatePrefectureStyles();
    }
  });
</script>

<div class="japan-map-container">
  <div bind:this={svgContainer} class="svg-container"></div>
</div>

<style>
  .japan-map-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    min-height: 400px;
  }

  .svg-container {
    width: 100%;
    height: auto;
    max-width: 600px;
    max-height: 800px;
    /* タッチイベントを確実に受け取るための設定 */
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  :global(.svg-container svg) {
    width: 100%;
    height: auto;
  }

  :global(.prefecture) {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(255, 152, 0, 0.3);
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    pointer-events: auto !important;
    fill-opacity: 1;
    stroke-opacity: 1;
  }

  :global(.prefecture:hover) {
    filter: brightness(1.1);
  }

  :global(.prefecture:focus) {
    outline: 2px solid #FF5722;
    outline-offset: 2px;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .japan-map-container {
      min-height: 300px;
    }
    
    .svg-container {
      max-width: 400px;
      max-height: 600px;
    }
  }
</style>