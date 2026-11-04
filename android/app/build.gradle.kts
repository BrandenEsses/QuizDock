plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android { namespace = "dev.ble.quizdock"; compileSdk = 35
 defaultConfig { applicationId = "dev.ble.quizdock"; minSdk = 26; targetSdk = 35; versionCode = 3; versionName = "1.2-beta" }
 buildFeatures { buildConfig = true }
 defaultConfig { buildConfigField("String", "CAST_APP_ID", "\"" + (project.findProperty("castAppId") ?: "") + "\"") }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget = "17" }
}
dependencies { implementation("androidx.appcompat:appcompat:1.7.0"); implementation("com.google.android.gms:play-services-cast-framework:22.1.0") }
