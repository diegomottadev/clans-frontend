/**
 * Convierte en el navegador cualquier foto que éste pueda abrir (JPEG, PNG, GIF, WebP, BMP,
 * AVIF; HEIC solo en Safari) a un JPEG cuadrado de 512x512 recortado al centro, ANTES de
 * subirla. Así una foto de celular de varios MB sube en pocos KB y el servidor recibe siempre
 * el mismo formato. Los navegadores actuales aplican la orientación EXIF al dibujar, así que
 * la foto queda derecha. El servidor igual valida y vuelve a codificar (no confía en el cliente).
 */
export const AVATAR_UPLOAD_SIZE = 512;
const JPEG_QUALITY = 0.9;

export function centerSquare(width, height) {
    const size = Math.min(width, height);
    return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size };
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen. Si es HEIC (iPhone), conviértala a JPG.'));
        };
        img.src = url;
    });
}

export async function toAvatarJpeg(file) {
    const img = await loadImage(file);
    const { sx, sy, size } = centerSquare(img.naturalWidth || img.width, img.naturalHeight || img.height);

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_UPLOAD_SIZE;
    canvas.height = AVATAR_UPLOAD_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // fondo blanco para PNG/GIF con transparencia
    ctx.fillRect(0, 0, AVATAR_UPLOAD_SIZE, AVATAR_UPLOAD_SIZE);
    ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_UPLOAD_SIZE, AVATAR_UPLOAD_SIZE);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo convertir la imagen.'))), 'image/jpeg', JPEG_QUALITY);
    });
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
