import {StyleSheet, Text, TextInput} from 'react-native';

/**
 * iOS «Полужирный текст» (Bold Text) в спец.возможностях утолщает СИСТЕМНЫЙ
 * шрифт прямо на уровне ОС (см. RCTFontUtils.mm — RN резолвит текст через
 * `[UIFont systemFontOfSize:weight:]`), независимо от заданного fontWeight —
 * это не лечится ни JS, ни allowFontScaling. Кастомные шрифты этому эффекту
 * не подвержены, поэтому вместо системного шрифта везде принудительно
 * подставляется Inter — по цифровому fontWeight выбирается нужное начертание.
 */
const INTER_FONT_BY_WEIGHT: Record<string, string> = {
  '400': 'Inter-Regular',
  normal: 'Inter-Regular',
  '500': 'Inter-Medium',
  '600': 'Inter-SemiBold',
  '700': 'Inter-Bold',
  bold: 'Inter-Bold',
};

function resolveInterFontFamily(fontWeight: unknown): string {
  const key =
    fontWeight === undefined || fontWeight === null
      ? '400'
      : String(fontWeight);
  return INTER_FONT_BY_WEIGHT[key] ?? 'Inter-Regular';
}

/**
 * `Text`/`TextInput` в RN 0.79 — `React.forwardRef`, у которого больше нет
 * поддерживаемого `defaultProps` (React 19 его для функциональных компонентов
 * не читает). Поэтому системные настройки специальных возможностей (крупный
 * шрифт, полужирный текст) масштабируют/утолщают шрифт и ломают вёрстку
 * экранов — переопределяем сам `render`, чтобы `allowFontScaling` всегда был
 * `false`, а шрифт всегда был Inter нужного начертания.
 */
function disableFontScalingFor<
  T extends {render: (props: any, ref: unknown) => unknown},
>(Component: T): void {
  const originalRender = Component.render;
  Component.render = (props: Record<string, unknown>, ref: unknown) => {
    const flatStyle = props.style
      ? (StyleSheet.flatten(props.style as never) as {
          fontFamily?: string;
          fontWeight?: string | number;
        })
      : undefined;
    const fontFamily =
      flatStyle?.fontFamily ?? resolveInterFontFamily(flatStyle?.fontWeight);
    return originalRender(
      {
        ...props,
        allowFontScaling: false,
        style: [{fontFamily}, props.style as never],
      },
      ref,
    );
  };
}

disableFontScalingFor(
  Text as unknown as {render: (props: any, ref: unknown) => unknown},
);
disableFontScalingFor(
  TextInput as unknown as {render: (props: any, ref: unknown) => unknown},
);
