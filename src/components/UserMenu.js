import React, { useEffect, useRef, useState } from 'react';
import Axios from 'axios';
import { BASE_URL } from '../helpers/BaseUrl';

/**
 * Descarga la foto de perfil con el JWT (el endpoint es autenticado, un <img src> directo
 * no mandaría la cabecera) y la expone como object URL. "version" invalida la caché.
 */
export function useAvatarUrl(hasAvatar, version) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!hasAvatar) {
            setUrl(null);
            return undefined;
        }
        let objectUrl = null;
        let cancelled = false;
        Axios.get(`${BASE_URL}/api/me/avatar?v=${encodeURIComponent(version || '')}`, { responseType: 'blob' })
            .then(({ data }) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(data);
                setUrl(objectUrl);
            })
            .catch(() => { if (!cancelled) setUrl(null); });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [hasAvatar, version]);

    return url;
}

export default function UserMenu({ usuario, onAccount, onLogout }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const avatarUrl = useAvatarUrl(!!usuario?.has_avatar, usuario?.avatar_version);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onOutside);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onOutside);
        };
    }, [open]);

    const choose = (fn) => () => {
        setOpen(false);
        if (fn) fn();
    };

    return (
        <div className="user-menu" ref={rootRef}>
            <button
                type="button"
                className="p-link user-menu-trigger"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : 'false'}
                onClick={() => setOpen(v => !v)}
            >
                {avatarUrl
                    ? <img src={avatarUrl} alt="Foto de perfil" className="user-menu-avatar" />
                    : <i className="pi pi-user" aria-hidden="true" />}
                <span>{usuario?.name}</span>
                <i className="pi pi-angle-down user-menu-chevron" aria-hidden="true" />
            </button>
            {open && (
                <ul className="user-menu-dropdown" role="menu">
                    <li role="none">
                        <button type="button" role="menuitem" className="p-link" onClick={choose(onAccount)}>
                            <i className="pi pi-id-card" aria-hidden="true" /><span>Mi cuenta</span>
                        </button>
                    </li>
                    <li role="none">
                        <button type="button" role="menuitem" className="p-link" onClick={choose(onLogout)}>
                            <i className="pi pi-sign-out" aria-hidden="true" /><span>Cerrar sesión</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}
