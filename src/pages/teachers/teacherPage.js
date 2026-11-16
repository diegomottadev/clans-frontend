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

export default function Teacher(){

    let emptyTeacher= {
        name: '',
        last_name: '',
        dni: '',
        telphone:'',
        address:'',
        celphone:'',
        email:'',
    };
    const [teachers, setTeachers] = useState(null);
    const [teacher,setTeacher] = useState(emptyTeacher)
    const [teacherDialog, setTeacherDialog] = useState(false);
    const [deleteTeacherDialog, setDeleteTeacherDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showError, setShowError] = useState(false);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });


    useEffect(() => {
        async  function loadLazyData () {
            setLoadingDatatable(true);
            let url = `${BASE_URL}/api/teachers/?page=${lazyParams.page+1}`;
            if(lazyParams.filters!==undefined && lazyParams.filters.completeName!==undefined){
                let keys = Object.keys(lazyParams.filters);
                url = `${BASE_URL}/api/teachers/?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.completeName.value)}`;
            }
            try {
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  teachers}}) => {
                    setTotalRecords(teachers.meta.pagination.total);
                    setTeachers(teachers.data)
                    setLoadingDatatable(false);
                });
            } catch (err){
                console.log(err);
                console.warn('Hubo un problema con la carga de registros de docentes');
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
            completeName:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }

    const openNew = () => {
        setTeacher(emptyTeacher);
        setSubmitted(false);
        setTeacherDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setTeacherDialog(false);
    }

    const hideDeleteTeacherDialog = () => {
        setDeleteTeacherDialog(false);
    }

     async function saveTeacher()  {

            try {
          
                setSubmitted(true);
                if(teacher.id){
                    await axios.put(`${BASE_URL}/api/teachers/${teacher.id}`, teacher).then(function(){
                        setLazyParams({...lazyParams,page: 0});
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Docente actualizado', life: 3000 });
                    });

                }else{
                    await axios.post(`${BASE_URL}/api/teachers`, teacher).then(function(){
                        setLazyParams({...lazyParams,page: 0});
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Docente agregado', life: 3000 });
                    });

                }
                setTeacher(emptyTeacher);
                setTeacherDialog(false);
              } catch (error) {
                console.error(error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar docente', life: 3000 });
      
              } 
        }
       
      
      const editTeacher = (_teacher) => {
        let editTeacher= {
            id: _teacher.id,
            name: _teacher.firstName,
            last_name: _teacher.lastName,
            dni: _teacher.dni,
            telphone:_teacher.telphone,
            address:_teacher.address,
            celphone:_teacher.celphone,
            email:_teacher.email,
        };
        setTeacher({ ...editTeacher });
        setTeacherDialog(true);
    }

    const confirmDeleteTeacher = (_teacher) => {
        let deleleTeacher= {
            id: _teacher.id,
            name: _teacher.firstName,
            last_name: _teacher.lastName,
        };
        setTeacher({ ...deleleTeacher });     
        setDeleteTeacherDialog(true);
    }

    async function deleteTeacher() {
        try{
            await axios.delete(`${BASE_URL}/api/teachers/${teacher.id}`).then(function(){
                setLazyParams({...lazyParams,page: 0});
                setDeleteTeacherDialog(false);
                setTeacher(emptyTeacher);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Docente eliminado', life: 3000 });
            });

        }catch(err){
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar docente', life: 3000 });
        }
       
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _teacher = { ...teacher };
        _teacher[`${name}`] = val;

        setTeacher(_teacher);
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
            </React.Fragment>
        )
    }

    const formatDni = (value) => {
        if (!value) return '-';
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const dniBodyTemplate = (rowData) => (
        <span>{formatDni(rowData.dni)}</span>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="actions">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editTeacher(rowData)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteTeacher(rowData)} />
            </div>
        );
    }

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de docentes</span>
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

    const teacherDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveTeacher} />
        </div>
    );
    const deleteTeacherDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteTeacherDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteTeacher} />
        </div>
    );

    if(showError){
        return(
                <Error mensaje={'Hubo un problema con la carga de registros de docentes'}></Error>
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
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Docentes</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de docentes</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={teachers} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                        <Column field="apellido_nombre_completo" header="Apellido y Nombre" sortable ></Column>
                        <Column field="dni" header="Nº Documento" body={dniBodyTemplate} sortable ></Column>
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={teacherDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={teacherDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={teacher.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !teacher.name })} />

                            {submitted && !teacher.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="last_name">Apellido</label>
                            <InputText id="last_name" value={teacher.last_name} onChange={(e) => onInputChange(e, 'last_name')} required  className={classNames({ 'p-invalid': submitted && !teacher.last_name })} />

                            {submitted && !teacher.last_name && <small className="p-invalid">Apellido es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="dni">Nº Documento</label>
                            <InputText id="dni" value={teacher.dni} onChange={(e) => onInputChange(e, 'dni')} required integeronly className={classNames({ 'p-invalid': submitted && !teacher.dni })} />

                            {submitted && !teacher.dni && <small className="p-invalid">Nº de documento es requerido.</small>}
                        </div>

                        <div className="p-field">
                            <label htmlFor="telphone">Teléfono</label>
                            <InputText id="telphone" value={teacher.telphone} onChange={(e) => onInputChange(e, 'telphone')}  integeronly  />
                        </div>
                        <div className="p-field">
                            <label htmlFor="celphone">Celular</label>
                            <InputText id="celphone" value={teacher.celphone} onChange={(e) => onInputChange(e, 'celphone')}  integeronly  />
                        </div>
                        <div className="p-field">
                            <label htmlFor="address">Domicilio</label>
                            <InputText id="address" value={teacher.address} onChange={(e) => onInputChange(e, 'address')}   />
                        </div>
                        <div className="p-field">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={teacher.email} onChange={(e) => onInputChange(e, 'email')}   />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteTeacherDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteTeacherDialogFooter} onHide={hideDeleteTeacherDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {teacher && <span>Confirma eliminar docente <b>{teacher.name} {teacher.last_name}</b>?</span>}
                        </div>
                    </Dialog>

                </div>
            </div>
        </div>
    );
}