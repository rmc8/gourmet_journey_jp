<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { PrefectureData } from '../data/mockData';
  import { getHeatmapColor, getHoverColor, getSelectedColor } from '../utils/heatmapColors';

  export let prefectureData: PrefectureData[] = [];
  
  const dispatch = createEventDispatcher<{
    prefectureClick: { prefecture: PrefectureData };
    prefectureHover: { prefecture: PrefectureData | null };
  }>();

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
    selectedPrefecture = prefecture.id;
    dispatch('prefectureClick', { prefecture });
    updatePrefectureStyles();
  }

  function handlePrefectureMouseEnter(prefecture: PrefectureData) {
    hoveredPrefecture = prefecture.id;
    dispatch('prefectureHover', { prefecture });
    updatePrefectureStyles();
  }

  function handlePrefectureMouseLeave() {
    hoveredPrefecture = null;
    dispatch('prefectureHover', { prefecture: null });
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
      
      // Add event listeners to all prefecture elements
      const prefectureElements = svgContainer.querySelectorAll('[data-code]');
      console.log(`🏷️ 都道府県要素を${prefectureElements.length}個発見しました`);
      
      prefectureElements.forEach(element => {
        const dataCode = element.getAttribute('data-code');
        if (dataCode) {
          const prefecture = getPrefectureByDataCode(dataCode);
          if (prefecture) {
            // Add CSS classes for styling
            element.classList.add('prefecture');
            element.setAttribute('role', 'button');
            element.setAttribute('tabindex', '0');
            element.setAttribute('aria-label', prefecture.name);
            
            // Add event listeners
            element.addEventListener('click', () => handlePrefectureClick(prefecture));
            element.addEventListener('mouseenter', () => handlePrefectureMouseEnter(prefecture));
            element.addEventListener('mouseleave', handlePrefectureMouseLeave);
            element.addEventListener('keydown', (e) => {
              const keyEvent = e as KeyboardEvent;
              if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                keyEvent.preventDefault();
                handlePrefectureClick(prefecture);
              }
            });
          }
        }
      });
      
      // Apply initial styles
      updatePrefectureStyles();
      console.log('🎨 初期スタイルを適用しました');
      
    } catch (error) {
      console.error('❌ 日本地図の読み込みに失敗:', error);
      // Fallback: show a more informative message with retry option
      svgContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          <h3>🗾 地図の読み込みに失敗しました</h3>
          <p>エラー: ${error instanceof Error ? error.message : '不明なエラー'}</p>
          <button onclick="location.reload()" style="
            background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 1rem;
          ">🔄 再読み込み</button>
        </div>
      `;
    }
  });

  // Update styles when prefecture data changes
  $: if (prefectureData && svgContainer) {
    console.log('🔄 都道府県データが更新されました:', prefectureData.length);
    updatePrefectureStyles();
  }
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
  }

  :global(.svg-container svg) {
    width: 100%;
    height: auto;
  }

  :global(.prefecture) {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  :global(.prefecture:hover) {
    filter: brightness(1.1);
  }

  :global(.prefecture:focus) {
    outline: 2px solid #2196F3;
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