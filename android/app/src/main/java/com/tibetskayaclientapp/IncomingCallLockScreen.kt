package com.tibetskayaclientapp

import android.app.Activity
import android.app.NotificationManager
import android.os.Build
import android.view.WindowManager

/**
 * Показ MainActivity поверх экрана блокировки: пока звонит входящий (есть его уведомление)
 * или пока JS показывает экран звонка. В остальное время флаг снят — иначе всё приложение
 * (баланс, профиль) было бы видно без разблокировки телефона.
 *
 * Уведомление нужно учитывать нативно: full-screen intent запускает MainActivity на
 * заблокированном телефоне, а JS включит флаг только через секунды после загрузки бандла —
 * до этого экран звонка остаётся под блокировкой.
 */
object IncomingCallLockScreen {
  /** Совпадает с CHANNEL_ID в src/features/calls/incomingCallNotification.ts */
  private const val INCOMING_CALL_CHANNEL_ID = "incoming_calls"

  @Volatile private var isCallOnScreen = false

  fun setCallOnScreen(activity: Activity?, isOnScreen: Boolean) {
    isCallOnScreen = isOnScreen
    activity?.runOnUiThread { apply(activity) }
  }

  /** Вызывается из MainActivity.onResume: и при запуске full-screen intent'ом, и при возврате */
  fun apply(activity: Activity) {
    setShowWhenLocked(activity, isCallOnScreen || isRinging(activity))
  }

  private fun isRinging(activity: Activity): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
    val manager = activity.getSystemService(NotificationManager::class.java) ?: return false
    return manager.activeNotifications.any { it.notification.channelId == INCOMING_CALL_CHANNEL_ID }
  }

  private fun setShowWhenLocked(activity: Activity, isEnabled: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      activity.setShowWhenLocked(isEnabled)
      activity.setTurnScreenOn(isEnabled)
      return
    }
    @Suppress("DEPRECATION")
    val flags =
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    if (isEnabled) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
  }
}
