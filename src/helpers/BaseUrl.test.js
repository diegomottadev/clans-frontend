/**
 * Oráculo: REACT_APP_BASE_URL define el origen de la API.
 *  - vacío  -> '' (mismo origen: el nginx del frontend reenvía /api al backend, sin CORS)
 *  - valor  -> ese valor
 *  - sin definir -> 'http://api.clans.local' (comportamiento histórico)
 */
const load = (value) => {
    const original = process.env.REACT_APP_BASE_URL;
    if (value === undefined) delete process.env.REACT_APP_BASE_URL;
    else process.env.REACT_APP_BASE_URL = value;
    let mod;
    jest.isolateModules(() => { mod = require('./BaseUrl'); });
    if (original === undefined) delete process.env.REACT_APP_BASE_URL;
    else process.env.REACT_APP_BASE_URL = original;
    return mod.BASE_URL;
};

describe('BASE_URL', () => {
    it('vacío significa mismo origen', () => {
        expect(load('')).toBe('');
    });

    it('usa el valor configurado', () => {
        expect(load('https://api.ejemplo.test')).toBe('https://api.ejemplo.test');
    });

    it('sin configurar usa el valor histórico', () => {
        expect(load(undefined)).toBe('http://api.clans.local');
    });
});
