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
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';

export default function     TypeEvaluation(){

    let emptyTypeEvaluation= {
        name: '',
    };
    const [showError, setShowError] = useState(false);

    const [typeEvaluations, setTypeEvaluations] = useState(null);
    const [typeEvaluation,setTypeEvaluation] = useState(emptyTypeEvaluation)
    const [typeEvaluationDialog, setTypeEvaluationDialog] = useState(false);
    const [deleteTypeEvaluationDialog, setDeleteTypeEvaluationDialog] = useState(false);
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
            setLoadingDatatable(true);
            let url = `${BASE_URL}/api/typeEvaluations/?page=${lazyParams.page+1}`;
            if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined){
                let keys = Object.keys(lazyParams.filters);
                url = `${BASE_URL}/api/typeEvaluations/?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.name.value)}`;
            }
            try {
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  typeEvaluations}}) => {
                    setTotalRecords(typeEvaluations.meta.pagination.total);
                    setTypeEvaluations(typeEvaluations.data)
                    setLoadingDatatable(false);
                });
            } catch (err) {
                console.log(err);
                console.warn('Hubo un problema con la carga de registros de tipos de evaluaciones');
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
        setTypeEvaluation(emptyTypeEvaluation);
        setSubmitted(false);
        setTypeEvaluationDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setTypeEvaluationDialog(false);
    }

    const hideDeleteTypeEvaluationDialog = () => {
        setDeleteTypeEvaluationDialog(false);
    }

    async function saveTypeEvaluation()  {
         try {
            setSubmitted(true);
            if(typeEvaluation.id){
                await axios.put(`${BASE_URL}/api/typeEvaluations/${typeEvaluation.id}`, typeEvaluation).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de evaluación: ${typeEvaluation.name} actualizado`, life: 3000 });

                });

            }else{
                await axios.post(`${BASE_URL}/api/typeEvaluations`, typeEvaluation).then(function(){
                    setLazyParams({...lazyParams,page: 0});
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de evaluación: ${typeEvaluation.name} agregado`, life: 3000 });
                });

            }
            setTypeEvaluation(emptyTypeEvaluation);
            setTypeEvaluationDialog(false);
        } catch (error) {
        console.error(error);
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema con el registro de tipo de evaluación', life: 3000 });
        } 
    }
       
      
      const editTypeEvaluation = (_typeEvaluation) => {
        let editTypeEvaluation= {
            id: _typeEvaluation.id,
            name: _typeEvaluation.name,
        };
        setTypeEvaluation({ ...editTypeEvaluation });
        setTypeEvaluationDialog(true);
    }

    const confirmDeleteTypeEvaluation = (_typeEvaluation) => {
        let deleleTypeEvaluation= {
            id: _typeEvaluation.id,
            name: _typeEvaluation.name,
        };
        setTypeEvaluation({ ...deleleTypeEvaluation });     
        setDeleteTypeEvaluationDialog(true);
    }

    async function deleteTypeEvaluation() {
        try{
            await axios.delete(`${BASE_URL}/api/typeEvaluations/${typeEvaluation.id}`).then(function(){
                setLazyParams({...lazyParams,page: 0});
                setDeleteTypeEvaluationDialog(false);
                setTypeEvaluation(emptyTypeEvaluation);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Tipo de evaluación:  ${typeEvaluation.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el tipo de evalución', life: 3000 });
        }
        

    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _typeEvaluation = { ...typeEvaluation };
        _typeEvaluation[`${name}`] = val;

        setTypeEvaluation(_typeEvaluation);
    }

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editTypeEvaluation(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteTypeEvaluation(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Tipos de evaluación</span>
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

    const typeEvaluationDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveTypeEvaluation} />
        </div>
    );
    const deleteTypeEvaluationDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteTypeEvaluationDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteTypeEvaluation} />
        </div>
    );

    if(showError){
        return(
                <Error mensaje={'Hubo un problema con la carga de registros de tipos de evaluciones'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-file-edit" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Tipos de evaluación</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de tipos de evaluación</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={typeEvaluations} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="name" header="Nombre" sortable ></Column>
                     
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={typeEvaluationDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={typeEvaluationDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={typeEvaluation.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !typeEvaluation.name })} />

                            {submitted && !typeEvaluation.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>

                    </Dialog>

                    <Dialog visible={deleteTypeEvaluationDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteTypeEvaluationDialogFooter} onHide={hideDeleteTypeEvaluationDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {typeEvaluation && <span>Confirma eliminar el tipo de evalución <b>{typeEvaluation.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}