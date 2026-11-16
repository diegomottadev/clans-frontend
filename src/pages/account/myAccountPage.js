import React, { useEffect, useRef, useState } from 'react';
import Axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { BASE_URL } from '../../helpers/BaseUrl';
import { apiErrorMessage } from '../../helpers/apiErrors';
import { validateAvatarFile } from '../../helpers/avatarFile';
import { toAvatarJpeg } from '../../helpers/prepareAvatar';
import { useAvatarUrl } from '../../components/UserMenu';

const EMPTY_TEACHER = { firstName: '', lastName: '', dni: '', telphone: '', celphone: '', email: '', address: '' };
const EMPTY_PASSWORDS = { current_password: '', password: '', password_confirmation: '' };

const TEACHER_FIELDS = [
    ['firstName', 'Nombre'],
    ['lastName', 'Apellido'],
    ['dni', 'DNI'],
    ['telphone', 'Teléfono'],
    ['celphone', 'Celular'],
    ['email', 'Email de contacto'],
    ['address', 'Domicilio'],
];

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' };

/**
 * "Mi cuenta": el usuario logueado ve y edita sus datos. El email de ingreso se muestra
 * deshabilitado y nunca se envía (además el backend rechaza cualquier cambio).
 * onProfileChange(data) actualiza el usuario del layout (nombre y foto del topbar).
 */
