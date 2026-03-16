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
import Error from '../../components/Error';

export default function TypeAssistance(){

    let emptyTypeAssistance= {
        name: '',
    };

    const [showError, setShowError] = useState(false);

    const [typeAssistances, setTypeAssistances] = useState(null);
    const [typeAssistance,setTypeAssistance] = useState(emptyTypeAssistance)
    const [typeAssistanceDialog, setTypeAssistanceDialog] = useState(false);
    const [deleteTypeAssistanceDialog, setDeleteTypeAssistanceDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(() => {
        async  function loadLazyData () {
            try {
                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/typeAssistances/?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/typeAssistances/?page=${lazyParams.page+1}&${keys[0]}=${lazyParams.filters.name.value}`;
                }
           
                await axios.get(url).then(({data: {data:  typeAssistances}}) => {
                    setTotalRecords(typeAssistances.meta.pagination.total);
                    setTypeAssistances(typeAssistances.data)
                    setLoadingDatatable(false);
                });
            
            } catch (err){
                console.log(err);
                console.warn('Hubo un problema con la carga de registros de tipos de asistencias');
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

    const onFilter = (e) => {
        const eventData = {filters:{
            name:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        setLazyParams(_lazyParams);
    }

    const openNew = () => {
        setTypeAssistance(emptyTypeAssistance);
        setSubmitted(false);
        setTypeAssistanceDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setTypeAssistanceDialog(false);
    }

    const hideDeleteTypeAssistanceDialog = () => {
        setDeleteTypeAssistanceDialog(false);
    }

     async function saveTypeAssistance()  {
        try {
            setSubmitted(true);
            if(typeAssistance.id){
                await axios.put(`${BASE_URL}/api/typeAssistances/${typeAssistance.id}`, typeAssistance).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de asistencia: ${typeAssistance.name} actualizado`, life: 3000 });
                });
            }else{
                await axios.post(`${BASE_URL}/api/typeAssistances`, typeAssistance).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de asistencia: ${typeAssistance.name} agregado`, life: 3000 });
                });
            }
            setTypeAssistance(emptyTypeAssistance);
            setTypeAssistanceDialog(false);
        } catch (error) {
        console.error(error);
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema con el registro de tipo de asistencia', life: 3000 });
        } 
    }
       
      
      const editTypeAssistance = (_typeAssistance) => {
        let editTypeAssistance= {
            id: _typeAssistance.id,
            name: _typeAssistance.name,
        };
        setTypeAssistance({ ...editTypeAssistance });
        setTypeAssistanceDialog(true);
    }

    const confirmDeleteTypeAssistance = (_typeAssistance) => {
        let deleleTypeAssistance= {
            id: _typeAssistance.id,
            name: _typeAssistance.name,
        };
        setTypeAssistance({ ...deleleTypeAssistance });     
        setDeleteTypeAssistanceDialog(true);
    }

    async function deleteTypeAssistance() {
        try{
            await axios.delete(`${BASE_URL}/api/typeAssistances/${typeAssistance.id}`).then(function(){
                setLazyParams({...lazyParams,page: 0});
                setDeleteTypeAssistanceDialog(false);
                setTypeAssistance(emptyTypeAssistance);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de asistencia ${typeAssistance.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema eliminar el tipo de asistencia', life: 3000 });
        }
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _typeAssistance = { ...typeAssistance };
        _typeAssistance[`${name}`] = val;

        setTypeAssistance(_typeAssistance);
    }

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editTypeAssistance(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteTypeAssistance(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Tipos de asistencia</span>
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

    const typeAssistanceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveTypeAssistance} />
        </div>
    );
    const deleteTypeAssistanceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteTypeAssistanceDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteTypeAssistance} />
        </div>
    );


    if(showError){
        return(
                <Error mensaje={'Hubo un problema con la carga de registros de tipos de asistencias'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-check-circle" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Tipos de asistencia</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de tipos de asistencia</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={typeAssistances} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                     
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="name" header="Nombre" sortable ></Column>
                     
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={typeAssistanceDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={typeAssistanceDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={typeAssistance.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !typeAssistance.name })} />

                            {submitted && !typeAssistance.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>

                    </Dialog>

                    <Dialog visible={deleteTypeAssistanceDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteTypeAssistanceDialogFooter} onHide={hideDeleteTypeAssistanceDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {typeAssistance && <span>Confirma eliminar el tipo de asistencia <b>{typeAssistance.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}