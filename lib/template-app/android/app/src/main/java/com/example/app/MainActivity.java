package com.example.app; // This will be updated by the Python script

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.view.WindowManager;
import android.net.Uri;
import android.content.Intent;
import android.os.Build; // Import Build class

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if ({{FULLSCREEN}}) {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                 WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        setContentView(R.layout.activity_main); // Make sure you have an activity_main.xml layout with a WebView ID

        webView = findViewById(R.id.webview);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled({{ENABLE_JS}});
        webSettings.setAllowFileAccess({{ALLOW_FILE_ACCESS}});

        // --- REMOVE OR COMMENT OUT THESE LINES IF TARGETING API 33+ ---
        // These methods are deprecated and removed in modern Android APIs (e.g., API 33+)
        // They cause compilation errors when compileSdk is 33 or higher.
        // If you specifically need AppCache, DOM Storage, or Database features,
        // you would need to implement them using alternative, modern APIs
        // or conditionally apply them only for older SDK versions (e.g., Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU)
        // webSettings.setDomStorageEnabled({{DOM_STORAGE_ENABLED}});
        // webSettings.setDatabaseEnabled({{DATABASE_ENABLED}});
        // webSettings.setAppCacheEnabled({{APP_CACHE_ENABLED}});
        // --- END REMOVAL/COMMENT ---

        webSettings.setBuiltInZoomControls({{BUILT_IN_ZOOM_CONTROLS}});
        webSettings.setSupportZoom({{SUPPORT_ZOOM}});

        // Custom User Agent (if provided)
        String userAgent = "{{USER_AGENT}}";
        if (!userAgent.isEmpty()) {
            webSettings.setUserAgentString(userAgent);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // For simplicity, always load in internal WebView for now.
                // You can add logic here to open external URLs in a browser if needed.
                return false;
            }
        });

        webView.loadUrl("{{URL}}");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}