export default function MyAccountPage({ onProfileChange }) {
    const [account, setAccount] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [name, setName] = useState('');
    const [teacher, setTeacher] = useState(EMPTY_TEACHER);
    const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formOk, setFormOk] = useState(null);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [avatarError, setAvatarError] = useState(null);
    // Progreso de subida: null = sin subida; 0..100 = % enviado (100 = el servidor procesa)
    const [uploadProgress, setUploadProgress] = useState(null);
    const [avatarStatus, setAvatarStatus] = useState(null);
    const cancelUpload = useRef(null);
    const currentAvatar = useAvatarUrl(!!account?.has_avatar, account?.avatar_version);

    const applyAccount = (data) => {
        setAccount(data);
        setName(data.name || '');
        setTeacher(data.teacher ? { ...EMPTY_TEACHER, ...data.teacher } : EMPTY_TEACHER);
    };

    useEffect(() => {
        Axios.get(`${BASE_URL}/api/me`)
            .then(({ data }) => applyAccount(data.data))
            .catch((e) => setLoadError(apiErrorMessage(e, 'No se pudieron cargar sus datos.')));
    }, []);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const notify = (data) => {
        applyAccount(data);
        if (onProfileChange) onProfileChange(data);
    };

    const onSave = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setFormError(null);
        setFormOk(null);

        const changingPassword = passwords.password !== '' || passwords.current_password !== '';
        if (changingPassword) {
            if (!passwords.current_password) return setFormError('Ingrese su contraseña actual.');
            if (passwords.password.length < 8) return setFormError('La nueva contraseña debe tener al menos 8 caracteres.');
            if (passwords.password !== passwords.password_confirmation) return setFormError('Las contraseñas nuevas no coinciden.');
        }

        const body = { name };
        if (account.teacher) {
            body.teacher = TEACHER_FIELDS.reduce((acc, [key]) => ({ ...acc, [key]: teacher[key] || null }), {});
        }
        if (changingPassword) Object.assign(body, passwords);

        setSaving(true);
        try {
            const { data } = await Axios.put(`${BASE_URL}/api/me`, body);
            notify(data.data);
            setPasswords(EMPTY_PASSWORDS);
            setFormOk(changingPassword ? 'Datos guardados y contraseña actualizada.' : 'Datos guardados.');
        } catch (err) {
            setFormError(apiErrorMessage(err, 'No se pudieron guardar los cambios.'));
        } finally {
            setSaving(false);
        }
    };

    const onPickFile = (e) => {
        const picked = e.target.files && e.target.files[0];
        setAvatarError(null);
        const problem = validateAvatarFile(picked);
        if (problem) {
            setFile(null);
            setPreview(null);
            setAvatarError(problem);
            e.target.value = '';
            return;
        }
        const url = URL.createObjectURL(picked);
        setFile(picked);
        setPreview(url);
        // El tipo MIME lo declara el navegador según la extensión: se comprueba que el
        // contenido sea realmente una imagen intentando decodificarla (solo UX; el servidor valida igual)
        const probe = new Image();
        probe.onerror = () => {
            URL.revokeObjectURL(url);
            setFile(current => (current === picked ? null : current));
            setPreview(current => (current === url ? null : current));
            setAvatarError('El archivo no es una imagen válida.');
            if (e.target) e.target.value = '';
        };
        probe.src = url;
    };

    const onUpload = async () => {
        if (!file) return;
        setAvatarBusy(true);
        setAvatarError(null);
        setAvatarStatus(null);
        // Cualquier formato que abra el navegador se convierte a JPEG 512x512 antes de subir
        let converted;
        try {
            converted = await toAvatarJpeg(file);
        } catch (err) {
            setAvatarError(err.message || 'No se pudo leer la imagen.');
            setAvatarBusy(false);
            return;
        }
        setUploadProgress(0);
        const source = Axios.CancelToken.source();
        cancelUpload.current = source;
        const form = new FormData();
        form.append('avatar', converted);
        try {
            const { data } = await Axios.post(`${BASE_URL}/api/me/avatar`, form, {
                cancelToken: source.token,
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.min(100, Math.round((e.loaded * 100) / e.total)));
                },
            });
            setFile(null);
            setPreview(null);
            setAvatarStatus('Foto actualizada.');
            notify(data.data);
        } catch (err) {
            if (Axios.isCancel(err)) {
                setAvatarStatus('Subida cancelada.'); // se conserva el archivo para reintentar
            } else {
                setAvatarError(apiErrorMessage(err, 'No se pudo subir la foto.'));
            }
        } finally {
            cancelUpload.current = null;
            setUploadProgress(null);
            setAvatarBusy(false);
        }
    };

    const onCancelUpload = () => {
        if (cancelUpload.current) cancelUpload.current.cancel('Subida cancelada por el usuario');
    };

    const onRemove = async () => {
        setAvatarBusy(true);
        setAvatarError(null);
        try {
            const { data } = await Axios.delete(`${BASE_URL}/api/me/avatar`);
            notify(data.data);
        } catch (err) {
            setAvatarError(apiErrorMessage(err, 'No se pudo quitar la foto.'));
        } finally {
            setAvatarBusy(false);
        }
    };

    if (loadError) {
        return <div className="card" role="alert">{loadError}</div>;
    }
    if (!account) {
        return <div className="card">Cargando...</div>;
    }

    const shown = preview || currentAvatar;

    return (
        <div className="p-grid my-account">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-id-card" style={{ color: '#fff', fontSize: '1.4rem' }} />
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Mi cuenta</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Sus datos y foto de perfil</p>
                    </div>
                </div>
            </div>

            <div className="p-col-12 p-md-4">
                <div className="card my-account-photo" style={cardStyle}>
                    <h5>Foto de perfil</h5>
                    <div className="my-account-avatar">
                        {shown
                            ? <img src={shown} alt={preview ? 'Vista previa' : 'Foto de perfil'} />
                            : <i className="pi pi-user" aria-hidden="true" />}
                    </div>
                    <label htmlFor="avatar-file" className="p-button p-button-outlined p-button-sm my-account-pick">
                        <i className="pi pi-camera" aria-hidden="true" /> <span>Elegir imagen</span>
                    </label>
                    <input id="avatar-file" type="file" accept="image/*" aria-label="Elegir foto"
                        className="my-account-file" onChange={onPickFile} />
                    <small className="my-account-hint">Cualquier foto (JPG, PNG, GIF, WebP…), hasta 20 MB. Se convierte y recorta en cuadrado.</small>
                    {avatarError && <small className="p-error my-account-msg" role="alert">{avatarError}</small>}
                    {avatarStatus && <small className="my-account-msg my-account-ok" role="status">{avatarStatus}</small>}
                    {uploadProgress !== null && (
                        <div className="my-account-upload">
                            <div
                                className={`my-account-progress${uploadProgress >= 100 ? ' is-indeterminate' : ''}`}
                                role="progressbar"
                                aria-label="Progreso de subida de la foto"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={uploadProgress >= 100 ? undefined : uploadProgress}
                            >
                                <div className="my-account-progress-fill" style={uploadProgress >= 100 ? undefined : { width: `${uploadProgress}%` }} />
                            </div>
                            <small className="my-account-progress-label" aria-live="polite">
                                {uploadProgress >= 100 ? 'Procesando imagen…' : `Subiendo… ${uploadProgress}%`}
                            </small>
                        </div>
                    )}
                    <div className="my-account-photo-actions">
                        {file && (
                            <Button type="button" label={uploadProgress !== null ? 'Subiendo…' : 'Subir foto'}
                                icon={uploadProgress !== null ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
                                onClick={onUpload} disabled={avatarBusy} />
                        )}
                        {uploadProgress !== null && (
                            <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={onCancelUpload} />
                        )}
                        {!file && account.has_avatar && (
                            <Button type="button" label="Quitar foto" icon="pi pi-trash" className="p-button-outlined p-button-danger" onClick={onRemove} disabled={avatarBusy} />
                        )}
                    </div>
                </div>
            </div>

            <div className="p-col-12 p-md-8">
                <form className="card p-fluid" style={cardStyle} onSubmit={onSave} noValidate>
                    <h5>Datos de la cuenta</h5>
                    <div className="p-formgrid p-grid">
                        <div className="p-field p-col-12 p-md-6">
                            <label htmlFor="acc-email">Email de ingreso</label>
                            <InputText id="acc-email" value={account.email} readOnly disabled />
                            <small className="my-account-hint">El email de ingreso no se puede modificar.</small>
                        </div>
                        <div className="p-field p-col-12 p-md-6">
                            <label htmlFor="acc-name">Nombre de usuario</label>
                            <InputText id="acc-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>

                    {account.teacher && (
                        <>
                            <h5>Datos personales</h5>
                            <div className="p-formgrid p-grid">
                                {TEACHER_FIELDS.map(([key, label]) => (
                                    <div className="p-field p-col-12 p-md-6" key={key}>
                                        <label htmlFor={`acc-t-${key}`}>{label}</label>
                                        <InputText id={`acc-t-${key}`} value={teacher[key] || ''}
                                            type={key === 'email' ? 'email' : 'text'}
                                            onChange={(e) => setTeacher({ ...teacher, [key]: e.target.value })} />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <h5><i className="pi pi-lock" aria-hidden="true" /> Cambiar contraseña <small className="my-account-hint">(opcional)</small></h5>
                    <div className="p-formgrid p-grid">
                        {[['current_password', 'Contraseña actual', 'current-password'],
                          ['password', 'Nueva contraseña', 'new-password'],
                          ['password_confirmation', 'Repetir nueva contraseña', 'new-password']].map(([key, label, ac]) => (
                            <div className="p-field p-col-12 p-md-4" key={key}>
                                <label htmlFor={`acc-${key}`}>{label}</label>
                                <InputText id={`acc-${key}`} type="password" autoComplete={ac} value={passwords[key]}
                                    onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} />
                            </div>
                        ))}
                    </div>

                    {formError && <div className="p-error my-account-msg" role="alert">{formError}</div>}
                    {formOk && <div className="my-account-ok" role="status">{formOk}</div>}
                    <div className="my-account-actions">
                        <Button type="submit" label="Guardar cambios" icon="pi pi-save" disabled={saving} />
                    </div>
                </form>
            </div>
        </div>
    );
}
