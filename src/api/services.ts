// import { Order } from '../types/interfaces';
import api from './axios';
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

    sendCode: async (mail: string) => {
        try {
            const response = await api.post('/sendMail', {mail});
            return response.data;
        } catch (error) {
            throw error;    
        }
    },

    codeConfirm: async (mail: string, code: string) => {
        try {
            const response = await api.post('/codeConfirm', {mail, code});
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
            const response = await api.post('/addOrderClientMobile', {mail, address, products, clientNotes, date, opForm, needCall, comment});
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
};