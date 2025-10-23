// import axios from 'axios';

// // TODO: Замените на ваш реальный URL сервера
// const API_URL = 'http://your-server-url.com'; // Например: 'https://api.tibetskaya.kz'

// export interface AgoraTokenResponse {
//     success: boolean;
//     token: string;
//     appID: string;
//     channelName: string;
//     uid: number;
//     expiresAt: number;
// }

// export interface InitiateCallResponse {
//     success: boolean;
//     channelName: string;
//     recipientId: string;
//     recipientName: string;
//     recipientPhone?: string;
// }

// class AgoraService {
//     /**
//      * Получить токен для подключения к каналу Agora
//      * @param channelName - Имя канала
//      * @param uid - Уникальный ID пользователя
//      * @returns Токен и данные для подключения
//      */
//     async getToken(channelName: string, uid: number): Promise<AgoraTokenResponse> {
//         try {
//             const response = await axios.post(`${API_URL}/api/agora/token`, {
//                 channelName,
//                 uid,
//                 role: 'publisher'
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка получения Agora токена:', error);
//             throw error;
//         }
//     }

//     /**
//      * Инициировать звонок клиента курьеру
//      * @param orderId - ID заказа
//      * @param clientId - ID клиента
//      * @returns Данные о звонке
//      */
//     async initiateCallToCourier(orderId: string, clientId: string): Promise<InitiateCallResponse> {
//         try {
//             const response = await axios.post(`${API_URL}/api/agora/initiate-call`, {
//                 orderId,
//                 callerId: clientId,
//                 callerType: 'client'
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Ошибка инициации звонка:', error);
//             throw error;
//         }
//     }

//     /**
//      * Сохранить историю звонка
//      * @param callData - Данные о звонке
//      */
//     async saveCallHistory(callData: {
//         orderId: string;
//         channelName: string;
//         duration: number;
//         startedAt: Date;
//         endedAt: Date;
//         initiatedBy: 'client' | 'courier';
//     }): Promise<void> {
//         try {
//             await axios.post(`${API_URL}/api/agora/save-call-history`, callData);
//         } catch (error) {
//             console.error('Ошибка сохранения истории звонка:', error);
//             // Не выбрасываем ошибку, чтобы не блокировать UI
//         }
//     }
// }

// export default new AgoraService();

