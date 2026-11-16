import Axios from 'axios';
import { BASE_URL } from './BaseUrl';
import { getToken, deleteToken } from './auth-helpers';

/** La app usa BrowserRouter: volver a "/" (no "/#/", que quedaba pegado a la URL). */
export const AFTER_LOGOUT_PATH = '/';

/**
 * Cierra la sesión: invalida el JWT en el servidor (lista negra) y borra el token local.
 * Si el servidor no responde, el token local se borra igual.
 */
export async function logoutSession() {
    if (getToken()) {
        try {
            await Axios.post(`${BASE_URL}/api/auth/logout`);
        } catch (e) {
            // sin conexión o token ya vencido: igual se cierra la sesión local
        }
    }
    deleteToken();
}
