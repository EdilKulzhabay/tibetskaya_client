// import { Order } from '../types/interfaces';
import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegisterData, SupportMessage } from '../types';

// Примеры API-сервисов
export const apiService = {
    getData: async (mail: string) => {
        try {
            const response = await api.post('/getClientDataMobile', {mail});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /** Код регистрации отправляется на указанный email */
    sendCode: async (mail: string, phone: string) => {
        try {
            const response = await api.post('/sendMail', { mail, phone });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    codeConfirm: async (phone: string, code: string) => {
        try {
            const response = await api.post('/codeConfirm', { phone, code });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    clientRegister: async (RegisterData: RegisterData) => {
        try {
            const response = await api.post('/clientRegister', RegisterData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    clientLogin: async (data: {mail: string, password: string}) => {
        try {
            const response = await api.post('/clientLogin', data);
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось войти в систему",
            };
        }
    },

    updateData: async (mail: string, field: string, value: any) => {
        try {
            const response = await api.post(`/updateClientDataMobile`, {mail, field, value});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addOrder: async (mail: string, address: any, products: any, clientNotes: any, date: any, opForm: string, needCall: boolean, comment: string) => {
        try {
            const fcmToken = await AsyncStorage.getItem('fcmToken');
            const response = await api.post('/addOrderClientMobile', {
                mail, address, products, clientNotes, date, opForm, needCall, comment,
                notificationToken: fcmToken || '',
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getActiveOrders: async (mail: string) => {
        try {
            const response = await api.post('/getActiveOrdersMobile', {mail});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getOrders: async (mail: string) => {
        try {
            const response = await api.post('/getClientOrdersMobile', {mail});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getCourierLocation: async (courierId: string) => {
        try {
            const response = await api.post('/getCourierLocation', {courierId});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteAccount: async (mail: string) => {
        try {
            const response = await api.post('/deleteClientMobile', {mail});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    sendSupportMessage: async (mail: string, message: SupportMessage) => {
        try {
            const response = await api.post('/sendSupportMessage', {mail, message});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось отправить сообщение",
            };
        }
    },

    getSupportMessages: async (mail: string) => {
        try {
            const response = await api.post('/getSupportMessages', {mail});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось получить сообщения",
            };
        }
    },

    getOrder: async (orderId: string) => {
        try {
            const response = await api.post('/getOrderDataMobile', {orderId});
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    cancelOrder: async (orderId: string, reason: string) => {
        try {
            const response = await api.post('/cancelOrderMobile', {orderId, reason});
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateOrderData: async (orderId: string, field: string, value: any) => {
        try {
            const response = await api.post('/updateOrderDataMobile', {orderId, field, value});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось обновить данные заказа",
            };
        }
    },
    getFaq: async () => {
        try {
            const response = await api.get('/getFaq');
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось получить FAQ",
            };
        }
    },
    createPaymentLink: async (sum: any, email?: string, phone?: string) => {
        try {
            const body: any = { sum };
            if (email) { body.email = email; }
            if (phone) { body.phone = phone.replace(/\D/g, ''); }
            const response = await api.post('/api/payment/create', body);
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось обновить данные заказа",
            };
        }
    },
    getLastOrder: async (mail: string) => {
        try {
            const response = await api.post('/getLastOrderMobile', {mail});
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /** Вызов мастера (ремонт): JWT + fullName и phone в теле */
    requestMasterCall: async (payload: { fullName: string; phone: string; mail: string }) => {
        try {
            const response = await api.post('/requestMasterCallMobile', payload);
            return response.data;
        } catch (error: any) {
            const message =
                error?.response?.data?.message || 'Не удалось отправить заявку';
            return { success: false, message };
        }
    },

    sendMailForgotPassword: async (mail: string) => {
        try {
            const response = await api.post('/sendMailForgotPassword', {mail});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось отправить письмо",
            };
        }
    },
    codeConfirmForgotPassword: async (mail: string, code: string) => {
        try {
            const response = await api.post('/codeConfirmForgotPassword', {mail, code});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось подтвердить код",
            };
        }
    },

    updateForgottenPassword: async (mail: string, password: string) => {
        try {
            const response = await api.post('/updateForgottenPassword', {mail, password});
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось установить новый пароль",
            };
        }
    },

    // Оплата сохранённой картой (рекуррентный платёж)
    chargeSavedCard: async (clientId: string, amount: number) => {
        try {
            const response = await api.post('/api/payment/charge-saved-card', { clientId, amount });
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось выполнить оплату",
            };
        }
    },

    // Получение данных сохранённой карты
    getSavedCard: async (clientId: string) => {
        try {
            const response = await api.post('/api/payment/saved-card', { clientId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                hasCard: false,
                card: null,
            };
        }
    },

    // Удаление сохранённой карты
    deleteSavedCard: async (clientId: string) => {
        try {
            const response = await api.post('/api/payment/delete-card', { clientId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Не удалось удалить карту",
            };
        }
    },

    /** Статус сессии оплаты (для опроса из WebView после callback на сервер) */
    getPaymentSessionStatus: async (userId: string, orderId: string) => {
        try {
            const response = await api.get('/api/payment/session-status', {
                params: { userId, orderId },
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                status: 'unknown',
                message: error?.response?.data?.message || 'Не удалось получить статус',
            };
        }
    },

    // Получение конфига виджета Pay Plus
    getWidgetConfig: async (userId: string, amount: number, email?: string, phone?: string) => {
        try {
            console.log('[getWidgetConfig] Запрос:', { userId, amount, hasEmail: !!email, hasPhone: !!phone });
            const response = await api.post('/api/payment/widget-config', { userId, amount, email, phone });
            console.log('[getWidgetConfig] Ответ:', {
                success: response.data?.success,
                hasPaymentUrl: !!(response.data?.paymentUrl && response.data.paymentUrl.startsWith('http')),
                hasWidgetPageUrl: !!response.data?.widgetPageUrl,
                orderId: response.data?.orderId,
            });
            return response.data;
        } catch (error: any) {
            console.error('[getWidgetConfig] Ошибка:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            });
            const serverMessage = error?.response?.data?.message || "Не удалось получить конфигурацию платежа";
            const debugMessage = error?.response?.data?.debug;
            return {
                success: false,
                message: debugMessage ? `${serverMessage}: ${debugMessage}` : serverMessage,
            };
        }
    },
};