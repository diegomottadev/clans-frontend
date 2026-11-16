/**
 * Validación de la foto de perfil en el cliente: SOLO es UX (aviso inmediato).
 * Se acepta cualquier imagen: antes de subirla se convierte a JPEG 512x512 (prepareAvatar).
 * La validación real (tipo por contenido, tamaño, dimensiones, re-codificación) la hace el servidor.
 */
export const AVATAR_MAX_BYTES = 20 * 1024 * 1024; // tamaño del ORIGINAL (fotos de celular)

export function validateAvatarFile(file) {
    if (!file) {
        return 'Seleccione una imagen.';
    }
    if (!file.type || !file.type.startsWith('image/')) {
        return 'El archivo debe ser una imagen.';
    }
    if (file.size > AVATAR_MAX_BYTES) {
        return 'La imagen no puede superar los 20 MB.';
    }
    return null;
}
