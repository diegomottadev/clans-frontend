import { validateAvatarFile, AVATAR_MAX_BYTES } from './avatarFile';

const file = (type, size) => ({ type, size, name: 'x' });

describe('validateAvatarFile (validación de UX, la seguridad está en el servidor)', () => {
    it('acepta cualquier foto (se convierte en el navegador antes de subirla)', () => {
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/avif'].forEach((type) => {
            expect(validateAvatarFile(file(type, 1000))).toBeNull();
        });
    });

    it('acepta fotos grandes de celular (hasta 20 MB): se reducen antes de subir', () => {
        expect(AVATAR_MAX_BYTES).toBe(20 * 1024 * 1024);
        expect(validateAvatarFile(file('image/jpeg', 8 * 1024 * 1024))).toBeNull();
        expect(validateAvatarFile(file('image/jpeg', AVATAR_MAX_BYTES))).toBeNull();
    });

    it('rechaza lo que no es una imagen', () => {
        expect(validateAvatarFile(file('application/x-php', 1000))).toMatch(/imagen/);
        expect(validateAvatarFile(file('application/pdf', 1000))).toMatch(/imagen/);
        expect(validateAvatarFile(file('', 1000))).toMatch(/imagen/);
    });

    it('rechaza archivos de más de 20 MB', () => {
        expect(validateAvatarFile(file('image/jpeg', AVATAR_MAX_BYTES + 1))).toMatch(/20 MB/);
    });

    it('pide seleccionar un archivo si no hay', () => {
        expect(validateAvatarFile(null)).toMatch(/Seleccione/);
    });
});
