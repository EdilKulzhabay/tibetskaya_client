// import { Order } from '../types/interfaces';
import api from './axios';
import { RegisterData } from '../types';

// Примеры API-сервисов
export const apiService = {
    getData: async () => {
        try {
            const response = await api.get('/getCourierAggregatorData');
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
};