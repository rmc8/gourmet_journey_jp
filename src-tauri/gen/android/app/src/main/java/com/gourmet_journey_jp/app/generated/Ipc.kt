/* THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!! */

// Copyright 2020-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

@file:Suppress("unused")

package com.gourmet_journey_jp.app

import android.webkit.*

class Ipc(val webViewClient: RustWebViewClient) {
    @JavascriptInterface
    fun postMessage(message: String?) {
        message?.let {m ->
            // we're not using WebView::getUrl() here because it needs to be executed on the main thread
            // and it would slow down the Ipc
            // so instead we track the current URL on the webview client
            this.ipc(webViewClient.currentUrl, m)
        }
    }

    companion object {
        init {
            System.loadLibrary("gourmet_journey_jp_lib")
        }
    }

    private external fun ipc(url: String, message: String)

    
}
