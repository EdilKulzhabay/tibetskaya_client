module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    // CallKit/PushKit нужны только на iOS. На Android входящий звонок показывается
    // уведомлением notifee, а Android-часть callkeep добавила бы в манифест
    // CALL_PHONE и READ_PHONE_NUMBERS — чувствительные разрешения для Google Play.
    'react-native-callkeep': {platforms: {android: null}},
    'react-native-voip-push-notification': {platforms: {android: null}},
  },
};
