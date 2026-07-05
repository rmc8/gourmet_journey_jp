import { openUrl } from '@tauri-apps/plugin-opener';
import { logger } from './logger';

/**
 * プラットフォーム検出
 */
function getPlatform(): 'tauri' | 'web' | 'mobile' {
  // デバッグ情報をコンソールに出力
  logger.log('🔍 プラットフォーム検出開始...');
  logger.log('window.__TAURI__:', typeof window !== 'undefined' ? typeof window.__TAURI__ : 'undefined');
  
  // Tauriアプリケーション内かどうか確認（複数の方法で検出）
  if (typeof window !== 'undefined') {
    // 主要なTauri検出方法
    if (window.__TAURI__ || (window as any).__TAURI_INTERNALS__) {
      logger.log('✅ Tauriプラットフォーム検出');
      return 'tauri';
    }
    
    // UserAgentでもTauriを確認
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('tauri')) {
        logger.log('✅ UserAgentからTauriプラットフォーム検出');
        return 'tauri';
      }
    }
  }
  
  // モバイルブラウザかどうか確認
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      logger.log('📱 モバイルプラットフォーム検出');
      return 'mobile';
    }
  }
  
  logger.log('🌐 Webプラットフォーム検出');
  return 'web';
}

/**
 * 外部リンクを開く（プラットフォーム別の最適化）
 * @param url 開くURL
 * @param fallbackMessage フォールバック時のメッセージ
 */
export async function openExternalLink(url: string, fallbackMessage?: string): Promise<void> {
  const platform = getPlatform();
  
  // セキュリティ対策: URLからクエリパラメータやパスを排してホスト名のみをログ出力する
  let safeUrlStr = 'unknown';
  try {
    safeUrlStr = new URL(url).hostname;
  } catch (_) {
    // パースに失敗した場合はそのまま非公開
  }
  logger.log(`🔗 外部リンクを開きます: ${safeUrlStr} (Platform: ${platform})`);
  
  try {
    switch (platform) {
      case 'tauri':
        // Tauri デスクトップアプリ (Mac, Windows, Linux)
        logger.log('🚀 Tauri openUrl() を使用してリンクを開きます');
        await openUrl(url);
        logger.log('✅ Tauri openUrl() 成功');
        break;
        
      case 'mobile':
        // モバイルブラウザ (iOS Safari, Android Chrome等)
        // モバイルではポップアップブロッカーが厳しいため、直接リンク開く
        logger.log('📱 モバイル: window.location.href でリンクを開きます');
        window.location.href = url;
        break;
        
      case 'web':
      default:
        // Webブラウザ (デスクトップ) または Tauri検出失敗時のフォールバック
        logger.log('🌐 Web: window.open() でリンクを開きます');
        
        // Tauri検出に失敗した可能性があるため、openUrl()も試す
        if (typeof window !== 'undefined' && window.__TAURI__) {
          logger.log('🔄 Tauri検出リトライ: openUrl() を試行');
          try {
            await openUrl(url);
            logger.log('✅ リトライ成功: Tauri openUrl() で開きました');
            return;
          } catch (tauriError) {
            logger.warn('⚠️ Tauri openUrl() リトライ失敗:', tauriError);
          }
        }
        
        // 通常のWeb方式
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          throw new Error('ポップアップがブロックされました');
        }
        logger.log('✅ window.open() 成功');
        break;
    }
  } catch (error) {
    logger.warn('❌ 外部リンクを開けませんでした:', error);
    
    // フォールバック処理
    try {
      // クリップボードにコピーを試す
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        alert(fallbackMessage || `リンクをクリップボードにコピーしました:\n${url}\n\nブラウザで手動で開いてください。`);
      } else {
        // クリップボードAPIが使えない場合
        prompt(
          fallbackMessage || 'リンクを手動でコピーしてブラウザで開いてください:',
          url
        );
      }
    } catch (clipboardError) {
      // 最終フォールバック
      logger.error('クリップボードコピーも失敗:', clipboardError);
      alert(`外部リンクを開けませんでした。手動でアクセスしてください:\n${url}`);
    }
  }
}

/**
 * 検索サービス固有のリンクオープナー
 * @param service サービス名
 * @param url URL
 */
export async function openSearchLink(
  service: 'yahoo' | 'rakuten' | 'perplexity', 
  url: string
): Promise<void> {
  const serviceNames = {
    yahoo: 'Yahoo!ショッピング',
    rakuten: '楽天市場',
    perplexity: 'Perplexity'
  };
  
  const serviceName = serviceNames[service];
  const fallbackMessage = `${serviceName}のリンクをクリップボードにコピーしました:\n${url}\n\nブラウザで手動で開いてください。`;
  
  await openExternalLink(url, fallbackMessage);
}

/**
 * プラットフォーム情報を取得（デバッグ用）
 */
export function getPlatformInfo(): {
  platform: 'tauri' | 'web' | 'mobile';
  userAgent: string;
  isTauri: boolean;
  isTouch: boolean;
} {
  const platform = getPlatform();
  
  return {
    platform,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    isTauri: typeof window !== 'undefined' && Boolean(window.__TAURI__),
    isTouch: typeof window !== 'undefined' && 'ontouchstart' in window
  };
}