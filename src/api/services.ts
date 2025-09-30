// import { Order } from '../types/interfaces';
import api from './axios';
import { RegisterData } from '../types';

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
            throw error;
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

    addOrder: async (mail: string, address: any, products: any, clientNotes: any, date: any, opForm: string) => {
        try {
            const response = await api.post('/addOrderClientMobile', {mail, address, products, clientNotes, date, opForm});
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
    }
};