import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';

export default function Login({login,mostrarError}){

    const [usuario, setUsuario] = useState({
        email: "",
        username: '',
    })
    const [loginError, setLoginError] = useState(null);

    function handleInputChange(e){
        setLoginError(null);
        setUsuario ({...usuario, [e.target.name]: e.target.value});
    }

    async function handleSubmit(e){
        e.preventDefault();
        setLoginError(null);
        try {
            await login(usuario.email,usuario.password);
        }
        catch (error){
            if (error.response?.status === 401 || error.response?.status === 422) {
                setLoginError('Email o contraseña incorrectos.');
            } else if (!error.response) {
                setLoginError('No se pudo conectar al servidor. Verifique su conexión.');
            } else {
                setLoginError('Ocurrió un error al iniciar sesión. Intente nuevamente.');
            }
        }
    }

   

    return (
        <div className="p-d-flex p-jc-center p-ai-center" style={{ minHeight: '100vh' }}>
            <div className="p-col-12 p-sm-8 p-md-6 p-lg-4 p-xl-3">
                <Panel header="Ingreso">
                    <div className="p-fluid">
                        <form onSubmit={handleSubmit}>
                            <div className="p-field p-mt-4">
                                <span className="p-float-label">
                                    <InputText type="text" name="email" onChange={handleInputChange} value={usuario.email || ''} required />
                                    <label htmlFor="email">Email</label>
                                </span>
                            </div>

                            <div className="p-field p-mt-4">
                                <span className="p-float-label">
                                    <Password name="password" max="150" onChange={handleInputChange} value={usuario.password || ''} required feedback={false} />
                                    <label htmlFor="password">Contraseña</label>
                                </span>
                            </div>

                            {loginError && (
                                <Message severity="error" text={loginError} className="p-mb-3 p-d-block" />
                            )}
                            <Button type="submit" label="Ingresar" className="p-mt-2" />
                        </form>
                    </div>
                </Panel>
            </div>
        </div>
    );
}