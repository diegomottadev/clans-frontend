import { apiErrorMessage } from './apiErrors';

describe('apiErrorMessage', () => {
    const fallback = 'Hubo un problema';

    it('devuelve el primer mensaje de validación 422 ({campo: [mensajes]})', () => {
        const error = { response: { status: 422, data: { password: ['La contraseña debe tener al menos 8 caracteres.'] } } };
        expect(apiErrorMessage(error, fallback)).toBe('La contraseña debe tener al menos 8 caracteres.');
    });

    it('usa data.message cuando la API responde { message, code }', () => {
        const error = { response: { status: 403, data: { message: 'No tiene permisos', code: 403 } } };
        expect(apiErrorMessage(error, fallback)).toBe('No tiene permisos');
    });

    it('usa el texto por defecto si no hay respuesta (error de red)', () => {
        expect(apiErrorMessage(new Error('Network Error'), fallback)).toBe(fallback);
    });

    it('usa el texto por defecto si la respuesta no trae mensajes', () => {
        expect(apiErrorMessage({ response: { status: 500, data: '' } }, fallback)).toBe(fallback);
    });
});
