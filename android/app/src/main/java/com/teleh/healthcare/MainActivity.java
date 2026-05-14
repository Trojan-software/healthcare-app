package com.teleh.healthcare;

import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.teleh.healthcare.security.SecurityManager;

public class MainActivity extends BridgeActivity {

    private SecurityManager securityManager;

    static {
        // ADHCC Finding 5.4 (WebView Exploits) — disable WebView remote debugging
        // globally at class-load time, before any WebView instance is created.
        // Applies to ALL WebViews in the process.
        WebView.setWebContentsDebuggingEnabled(false);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        securityManager = SecurityManager.getInstance(this);

        registerPlugin(HC03BluetoothPlugin.class);
        registerPlugin(SecurityPlugin.class);

        performSecurityChecks();

        applySecurityProtections();

        scheduleWebViewSecurityConfig();
    }

    private void performSecurityChecks() {
        if (securityManager.isRooted()) {
            showSecurityWarning("Device appears to be rooted. Some features may be restricted.");
        }

        if (securityManager.isHookingFrameworkDetected()) {
            showSecurityWarning("Security framework detected. App functionality may be limited.");
        }

        if (securityManager.isDeveloperOptionsEnabled()) {
            showSecurityWarning("Developer options are enabled. Please disable them for full security protection.");
        }

        if (securityManager.isAdbEnabled()) {
            showSecurityWarning("USB debugging (ADB) is enabled. Disable it when not developing to keep your data safe.");
        }
    }

    private void applySecurityProtections() {
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        enableTapjackingProtection();
    }

    private void scheduleWebViewSecurityConfig() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.post(this::configureSecureWebView);
            }
        } catch (Exception e) {
        }
    }

    private void configureSecureWebView() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;

            WebSettings settings = webView.getSettings();

            // ADHCC Finding 8.1 (CORS/File access) — disable all local file access
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);

            // ADHCC Finding 5.4 (WebView Exploits) — Safe Browsing + strict mixed content
            settings.setSafeBrowsingEnabled(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setMediaPlaybackRequiresUserGesture(true);

            // Privacy hardening
            settings.setGeolocationEnabled(false);
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            settings.setSaveFormData(false);
            settings.setSavePassword(false);

            // ADHCC Finding 3.9 (Keylogger Protection) — handled via JS injection
            // in SecureWebViewClient.onPageFinished() which sets autocomplete="off",
            // spellcheck="false", and data-lpignore="true" on all input elements.

            webView.setWebViewClient(new SecureWebViewClient());

            webView.setFilterTouchesWhenObscured(true);

        } catch (Exception e) {
        }
    }

    private void enableTapjackingProtection() {
        View rootView = getWindow().getDecorView().getRootView();
        if (rootView != null) {
            rootView.setFilterTouchesWhenObscured(true);
        }
    }

    private void showSecurityWarning(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        applySecurityProtections();
        scheduleWebViewSecurityConfig();
    }

    /**
     * SecureWebViewClient
     *
     * ADHCC Finding 5.9  — App Extending WebViewClient: cancels SSL errors (never proceeds).
     * ADHCC Finding 3.9  — Keylogger Protection: on every page load, injects a script that:
     *   1. Sets autocomplete="off" + spellcheck="false" on all existing input/textarea fields.
     *   2. Installs a MutationObserver so dynamically-added fields get the same treatment.
     *   This prevents the system keyboard and third-party IMEs from persisting typed content
     *   or sending it to cloud suggestion services.
     */
    private static class SecureWebViewClient extends WebViewClient {

        private static final String KEYLOGGER_PROTECTION_JS =
            "(function() {" +
            "  function secureInput(el) {" +
            "    el.setAttribute('autocomplete', 'off');" +
            "    el.setAttribute('autocorrect', 'off');" +
            "    el.setAttribute('autocapitalize', 'off');" +
            "    el.setAttribute('spellcheck', 'false');" +
            "    el.setAttribute('data-lpignore', 'true');" +
            "  }" +
            "  function secureAllInputs() {" +
            "    document.querySelectorAll('input, textarea').forEach(secureInput);" +
            "  }" +
            "  secureAllInputs();" +
            "  var observer = new MutationObserver(function(mutations) {" +
            "    mutations.forEach(function(m) {" +
            "      m.addedNodes.forEach(function(node) {" +
            "        if (node.nodeType === 1) {" +
            "          if (node.matches && node.matches('input, textarea')) {" +
            "            secureInput(node);" +
            "          }" +
            "          node.querySelectorAll && node.querySelectorAll('input, textarea').forEach(secureInput);" +
            "        }" +
            "      });" +
            "    });" +
            "  });" +
            "  observer.observe(document.body || document.documentElement," +
            "    { childList: true, subtree: true });" +
            "})();";

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            // ADHCC Finding 5.9 — NEVER call handler.proceed(); always cancel.
            handler.cancel();
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            // ADHCC Finding 3.9 — inject keylogger protection after every page load
            view.evaluateJavascript(KEYLOGGER_PROTECTION_JS, null);
        }
    }
}
