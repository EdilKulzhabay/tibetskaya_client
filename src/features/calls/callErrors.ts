export const NETWORK_ERROR_CODE = 'NETWORK';
export const UNAUTHORIZED_ERROR_CODE = 'UNAUTHORIZED';

/** Ошибка запроса к серверу звонков; message безопасно показывать пользователю */
export class CallRequestError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'CallRequestError';
  }
}

export class MicrophonePermissionError extends Error {
  constructor() {
    super('Нет доступа к микрофону. Разрешите его в настройках телефона');
    this.name = 'MicrophonePermissionError';
  }
}
