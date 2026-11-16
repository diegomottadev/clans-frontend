import '@testing-library/jest-dom';

jest.mock('axios');
jest.mock('../../helpers/BaseUrl', () => ({ BASE_URL: 'http://api.test' }));
// El navegador convierte la foto antes de subirla (canvas no existe en jsdom)
jest.mock('../../helpers/prepareAvatar', () => ({ toAvatarJpeg: jest.fn() }));
const isConverted = (f) => f instanceof File && f.name === 'avatar.jpg' && f.type === 'image/jpeg';
jest.mock('primereact/inputtext', () => ({ InputText: (props) => <input {...props} /> }));
jest.mock('primereact/button', () => ({
    Button: ({ label, onClick, disabled, type, icon, className }) => (
        <button type={type || 'button'} onClick={onClick} disabled={disabled} className={className}>{label}</button>
    ),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import MyAccountPage from './myAccountPage';

const me = (extra = {}) => ({
    id: 7, name: 'Profe Ana', email: 'ana@clans.com', role: 'user', has_avatar: false, avatar_version: null,
    teacher: { id: 3, firstName: 'Ana', lastName: 'Pérez', dni: '30111222', telphone: '4111', celphone: '351555', email: 'ana@contacto.com', address: 'Calle 1' },
    ...extra,
});

beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    axios.get.mockResolvedValue({ data: { data: me() } });
    // axios 0.19: cancelación con CancelToken (el automock devuelve undefined)
    axios.CancelToken = { source: jest.fn(() => ({ token: 'tok-1', cancel: jest.fn() })) };
    axios.isCancel = jest.fn(() => false);
    // jsdom no decodifica imágenes: por defecto toda imagen "carga" bien
    global.Image = class {
        set src(v) { this._src = v; setTimeout(() => (global.__imageFails ? this.onerror && this.onerror() : this.onload && this.onload()), 0); }
        get src() { return this._src; }
    };
    global.__imageFails = false;
    // conversión simulada (el File se crea en el contexto de jsdom para que FormData lo acepte)
    require('../../helpers/prepareAvatar').toAvatarJpeg.mockImplementation(
        () => Promise.resolve(new File(['jpeg'], 'avatar.jpg', { type: 'image/jpeg' })));
});

const renderPage = (props = {}) => render(<MyAccountPage onProfileChange={jest.fn()} {...props} />);

describe('MyAccountPage', () => {
    it('carga los datos del usuario y muestra el email de ingreso sin permitir editarlo', async () => {
        renderPage();

        const email = await screen.findByLabelText('Email de ingreso');
        expect(axios.get).toHaveBeenCalledWith('http://api.test/api/me');
        expect(email).toHaveValue('ana@clans.com');
        expect(email).toHaveAttribute('readonly');
        expect(email).toBeDisabled();
        expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('Profe Ana');
        expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
        expect(screen.getByLabelText('Apellido')).toHaveValue('Pérez');
        expect(screen.getByLabelText('DNI')).toHaveValue('30111222');
        expect(screen.getByLabelText('Domicilio')).toHaveValue('Calle 1');
    });

    it('si no tiene docente asociado no muestra la sección de datos personales', async () => {
        axios.get.mockResolvedValue({ data: { data: me({ teacher: null }) } });
        renderPage();

        await screen.findByLabelText('Email de ingreso');
        expect(screen.queryByLabelText('DNI')).not.toBeInTheDocument();
    });

    it('guarda con PUT /api/me sin enviar el email y avisa al layout', async () => {
        const onProfileChange = jest.fn();
        axios.put.mockResolvedValue({ data: { data: me({ name: 'Ana P.' }) } });
        renderPage({ onProfileChange });

        fireEvent.change(await screen.findByLabelText('Nombre de usuario'), { target: { value: 'Ana P.' } });
        fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '351999' } });
        fireEvent.click(screen.getByText('Guardar cambios'));

        await waitFor(() => expect(axios.put).toHaveBeenCalled());
        const [url, body] = axios.put.mock.calls[0];
        expect(url).toBe('http://api.test/api/me');
        expect(body.name).toBe('Ana P.');
        expect(body.teacher.celphone).toBe('351999');
        expect(body).not.toHaveProperty('email');
        expect(body).not.toHaveProperty('password');
        expect(await screen.findByRole('status')).toHaveTextContent('Datos guardados');
        expect(onProfileChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana P.' }));
    });

    it('muestra el mensaje de error del servidor', async () => {
        axios.put.mockRejectedValue({ response: { status: 422, data: { name: ['El campo nombre es obligatorio.'] } } });
        renderPage();

        await screen.findByLabelText('Nombre de usuario');
        fireEvent.click(screen.getByText('Guardar cambios'));

        expect(await screen.findByRole('alert')).toHaveTextContent('El campo nombre es obligatorio.');
    });

    it('cambio de contraseña: valida mínimo 8 y confirmación antes de enviar', async () => {
        renderPage();
        await screen.findByLabelText('Nombre de usuario');

        fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'vieja123' } });
        fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'corta' } });
        fireEvent.change(screen.getByLabelText('Repetir nueva contraseña'), { target: { value: 'corta' } });
        fireEvent.click(screen.getByText('Guardar cambios'));
        expect(await screen.findByRole('alert')).toHaveTextContent(/al menos 8/);

        fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave99' } });
        fireEvent.change(screen.getByLabelText('Repetir nueva contraseña'), { target: { value: 'OtraClave99' } });
        fireEvent.click(screen.getByText('Guardar cambios'));
        expect(await screen.findByRole('alert')).toHaveTextContent(/no coinciden/);
        expect(axios.put).not.toHaveBeenCalled();
    });

    it('cambio de contraseña: envía la actual, la nueva y la confirmación y luego limpia los campos', async () => {
        axios.put.mockResolvedValue({ data: { data: me() } });
        renderPage();
        await screen.findByLabelText('Nombre de usuario');

        fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'vieja123' } });
        fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave99' } });
        fireEvent.change(screen.getByLabelText('Repetir nueva contraseña'), { target: { value: 'NuevaClave99' } });
        fireEvent.click(screen.getByText('Guardar cambios'));

        await waitFor(() => expect(axios.put).toHaveBeenCalled());
        expect(axios.put.mock.calls[0][1]).toEqual(expect.objectContaining({
            current_password: 'vieja123', password: 'NuevaClave99', password_confirmation: 'NuevaClave99',
        }));
        await waitFor(() => expect(screen.getByLabelText('Contraseña actual')).toHaveValue(''));
    });

    it('foto: rechaza en el cliente un archivo no permitido sin subirlo', async () => {
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');

        fireEvent.change(input, { target: { files: [new File(['<?php'], 'x.php', { type: 'application/x-php' })] } });

        expect(await screen.findByRole('alert')).toHaveTextContent('El archivo debe ser una imagen.');
        expect(screen.queryByText('Subir foto')).not.toBeInTheDocument();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('foto: muestra vista previa y la sube como multipart a /api/me/avatar', async () => {
        const onProfileChange = jest.fn();
        axios.post.mockResolvedValue({ data: { data: me({ has_avatar: true, avatar_version: 'v2' }) } });
        renderPage({ onProfileChange });
        const input = await screen.findByLabelText('Elegir foto');
        const file = new File(['img'], 'yo.png', { type: 'image/png' });

        fireEvent.change(input, { target: { files: [file] } });
        expect(screen.getByAltText('Vista previa')).toHaveAttribute('src', 'blob:preview');
        fireEvent.click(screen.getByText('Subir foto'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        const [url, body] = axios.post.mock.calls[0];
        expect(url).toBe('http://api.test/api/me/avatar');
        expect(body).toBeInstanceOf(FormData);
        // se sube la versión convertida a JPEG, no el archivo original
        expect(require('../../helpers/prepareAvatar').toAvatarJpeg).toHaveBeenCalledWith(file);
        expect(isConverted(body.get('avatar'))).toBe(true);
        await waitFor(() => expect(onProfileChange).toHaveBeenCalledWith(expect.objectContaining({ has_avatar: true, avatar_version: 'v2' })));
    });

    it('foto: muestra el error del servidor al subir', async () => {
        axios.post.mockRejectedValue({ response: { status: 422, data: { avatar: ['La imagen debe ser JPG o PNG.'] } } });
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');

        fireEvent.change(input, { target: { files: [new File(['img'], 'yo.jpg', { type: 'image/jpeg' })] } });
        fireEvent.click(screen.getByText('Subir foto'));

        expect(await screen.findByRole('alert')).toHaveTextContent('La imagen debe ser JPG o PNG.');
    });

    it('foto: "Quitar foto" llama a DELETE /api/me/avatar', async () => {
        const onProfileChange = jest.fn();
        axios.get.mockImplementation((url) => url.includes('/api/me/avatar')
            ? Promise.resolve({ data: new Blob(['x']) })
            : Promise.resolve({ data: { data: me({ has_avatar: true, avatar_version: 'v1' }) } }));
        axios.delete.mockResolvedValue({ data: { data: me({ has_avatar: false }) } });
        renderPage({ onProfileChange });

        fireEvent.click(await screen.findByText('Quitar foto'));

        await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('http://api.test/api/me/avatar'));
        await waitFor(() => expect(onProfileChange).toHaveBeenCalledWith(expect.objectContaining({ has_avatar: false })));
    });
});

describe('MyAccountPage - progreso de subida de la foto', () => {
    let cancel;
    let progress;
    let resolveUpload;
    let rejectUpload;

    beforeEach(() => {
        cancel = jest.fn();
        axios.CancelToken = { source: jest.fn(() => ({ token: 'tok-1', cancel })) };
        axios.isCancel = jest.fn((e) => !!(e && e.__cancelled));
        axios.post.mockImplementation((url, body, config) => {
            progress = config && config.onUploadProgress;
            return new Promise((res, rej) => { resolveUpload = res; rejectUpload = rej; });
        });
    });

    const pickAndUpload = async () => {
        const input = await screen.findByLabelText('Elegir foto');
        fireEvent.change(input, { target: { files: [new File(['img'], 'yo.png', { type: 'image/png' })] } });
        fireEvent.click(screen.getByText('Subir foto'));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
    };

    it('muestra una barra de progreso con el porcentaje encima del botón y lo deshabilita', async () => {
        renderPage();
        await pickAndUpload();

        expect(axios.post.mock.calls[0][2]).toEqual(expect.objectContaining({ cancelToken: 'tok-1' }));
        act(() => progress({ loaded: 40, total: 100 }));

        const bar = screen.getByRole('progressbar', { name: 'Progreso de subida de la foto' });
        expect(bar).toHaveAttribute('aria-valuenow', '40');
        expect(screen.getByText('Subiendo… 40%')).toBeInTheDocument();
        const uploadButton = screen.getByText('Subiendo…');
        expect(uploadButton).toBeDisabled();
        // la barra va antes (encima) del botón
        expect(bar.compareDocumentPosition(uploadButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('al llegar al 100% indica que el servidor está procesando (barra indeterminada)', async () => {
        renderPage();
        await pickAndUpload();

        act(() => progress({ loaded: 100, total: 100 }));

        const bar = screen.getByRole('progressbar', { name: 'Progreso de subida de la foto' });
        expect(bar).not.toHaveAttribute('aria-valuenow');
        expect(screen.getByText('Procesando imagen…')).toBeInTheDocument();
    });

    it('al terminar quita la barra y el botón vuelve a su estado', async () => {
        renderPage();
        await pickAndUpload();
        act(() => progress({ loaded: 100, total: 100 }));

        await act(async () => resolveUpload({ data: { data: me({ has_avatar: true, avatar_version: 'v3' }) } }));

        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Foto actualizada.');
    });

    it('se puede cancelar: llama a cancel(), oculta la barra y conserva el archivo para reintentar', async () => {
        renderPage();
        await pickAndUpload();
        act(() => progress({ loaded: 10, total: 100 }));

        fireEvent.click(screen.getByText('Cancelar'));
        expect(cancel).toHaveBeenCalled();
        await act(async () => rejectUpload({ __cancelled: true }));

        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Subida cancelada.');
        expect(screen.getByText('Subir foto')).not.toBeDisabled();
    });

    it('si falla, oculta la barra y muestra el error', async () => {
        renderPage();
        await pickAndUpload();
        act(() => progress({ loaded: 50, total: 100 }));

        await act(async () => rejectUpload({ response: { status: 422, data: { avatar: ['La imagen es demasiado grande.'] } } }));

        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('La imagen es demasiado grande.');
    });
});

describe('MyAccountPage - archivo que no es una imagen real', () => {
    it('un texto con extensión .jpg se rechaza en el cliente: sin vista previa ni botón de subir', async () => {
        global.__imageFails = true;
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');

        fireEvent.change(input, { target: { files: [new File(['no soy una imagen'], 'falso.jpg', { type: 'image/jpeg' })] } });

        expect(await screen.findByRole('alert')).toHaveTextContent('El archivo no es una imagen válida.');
        expect(screen.queryByAltText('Vista previa')).not.toBeInTheDocument();
        expect(screen.queryByText('Subir foto')).not.toBeInTheDocument();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('una imagen válida muestra la vista previa y habilita la subida', async () => {
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');

        fireEvent.change(input, { target: { files: [new File(['img'], 'yo.png', { type: 'image/png' })] } });

        expect(await screen.findByAltText('Vista previa')).toHaveAttribute('src', 'blob:preview');
        expect(screen.getByText('Subir foto')).not.toBeDisabled();
    });
});

describe('MyAccountPage - cualquier formato de foto', () => {
    it('acepta un GIF o WebP: muestra vista previa y sube la versión JPEG convertida', async () => {
        axios.post.mockResolvedValue({ data: { data: me({ has_avatar: true, avatar_version: 'v9' }) } });
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');
        expect(input).toHaveAttribute('accept', 'image/*');

        const gif = new File(['gif'], 'animado.gif', { type: 'image/gif' });
        fireEvent.change(input, { target: { files: [gif] } });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Subir foto'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(isConverted(axios.post.mock.calls[0][1].get('avatar'))).toBe(true);
    });

    it('si el navegador no puede convertirla, muestra el error y no sube nada', async () => {
        require('../../helpers/prepareAvatar').toAvatarJpeg.mockImplementationOnce(() => Promise.reject(new Error('No se pudo leer la imagen. Si es HEIC (iPhone), conviértala a JPG.')));
        renderPage();
        const input = await screen.findByLabelText('Elegir foto');

        fireEvent.change(input, { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } });
        fireEvent.click(screen.getByText('Subir foto'));

        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo leer la imagen');
        expect(axios.post).not.toHaveBeenCalled();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
});
