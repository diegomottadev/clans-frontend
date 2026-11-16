import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import {BASE_URL} from '../../helpers/BaseUrl';
import { sortQuery } from '../../helpers/listQuery';
import Error from '../../components/Error';
import { Dropdown } from 'primereact/dropdown';
import Loading from '../../components/Loading';
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';

export default function     UserPage(){
    let roles= [{
            "role": 'admin',
        },
        {
            "role": 'user',
        }];
    let userEmpty= {
        name: '',
        password: '',
        email: '',
        teacher: '',
        role:''
    };
    const [showError, setShowError] = useState(false);

    const [users, setUsers] = useState(null);
    const [teachers, setTeachers] = useState(null);

    const [user,setUser] = useState(userEmpty)
    const [userDialog, setUserDialog] = useState(false);
    const [deleteUserDialog, setDeleteUserDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(() => {
        async function loadTeachers() {
            try {
                const {data: {data: {data: teachers}}} = await axios.get(`${BASE_URL}/api/teachers?all=1`);
                setTeachers(teachers);
                setLoading(false);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de docentes');
                setShowError(true);
                setLoadingDatatable(false);
                setLoading(false)
            }
        }
        loadTeachers();
    }, []);
    useEffect(() => {
        async  function loadLazyData () {
            setLoadingDatatable(true);
            let url = `${BASE_URL}/api/users?page=${lazyParams.page+1}`;
            if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined){
                let keys = Object.keys(lazyParams.filters);
                url = `${BASE_URL}/api/users?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.name.value)}`;
            }
            try {
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  users}}) => {
                    setTotalRecords(users.meta.pagination.total);
                    setUsers(users.data)
                    setLoadingDatatable(false);
                });
            } catch (err) {
                console.log(err);
                console.warn('Hubo un problema con la carga de usuarios');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    },[lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {
        
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => { 
        console.log(event);
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onFilter = useDebouncedCallback((e) => {
        const eventData = {filters:{
            name:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }, 400);

    const openNew = () => {
        setUser(userEmpty);
        setSubmitted(false);
        setUserDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    }

    const hideDeleteUserDialog = () => {
        setDeleteUserDialog(false);
    }

    async function saveUser()  {
         try {
            setSubmitted(true);
            if(user.id){
                await axios.put(`${BASE_URL}/api/users/${user.id}`, user).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Usuario: ${user.name} actualizado`, life: 3000 });

                });

            }else{
                await axios.post(`${BASE_URL}/api/users`, user).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Usuario: ${user.name} agregado`, life: 3000 });
                });
            }
            setUser(userEmpty);
            setUserDialog(false);
        } catch (error) {
        console.error(error);
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema con el registro de usuario', life: 3000 });
        } 
    }
       
      
      const editUser = (_user) => {
        let editUser= {
            id: _user.id,
            name: _user.name,
            teacher: _user.teacher.id,
            password: '', // No incluir la contraseña actual por seguridad
            email: _user.email
        };
        setUser({ ...editUser });
        setUserDialog(true);
    }

    const confirmDeleteUser = (_user) => {
        let deleleUser= {
            id: _user.id,
            name: _user.name,
        };
        setUser({ ...deleleUser });     
        setDeleteUserDialog(true);
    }

    async function deleteUser() {
        try{
            await axios.delete(`${BASE_URL}/api/users/${user.id}`).then(function(){
                setLazyParams({...lazyParams,page: 0});
                setDeleteUserDialog(false);
                setUser(userEmpty);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Usuario:  ${user.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el usuario', life: 3000 });
        }
        

    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };
        _user[`${name}`] = val;

        setUser(_user);
    }

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editUser(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteUser(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de usuarios</span>
            </div>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onFilter(e)} placeholder="Buscar..." style={{ width: '100%' }} />
                </span>
                <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-secondary" onClick={exportCSV} style={{ borderRadius: 8 }} />
            </div>
        </div>
    );

    const userDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveUser} />
        </div>
    );
    const deleteUserDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteUserDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteUser} />
        </div>
    );

    if (loading) {
        return (
            <Loading />
        );
    }

    if(showError){
        return(
                <Error mensaje={'Hubo un problema con la carga de usuarios'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-users" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Usuarios</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de usuarios</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={users} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="name" header="Nombre" sortable ></Column>
                        <Column field="email" header="Email" sortable ></Column>
                        <Column field="teacher.nombreCompleto" header="Docente" sortable ></Column>

                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={userDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={userDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={user.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !user.name })} />
                            {submitted && !user.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={user.email} onChange={(e) => onInputChange(e, 'email')} required autoFocus className={classNames({ 'p-invalid': submitted && !user.email })} />
                            {submitted && !user.email && <small className="p-invalid">Email es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="password">Contraseña</label>
                            <InputText 
                                id="password" 
                                type="password"
                                value={user.password} 
                                onChange={(e) => onInputChange(e, 'password')} 
                                required 
                                autoFocus 
                                className={classNames({ 'p-invalid': submitted && !user.password })} 
                                placeholder="Ingrese nueva contraseña"
                            />
                            {submitted && !user.password && <small className="p-invalid">Contraseña es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="teacher">Docente</label>
                            <Dropdown appendTo={document.body} value={user.teacher || ''} options={teachers} onChange={(e) => onInputChange(e, 'teacher')} optionValue="id" optionLabel="completeName" filter showClear filterBy="completeName" placeholder="-- Seleccionar docente --" />
                            {submitted && !user.teacher && <small className="p-invalid">Docente es requerido.</small>}

                        </div>
                        <div className="p-field">
                            <label htmlFor="teacher">Rol</label>
                            <Dropdown appendTo={document.body} value={user.role || ''} options={roles} onChange={(e) => onInputChange(e, 'role')} optionValue="role" optionLabel="role" filter showClear filterBy="role" placeholder="-- Seleccionar rol --" />
                            {submitted && !user.role && <small className="p-invalid">Rol es requerido.</small>}

                        </div>
                    </Dialog>

                    <Dialog visible={deleteUserDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteUserDialogFooter} onHide={hideDeleteUserDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {user && <span>Confirma eliminar el usuario <b>{user.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}