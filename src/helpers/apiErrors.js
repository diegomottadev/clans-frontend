/**
 * Mensaje legible de un error de axios contra la API Laravel:
 *  - 422 de validación: { campo: ['mensaje', ...] } -> primer mensaje
 *  - errores de la API: { message, code }            -> message
 *  - cualquier otro caso                              -> fallback
 */
export function apiErrorMessage(error, fallback) {
    const data = error && error.response && error.response.data;
    if (!data || typeof data !== 'object') {
        return fallback;
    }
    if (typeof data.message === 'string' && data.message) {
        return data.message;
    }
    const first = Object.values(data).find(v => Array.isArray(v) && v.length > 0);
    return first ? String(first[0]) : fallback;
}
