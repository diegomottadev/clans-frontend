/**
 * Validación de la foto de perfil en el cliente: SOLO es UX (aviso inmediato).
 * La validación real (tipo por contenido, tamaño, dimensiones, re-codificación) la hace el servidor.
 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png'];

export function validateAvatarFile(file) {
    if (!file) {
        return 'Seleccione una imagen.';
    }
    if (!AVATAR_TYPES.includes(file.type)) {
        return 'La imagen debe ser JPG o PNG.';
    }
    if (file.size > AVATAR_MAX_BYTES) {
        return 'La imagen no puede superar los 2 MB.';
    }
    return null;
}
