import {Platform} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';

/**
 * iOS уже сам учитывает чёлку/home indicator в вёрстке, а SafeAreaView
 * добавлял отступы поверх этого — из-за чего шапка и нижняя навигация
 * выглядели слишком высокими на iOS. На Android эти отступы остаются
 * нужны, чтобы контент не перекрывался status bar / navigation bar.
 */
export const androidOnlySafeAreaEdges: Edge[] =
  Platform.OS === 'android' ? ['top', 'right', 'bottom', 'left'] : [];
