/**
 * Oráculo: cualquier foto que el navegador pueda abrir se convierte, ANTES de subirla,
 * en un JPEG cuadrado de 512x512 recortado al centro (el formato que guarda el servidor).
 * Así una foto de celular de 8 MB sube en pocos KB y GIF/WebP/BMP/AVIF quedan en JPEG.
 */
import { centerSquare, toAvatarJpeg, AVATAR_UPLOAD_SIZE } from './prepareAvatar';

describe('centerSquare', () => {
    it('recorta al centro una foto apaisada', () => {
        expect(centerSquare(4032, 3024)).toEqual({ sx: 504, sy: 0, size: 3024 });
    });

    it('recorta al centro una foto vertical', () => {
        expect(centerSquare(3024, 4032)).toEqual({ sx: 0, sy: 504, size: 3024 });
    });

    it('deja igual una cuadrada', () => {
        expect(centerSquare(800, 800)).toEqual({ sx: 0, sy: 0, size: 800 });
    });
});

describe('toAvatarJpeg', () => {
    let ctx;
    let canvas;

    beforeEach(() => {
        global.URL.createObjectURL = jest.fn(() => 'blob:orig');
        global.URL.revokeObjectURL = jest.fn();
        global.Image = class {
            set src(v) {
                this._src = v;
                this.naturalWidth = 4032;
                this.naturalHeight = 3024;
                setTimeout(() => (global.__imageFails ? this.onerror() : this.onload()), 0);
            }
        };
        global.__imageFails = false;
        ctx = { drawImage: jest.fn(), fillRect: jest.fn(), fillStyle: '' };
        canvas = {
            width: 0, height: 0,
            getContext: jest.fn(() => ctx),
            toBlob: jest.fn((cb, type) => cb(new Blob(['jpeg-bytes'], { type }))),
        };
        const realCreate = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas' ? canvas : realCreate(tag)));
    });

    afterEach(() => jest.restoreAllMocks());

    it('devuelve un JPEG 512x512 recortado al centro, con fondo blanco', async () => {
        const original = new File(['gif-bytes'], 'animado.gif', { type: 'image/gif' });

        const out = await toAvatarJpeg(original);

        expect(AVATAR_UPLOAD_SIZE).toBe(512);
        expect(canvas.width).toBe(512);
        expect(canvas.height).toBe(512);
        expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);
        expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 504, 0, 3024, 3024, 0, 0, 512, 512);
        expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', expect.any(Number));
        expect(out).toBeInstanceOf(File);
        expect(out.name).toBe('avatar.jpg');
        expect(out.type).toBe('image/jpeg');
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:orig');
    });

    it('falla con un mensaje claro si el navegador no puede abrir la imagen (p. ej. HEIC)', async () => {
        global.__imageFails = true;
        await expect(toAvatarJpeg(new File(['x'], 'foto.heic', { type: 'image/heic' })))
            .rejects.toThrow('No se pudo leer la imagen');
    });
});
