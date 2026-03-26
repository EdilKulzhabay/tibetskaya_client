import React, { ReactNode, useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

interface Props extends TextInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    onRightIconPress?: () => void;
    mask?: "phone";
    rightIcon?: ReactNode; // 👈 иконка справа
    isPassword?: boolean,
    bgWhite?: boolean,
    inputRef?: React.RefObject<TextInput | null> // 👈 внешний ref для навигации между полями
}

const extractPhoneDigits = (text: string) => text.replace(/\D/g, "").slice(0, 11);

/** Нормализация: 8→7, ведущая 7 для кода страны */
const normalizeKzDigits = (digits: string): string => {
    let d = extractPhoneDigits(digits);
    if (d.length === 0) {
        return "";
    }
    if (d[0] === "8") {
        d = "7" + d.slice(1);
    }
    if (d[0] !== "7") {
        d = ("7" + d).slice(0, 11);
    }
    return d;
};

/** Отображение +7 (XXX) XXX-XX-XX только из нормализованных цифр */
const formatKzPhoneDisplay = (normalizedDigits: string): string => {
    const digits = normalizeKzDigits(normalizedDigits);
    if (digits.length === 0) {
        return "";
    }
    let result = "+7";
    if (digits.length > 1) {
        result += ` (${digits.slice(1, 4)}`;
    }
    if (digits.length >= 4) {
        result += `) ${digits.slice(4, 7)}`;
    }
    if (digits.length >= 7) {
        result += `-${digits.slice(7, 9)}`;
    }
    if (digits.length >= 9) {
        result += `-${digits.slice(9, 11)}`;
    }
    return result;
};

/**
 * Обработка ввода: если пользователь стирает скобку/пробел/тире, количество цифр не меняется —
 * тогда считаем, что нужно убрать последнюю цифру (иначе маска мгновенно вернёт скобки).
 */
const resolvePhoneDigitsOnChange = (text: string, prevFormatted: string): string => {
    const prevDigits = extractPhoneDigits(prevFormatted);
    const incomingDigits = extractPhoneDigits(text);

    if (incomingDigits.length === 0) {
        return "";
    }

    // Стерли «+» из «+7», осталась одна «7» в поле
    if (text === "7" && prevFormatted === "+7") {
        return "";
    }

    if (text.length < prevFormatted.length) {
        if (incomingDigits.length < prevDigits.length) {
            return normalizeKzDigits(incomingDigits);
        }
        if (incomingDigits.length === prevDigits.length && prevDigits.length > 0) {
            return normalizeKzDigits(prevDigits.slice(0, -1));
        }
    }

    return normalizeKzDigits(incomingDigits);
};

const OutlinedFilledLabelInput: React.FC<Props> = ({
    label,
    value,
    onChangeText,
    onRightIconPress,
    mask,
    rightIcon,
    isPassword = false,
    bgWhite = false,
    inputRef: externalInputRef, // внешний ref
    ...rest
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(true);
    const internalInputRef = useRef<TextInput>(null);
    /** Предыдущее отформатированное значение телефона (для корректного стирания +7) */
    const prevPhoneValueRef = useRef<string>("");
    const animatedLabel = useState(new Animated.Value(value ? 1 : 0))[0];
    
    // Используем внешний ref если передан, иначе внутренний
    const inputRef = externalInputRef || internalInputRef;

    useEffect(() => {
        Animated.timing(animatedLabel, {
            toValue: isFocused || value ? 1 : 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    useEffect(() => {
        if (mask === "phone") {
            prevPhoneValueRef.current = value ?? "";
        }
    }, [mask, value]);

    const labelStyle = {
        top: animatedLabel.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 4],
        }),
        fontSize: animatedLabel.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: "#99A3B3",
    };

    const toggleSecure = () => setIsSecure(!isSecure);

    return (
        <TouchableWithoutFeedback onPress={() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }}>
            <View style={styles.container}>
                <View style={[styles.inputContainer, bgWhite ? {backgroundColor: 'white'} : {backgroundColor: '#f6f6f6',}]}>
                    <Animated.Text
                        style={[styles.animatedLabel, labelStyle]}
                    >
                        {label}
                    </Animated.Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            value={value}
                            keyboardType={rest.keyboardType}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            secureTextEntry={isPassword && isSecure}
                            onChangeText={(text) => {
                            if (mask === "phone") {
                                const prev = prevPhoneValueRef.current;
                                const resolvedDigits = resolvePhoneDigitsOnChange(text, prev);
                                const formatted = formatKzPhoneDisplay(resolvedDigits);
                                prevPhoneValueRef.current = formatted;
                                onChangeText(formatted);
                            } else {
                                onChangeText(text);
                            }
                            }}
                            {...rest}
                        />
                    </View>
                    {isPassword ? (
                        <TouchableOpacity onPress={toggleSecure} style={styles.iconButton}>
                            <Image
                                source={
                                    isSecure
                                    ? require("../assets/EyeSlash.png") // Иконка "глаз с чертой" (скрыт)
                                    : require("../assets/Eye.png") // Иконка "глаз" (виден)
                                }
                                style={{ width: 24, height: 24 }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        ) : (
                        rightIcon && (
                            <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton}>
                                {rightIcon}
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingTop: 28,
        paddingBottom: 8,
        borderColor: '#EDEDED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    animatedLabel: {
        position: 'absolute',
        left: 12,
        paddingHorizontal: 4,
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        fontSize: 18,
        color: 'black',
        padding: 0,
        margin: 0,
        marginBottom: -4,
    },
    iconButton: {
        marginLeft: 8,
        marginTop: -20,
    },
});

export default OutlinedFilledLabelInput;
