package com.tibetskayaclientapp

import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Экран звонка поверх экрана блокировки (см. IncomingCallLockScreen) и системные настройки,
 * без которых входящий на заблокированном телефоне приходит обычным уведомлением.
 */
class CallLockScreenModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "CallLockScreen"

  @ReactMethod
  fun setEnabled(isEnabled: Boolean) {
    IncomingCallLockScreen.setCallOnScreen(reactApplicationContext.currentActivity, isEnabled)
  }

  /** Android 14+ выдаёт USE_FULL_SCREEN_INTENT автоматически только звонилкам и будильникам */
  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.resolve(true)
      return
    }
    val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)
    promise.resolve(manager?.canUseFullScreenIntent() ?: false)
  }

  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.resolve(false)
      return
    }
    promise.resolve(
        startSettings(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri())))
  }

  /**
   * MIUI/HyperOS: «Другие разрешения» — «Экран блокировки» и «Всплывающие окна в фоне».
   * Без них full-screen intent не открывает экран звонка. Публичного API нет: пробуем
   * известные экраны Security Center, иначе — карточку приложения.
   */
  @ReactMethod
  fun openXiaomiPermissionSettings(promise: Promise) {
    val packageName = reactApplicationContext.packageName
    val isOpened =
        MIUI_PERMISSION_EDITORS.any { activityName ->
          startSettings(
              Intent(MIUI_PERMISSION_EDITOR_ACTION)
                  .setClassName(MIUI_SECURITY_CENTER, activityName)
                  .putExtra("extra_pkgname", packageName))
        } || startSettings(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri()))
    promise.resolve(isOpened)
  }

  private fun packageUri(): Uri = Uri.parse("package:${reactApplicationContext.packageName}")

  private fun startSettings(intent: Intent): Boolean =
      try {
        reactApplicationContext.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
      } catch (error: ActivityNotFoundException) {
        false
      } catch (error: SecurityException) {
        // Security Center на части прошивок не экспортирует экран — пробуем следующий
        false
      }

  private companion object {
    const val MIUI_SECURITY_CENTER = "com.miui.securitycenter"
    const val MIUI_PERMISSION_EDITOR_ACTION = "miui.intent.action.APP_PERM_EDITOR"
    val MIUI_PERMISSION_EDITORS =
        listOf(
            "com.miui.permcenter.permissions.PermissionsEditorActivity",
            "com.miui.permcenter.permissions.AppPermissionsEditorActivity",
        )
  }
}
