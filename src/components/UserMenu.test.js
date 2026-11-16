import '@testing-library/jest-dom';

jest.mock('axios');
jest.mock('../helpers/BaseUrl', () => ({ BASE_URL: 'http://api.test' }));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import UserMenu from './UserMenu';

beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:avatar-1');
    global.URL.revokeObjectURL = jest.fn();
});

const usuario = (extra = {}) => ({ id: 1, name: 'admin', role: 'admin', has_avatar: false, avatar_version: null, ...extra });

describe('UserMenu (topbar)', () => {
    it('sin foto muestra el ícono genérico y el nombre, sin pedir la imagen', () => {
        const { container } = render(<UserMenu usuario={usuario()} onAccount={jest.fn()} onLogout={jest.fn()} />);

        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(container.querySelector('.pi-user')).toBeInTheDocument();
        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('con foto la descarga autenticada (blob) y la muestra en lugar del ícono', async () => {
        axios.get.mockResolvedValue({ data: new Blob(['x'], { type: 'image/jpeg' }) });
        const { container } = render(<UserMenu usuario={usuario({ has_avatar: true, avatar_version: 'abc12345' })} onAccount={jest.fn()} onLogout={jest.fn()} />);

        const img = await screen.findByAltText('Foto de perfil');
        expect(img).toHaveAttribute('src', 'blob:avatar-1');
        expect(axios.get).toHaveBeenCalledWith('http://api.test/api/me/avatar?v=abc12345', { responseType: 'blob' });
        expect(container.querySelector('.pi-user')).not.toBeInTheDocument();
    });

    it('si falla la descarga de la foto vuelve al ícono genérico', async () => {
        axios.get.mockRejectedValue(new Error('404'));
        const { container } = render(<UserMenu usuario={usuario({ has_avatar: true, avatar_version: 'abc' })} onAccount={jest.fn()} onLogout={jest.fn()} />);

        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(container.querySelector('.pi-user')).toBeInTheDocument();
        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument();
    });

    it('al hacer clic abre el menú con "Mi cuenta" y "Cerrar sesión"', () => {
        render(<UserMenu usuario={usuario()} onAccount={jest.fn()} onLogout={jest.fn()} />);
        const trigger = screen.getByRole('button', { name: /admin/ });

        expect(screen.queryByText('Mi cuenta')).not.toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('menuitem', { name: /Mi cuenta/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Cerrar sesión/ })).toBeInTheDocument();
    });

    it('"Mi cuenta" navega y cierra el menú; "Cerrar sesión" llama a logout', () => {
        const onAccount = jest.fn();
        const onLogout = jest.fn();
        render(<UserMenu usuario={usuario()} onAccount={onAccount} onLogout={onLogout} />);

        fireEvent.click(screen.getByRole('button', { name: /admin/ }));
        fireEvent.click(screen.getByRole('menuitem', { name: /Mi cuenta/ }));
        expect(onAccount).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menuitem', { name: /Mi cuenta/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /admin/ }));
        fireEvent.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
        expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('se cierra con Escape y con clic afuera', () => {
        render(<div><span>afuera</span><UserMenu usuario={usuario()} onAccount={jest.fn()} onLogout={jest.fn()} /></div>);
        const trigger = screen.getByRole('button', { name: /admin/ });

        fireEvent.click(trigger);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByText('Mi cuenta')).not.toBeInTheDocument();

        fireEvent.click(trigger);
        fireEvent.mouseDown(screen.getByText('afuera'));
        expect(screen.queryByText('Mi cuenta')).not.toBeInTheDocument();
    });
});
