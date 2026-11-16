import { validateAvatarFile, AVATAR_MAX_BYTES } from './avatarFile';

const file = (type, size) => ({ type, size, name: 'x' });

describe('validateAvatarFile (validación de UX, la seguridad está en el servidor)', () => {
    it('acepta JPEG y PNG de hasta 2 MB', () => {
        expect(validateAvatarFile(file('image/jpeg', 1000))).toBeNull();
        expect(validateAvatarFile(file('image/png', AVATAR_MAX_BYTES))).toBeNull();
    });

    it('rechaza tipos no permitidos', () => {
        expect(validateAvatarFile(file('image/gif', 1000))).toMatch(/JPG o PNG/);
        expect(validateAvatarFile(file('application/x-php', 1000))).toMatch(/JPG o PNG/);
        expect(validateAvatarFile(file('image/webp', 1000))).toMatch(/JPG o PNG/);
    });

    it('rechaza archivos de más de 2 MB', () => {
        expect(validateAvatarFile(file('image/jpeg', AVATAR_MAX_BYTES + 1))).toMatch(/2 MB/);
    });

    it('pide seleccionar un archivo si no hay', () => {
        expect(validateAvatarFile(null)).toMatch(/Seleccione/);
    });
});
