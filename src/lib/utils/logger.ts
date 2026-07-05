/**
 * アプリケーション共通ロガー
 * 開発環境 (import.meta.env.DEV) またはデバッグモード (gourmet-journey-debug) 有効時のみコンソールにログを出力します。
 * セキュリティとプライバシーを確保するため、本番環境での情報漏洩を防止します。
 */

const isDebugEnabled = (): boolean => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('gourmet-journey-debug') === 'true';
  }
  return false;
};

const shouldLog = (): boolean => {
  // 開発環境であるか、明示的にデバッグモードがONになっている場合
  return (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || isDebugEnabled();
};

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (shouldLog()) {
      console.log(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (shouldLog()) {
      console.info(message, ...args);
    }
  },
  // 警告やエラーは監視のために常に本番環境でも出力する
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  }
};
