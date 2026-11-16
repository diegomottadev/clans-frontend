/**
 * Oráculo: cerrar sesión
 *  - avisa al servidor (POST /api/auth/logout) para invalidar el token (lista negra JWT),
 *  - borra el token local aunque el servidor no responda,
 *  - vuelve al inicio sin "#/" (la app usa BrowserRouter: el "#/" quedaba pegado a la URL).
 */
jest.mock('axios');
jest.mock('./BaseUrl', () => ({ BASE_URL: 'http://api.test' }));

import axios from 'axios';
import { logoutSession, AFTER_LOGOUT_PATH } from './logout';
import { setToken, getToken } from './auth-helpers';

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe('logoutSession', () => {
    it('invalida el token en el servidor y luego lo borra localmente', async () => {
        setToken('tok-123');
        axios.post.mockResolvedValue({ data: { message: 'ok' } });

        await logoutSession();

        expect(axios.post).toHaveBeenCalledWith('http://api.test/api/auth/logout');
        expect(getToken()).toBeNull();
    });

    it('borra el token local aunque el servidor falle', async () => {
        setToken('tok-123');
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(logoutSession()).resolves.toBeUndefined();
        expect(getToken()).toBeNull();
    });

    it('sin token no llama al servidor', async () => {
        await logoutSession();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('después de cerrar sesión se vuelve a "/" (sin "#/")', () => {
        expect(AFTER_LOGOUT_PATH).toBe('/');
    });
});
