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

export default function Languaje(){

    let emptyLanguaje= {
        name: '',
    };
    const [languajes, setLanguajes] = useState(null);
    const [loading] = useState(false); // eslint-disable-line no-unused-vars
    const [languaje,setLanguaje] = useState(emptyLanguaje)
    const [languajeDialog, setLanguajeDialog] = useState(false);
    const [deleteLanguajeDialog, setDeleteLanguajeDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter] = useState(null); // eslint-disable-line no-unused-vars
    const toast = useRef(null);
    const dt = useRef(null);
    const [showError, setShowError] = useState(false);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });
    
    useEffect(() => {
        async  function loadLazyData () {
            try{
                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/languajes?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined && lazyParams.filters.name!==""){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/languajes?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.name.value)}`;
                }
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  languajes}}) => {
                    setTotalRecords(languajes.meta.pagination.total);
                    setLanguajes(languajes.data);
                    setLoadingDatatable(false);
                });
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de idiomas.');
                setShowError(true);
                setLoadingDatatable(false);
                //toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al cargar de cursos. Vuelva a refrescar', life: 3000 });
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

    const onFilter = (e) => {
        const eventData = {filters:{
            name:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }

    const openNew = () => {
        setLanguaje(emptyLanguaje);
        setSubmitted(false);
        setLanguajeDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setLanguajeDialog(false);
    }

    const hideDeleteLanguajeDialog = () => {
        setDeleteLanguajeDialog(false);
    }

    async function saveLanguaje()  {
        try {
            setSubmitted(true);
            if(languaje.id){
                await axios.put(`${BASE_URL}/api/languajes/${languaje.id}`, languaje).then(function(){
                    setLazyParams({...lazyParams,page: 0})
                    setSubmitted(false);

                    toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Idioma actualizado', life: 3000 });
                });
            }else{
                await axios.post(`${BASE_URL}/api/languajes`, languaje).then(function(){
                    setLazyParams({...lazyParams,page: 0})
                    setSubmitted(false);
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Idioma agregado', life: 3000 });
                });
            }
            setLanguaje(emptyLanguaje);
            setLanguajeDialog(false);
        } catch (error) {
            console.error(error)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el idioma', life: 3000 });

        } 
    }
       
    const editLanguaje = (_languaje) => {
        let editLanguaje= {
            id: _languaje.id,
            name: _languaje.name,
        };
        setLanguaje({ ...editLanguaje });
        setLanguajeDialog(true);
    }

    const confirmDeleteLanguaje = (_languaje) => {
        let deleleLanguaje= {
            id: _languaje.id,
            name: _languaje.name,
        };
        setLanguaje({ ...deleleLanguaje });     
        setDeleteLanguajeDialog(true);
    }

    async function deleteLanguaje() {
        try{
            await axios.delete(`${BASE_URL}/api/languajes/${languaje.id}`).then(function(){
                setDeleteLanguajeDialog(false);
                setLanguaje(emptyLanguaje);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Idioma ${languaje.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el idioma', life: 3000 });
        }
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _languaje = { ...languaje };
        _languaje[`${name}`] = val;

        setLanguaje(_languaje);
    }

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editLanguaje(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteLanguaje(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de idiomas</span>
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

    const languajeDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveLanguaje} />
        </div>
    );
    const deleteLanguajeDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteLanguajeDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteLanguaje} />
        </div>
    );


    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de idiomas'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-globe" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Idiomas</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de idiomas</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={languajes} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                    >
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="name" header="Idioma" sortable ></Column>
                     
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={languajeDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={languajeDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={languaje.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !languaje.name })} />

                            {submitted && !languaje.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>

                    </Dialog>

                    <Dialog visible={deleteLanguajeDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteLanguajeDialogFooter} onHide={hideDeleteLanguajeDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {languaje && <span>Confirma eliminar el tipo de evalución <b>{languaje.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}