package dev.ble.quizdock

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.JavascriptInterface
import android.widget.LinearLayout
import android.widget.Button
import android.widget.Toast
import android.widget.FrameLayout
import android.widget.TextView
import android.view.Gravity
import android.view.View
import android.graphics.Color
import android.graphics.Typeface
import androidx.appcompat.app.AppCompatActivity
import androidx.mediarouter.app.MediaRouteButton
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.SessionManagerListener
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private lateinit var landing: LinearLayout
    private lateinit var bar: LinearLayout
    private lateinit var content: FrameLayout
    private var room: String? = null
    private val namespace = "urn:x-cast:dev.ble.quizdock"
    private val castListener = object : SessionManagerListener<CastSession> {
        override fun onSessionStarted(session: CastSession, sessionId: String) = sendRoom(session)
        override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) = sendRoom(session)
        override fun onSessionStarting(session: CastSession) {}
        override fun onSessionStartFailed(session: CastSession, error: Int) {}
        override fun onSessionEnding(session: CastSession) {}
        override fun onSessionEnded(session: CastSession, error: Int) {}
        override fun onSessionResuming(session: CastSession, sessionId: String) {}
        override fun onSessionResumeFailed(session: CastSession, error: Int) {}
        override fun onSessionSuspended(session: CastSession, reason: Int) {}
    }
    private fun sendRoom(session: CastSession? = CastContext.getSharedInstance(this).sessionManager.currentCastSession) {
        val code = room ?: return
        if (session?.isConnected != true) return
        val message = JSONObject().put("type", "room").put("code", code).toString()
        session.sendMessage(namespace, message).setResultCallback { result ->
            if (!result.status.isSuccess) runOnUiThread { Toast.makeText(this, "Cast receiver did not accept the room", Toast.LENGTH_LONG).show() }
        }
    }
    inner class Bridge {
        @JavascriptInterface fun roomChanged(code: String) {
            if (!Regex("^[0-9]{6}$").matches(code)) return
            runOnUiThread { if (room != code) { room = code; sendRoom() } }
        }
    }
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // The root respects Android system bars; the role picker is centered in the usable area.
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            fitsSystemWindows = true
            setBackgroundColor(Color.rgb(15, 23, 42))
        }
        bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            visibility = View.GONE
            setPadding(dp(12), dp(6), dp(12), dp(6))
        }
        val castButton = MediaRouteButton(this)
        bar.addView(castButton, LinearLayout.LayoutParams(dp(56), dp(52)))
        bar.addView(Button(this).apply { text = "Roles"; setOnClickListener { showLanding() } })
        layout.addView(bar, LinearLayout.LayoutParams(-1, -2))
        content = FrameLayout(this)
        layout.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
        landing = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(20), dp(28), dp(20))
        }
        val title = TextView(this).apply {
            text = "QuizDock"
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        landing.addView(title, LinearLayout.LayoutParams(-1, -2))
        landing.addView(TextView(this).apply {
            text = "How would you like to play?"
            textSize = 17f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, dp(68)))
        fun roleButton(label: String, action: () -> Unit) {
            val button = Button(this).apply {
                text = label
                textSize = 17f
                isAllCaps = false
                minHeight = dp(58)
                setOnClickListener { action() }
            }
            landing.addView(button, LinearLayout.LayoutParams(-1, dp(64)).apply {
                bottomMargin = dp(12)
            })
        }
        roleButton("Host a Game") { openGame() }
        roleButton("Join as Player") { openGame() }
        roleButton("Watch as Spectator") { promptSpectator() }
        content.addView(landing, FrameLayout.LayoutParams(-1, -1))
        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.addJavascriptInterface(Bridge(), "QuizDockAndroid")
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                val code = Regex("/display/([0-9]{6})").find(url)?.groupValues?.get(1)
                if (code != null) { room = code; sendRoom() }
                view.evaluateJavascript("""(function(){if(window.__qdNativeHook)return;window.__qdNativeHook=true;setInterval(function(){try{if(typeof state!=='undefined'&&state&&state.code&&window.__qdLastRoom!==String(state.code)){window.__qdLastRoom=String(state.code);QuizDockAndroid.roomChanged(window.__qdLastRoom);}}catch(e){}},1000)})()""", null)
            }
        }
        web.webChromeClient = WebChromeClient()
        content.addView(web, FrameLayout.LayoutParams(-1, -1))
        web.visibility = View.GONE
        setContentView(layout)
        if (BuildConfig.CAST_APP_ID.isNotBlank()) {
            CastButtonFactory.setUpMediaRouteButton(applicationContext, castButton)
            CastContext.getSharedInstance(this).sessionManager.addSessionManagerListener(castListener, CastSession::class.java)
        } else { castButton.visibility = android.view.View.GONE }
        // Android 13+ may require Nearby Wi-Fi Devices permission for local Cast discovery.
        // Request it explicitly so users can grant discovery access.
        val needed = if (Build.VERSION.SDK_INT >= 33) arrayOf(Manifest.permission.NEARBY_WIFI_DEVICES)
                     else arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
        val missing = needed.filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isNotEmpty()) ActivityCompat.requestPermissions(this, missing.toTypedArray(), 104)
        // Stay on the centered native role selection until the user picks a role.
    }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density + 0.5f).toInt()

    private fun openGame() {
        landing.visibility = View.GONE
        bar.visibility = View.VISIBLE
        web.visibility = View.VISIBLE
        web.loadUrl("https://quizdock.ble.dev/")
    }

    private fun showLanding() {
        web.visibility = View.GONE
        bar.visibility = View.GONE
        landing.visibility = View.VISIBLE
    }

    private fun promptSpectator() {
        val input = android.widget.EditText(this).apply {
            hint = "6-digit room code"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(android.text.InputFilter.LengthFilter(6))
        }
        val holder = FrameLayout(this).apply { setPadding(dp(20), 0, dp(20), 0) }
        holder.addView(input, FrameLayout.LayoutParams(-1, -2))
        android.app.AlertDialog.Builder(this)
            .setTitle("Watch a game")
            .setView(holder)
            .setPositiveButton("Watch") { _, _ ->
                val code = input.text.toString().trim()
                if (Regex("^[0-9]{6}$").matches(code)) {
                    room = code
                    landing.visibility = View.GONE
                    bar.visibility = View.VISIBLE
                    web.visibility = View.VISIBLE
                    web.loadUrl("https://quizdock.ble.dev/display/$code")
                    sendRoom()
                } else Toast.makeText(this, "Enter a 6-digit code", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroy() {
        if (BuildConfig.CAST_APP_ID.isNotBlank()) CastContext.getSharedInstance(this).sessionManager.removeSessionManagerListener(castListener, CastSession::class.java)
        web.destroy()
        super.onDestroy()
    }
    override fun onBackPressed() { if (landing.visibility == View.VISIBLE) super.onBackPressed() else if (web.canGoBack()) web.goBack() else showLanding() }
}
