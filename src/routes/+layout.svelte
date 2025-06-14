<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import { initializeFirebaseApp, getFirebaseStatus } from '$lib/stores/firebase.svelte';

  // Firebase初期化
  onMount(async () => {
    await initializeFirebaseApp();
    const status = getFirebaseStatus();
    
    if (!status.configured) {
      console.warn('⚠️ Firebase設定が見つかりません。.envファイルを設定してください。');
      console.warn('📝 設定方法: cp .env.example .env してFirebase設定を追加');
    }
  });
</script>

<slot></slot>