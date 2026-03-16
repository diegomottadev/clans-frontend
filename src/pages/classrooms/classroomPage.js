import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import Error from '../../components/Error';

export default function ClassroomPage() {

    let emptyClassroom = { name: '', capacity: '' };

    const [classrooms, setClassrooms] = useState(null);
    const [classroom, setClassroom] = useState(emptyClassroom);
    const [classroomDialog, setClassroomDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });
    const toast = useRef(null);
    const dt = useRef(null);

    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

    useEffect(() => {
        loadData();
    }, [lazyParams]); // eslint-disable-line react-hooks/exhaustive-deps

    async function loadData() {
        try {
            setLoadingDatatable(true);
            const { data: { data: result } } = await axios.get(`${BASE_URL}/api/classrooms?page=${lazyParams.page + 1}`);
            setClassrooms(result.data);
            setTotalRecords(result.meta.pagination.total);
        } catch (err) {
            console.error(err);
            setShowError(true);
        } finally {
            setLoadingDatatable(false);
        }
    }

    const onPage = (event) => setLazyParams({ ...lazyParams, ...event });

    const openNew = () => {
        setClassroom(emptyClassroom);
        setSubmitted(false);
        setClassroomDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setClassroomDialog(false);
    };

    const hideDeleteDialog = () => setDeleteDialog(false);

    const editClassroom = (rowData) => {
        setClassroom({ id: rowData.id, name: rowData.name, capacity: rowData.capacity || '' });
        setClassroomDialog(true);
    };

    const confirmDelete = (rowData) => {
        setClassroom({ id: rowData.id, name: rowData.name });
        setDeleteDialog(true);
    };

    const onInputChange = (e, field) => {
        setClassroom({ ...classroom, [field]: e.target.value });
    };

    const saveClassroom = async () => {
        setSubmitted(true);
        if (!classroom.name) return;

        try {
            if (classroom.id) {
                await axios.put(`${BASE_URL}/api/classrooms/${classroom.id}`, classroom);
                toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Aula actualizada', life: 3000 });
            } else {
                await axios.post(`${BASE_URL}/api/classrooms`, classroom);
                toast.current.show({ severity: 'success', summary: 'Creado', detail: 'Aula creada', life: 3000 });
            }
            setClassroomDialog(false);
            loadData();
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el aula.', life: 4000 });
        }
    };

    const deleteClassroom = async () => {
        try {
            await axios.delete(`${BASE_URL}/api/classrooms/${classroom.id}`);
            toast.current.show({ severity: 'success', summary: 'Eliminado', detail: `Aula ${classroom.name} eliminada`, life: 3000 });
            setDeleteDialog(false);
            loadData();
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.', life: 4000 });
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editClassroom(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDelete(rowData)} />
        </div>
    );

    const capacityBody = (rowData) => (
        <span>{rowData.capacity ? `${rowData.capacity} personas` : '—'}</span>
    );

    const dialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveClassroom} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteClassroom} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-th-large" style={{ color: '#3ab54a', fontSize: '1rem' }} />
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem', ...font }}>Aulas</span>
                <span style={{ background: '#ECEFF1', color: '#37474F', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #B0BEC5' }}>
                    {totalRecords} total
                </span>
            </div>
        </div>
    );

    if (showError) return <Error mensaje="Hubo un problema al cargar las aulas" />;

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-th-large" style={{ color: '#fff', fontSize: '1.4rem' }} />
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>Aulas</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>Gestión de aulas y espacios</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />

                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Button label="Nueva aula" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
                    </div>

                    <DataTable ref={dt} value={classrooms} lazy paginator first={lazyParams.first} rows={10}
                        totalRecords={totalRecords} onPage={onPage} loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover>
                        <Column field="name" header="Nombre" sortable />
                        <Column field="capacity" header="Capacidad" body={capacityBody} style={{ width: '180px' }} />
                        <Column body={actionBodyTemplate} style={{ width: '120px' }} />
                    </DataTable>

                    <Dialog visible={classroomDialog} breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '450px' }}
                        header={classroom.id ? 'Editar Aula' : 'Nueva Aula'} modal className="p-fluid" footer={dialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={classroom.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus
                                className={classNames({ 'p-invalid': submitted && !classroom.name })} />
                            {submitted && !classroom.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="capacity">Capacidad</label>
                            <InputText id="capacity" value={classroom.capacity} onChange={(e) => onInputChange(e, 'capacity')}
                                keyfilter="int" placeholder="Opcional" />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteDialogFooter} onHide={hideDeleteDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Eliminar el aula <b>{classroom.name}</b>?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
