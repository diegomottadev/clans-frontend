import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';

export default function FixStudentNamesPage() {

    const toast = useRef(null);
    const dt = useRef(null);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    async function loadStudents() {
        try {
            setLoading(true);
            const { data } = await axios.get(`${BASE_URL}/api/students/swapped-names?filter=all`);
            setStudents(data.data || []);
            setTotalCount(data.total || 0);
            setSelectedStudents([]);
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los alumnos.', life: 4000 });
        } finally {
            setLoading(false);
        }
    }

    function confirmFix() {
        setConfirmDialog(true);
    }

    function hideConfirmDialog() {
        setConfirmDialog(false);
    }

    async function executeFix() {
        setConfirmDialog(false);
        const ids = selectedStudents.map(s => s.id);
        try {
            setFixing(true);
            const { data } = await axios.post(`${BASE_URL}/api/students/fix-swapped-names`, { ids });
            toast.current.show({ severity: 'success', summary: 'Corrección completada', detail: `Se corrigieron ${data.count} alumno(s).`, life: 5000 });
            await loadStudents();
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al corregir los nombres.', life: 5000 });
        } finally {
            setFixing(false);
        }
    }

    const confirmDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideConfirmDialog} />
            <Button label="Corregir" icon="pi pi-check" className="p-button-success" onClick={executeFix} />
        </div>
    );

    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

    const nombreBody = (rowData) => (
        <span style={{ color: '#495057', fontWeight: 600, ...font }}>{rowData.nombre}</span>
    );

    const apellidoBody = (rowData) => (
        <span style={{ color: '#495057', fontWeight: 600, ...font }}>{rowData.apellido}</span>
    );

    const correctNombreBody = (rowData) => (
        <span className="p-d-flex p-ai-center" style={{ gap: '0.4rem' }}>
            <i className="pi pi-arrow-right" style={{ color: '#3ab54a', fontSize: '0.85rem' }}></i>
            <span style={{ color: '#2e7d32', fontWeight: 600, ...font }}>{rowData.apellido}</span>
        </span>
    );

    const correctApellidoBody = (rowData) => (
        <span className="p-d-flex p-ai-center" style={{ gap: '0.4rem' }}>
            <i className="pi pi-arrow-right" style={{ color: '#3ab54a', fontSize: '0.85rem' }}></i>
            <span style={{ color: '#2e7d32', fontWeight: 600, ...font }}>{rowData.nombre}</span>
        </span>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <i className="pi pi-arrows-h" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem', ...font }}>Alumnos</span>
                <span style={{ background: '#ECEFF1', color: '#37474F', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #B0BEC5' }}>
                    {totalCount} total
                </span>
                {selectedStudents.length > 0 && (
                    <span style={{ background: '#e3f2fd', color: '#1565c0', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #90caf9' }}>
                        {selectedStudents.length} seleccionado(s)
                    </span>
                )}
            </div>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar..."
                        style={{ borderRadius: 8, width: '200px', ...font, fontSize: '0.88rem' }}
                    />
                </span>
                <Button
                    label={`Corregir seleccionados (${selectedStudents.length})`}
                    icon="pi pi-sync"
                    className="p-button-success"
                    style={{ borderRadius: 8, ...font }}
                    onClick={confirmFix}
                    disabled={fixing || selectedStudents.length === 0}
                />
            </div>
        </div>
    );

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #3ab54a, #1a5c25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(58,181,74,0.35)'
                    }}>
                        <i className="pi pi-users" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>
                            Corrección de Nombres
                        </h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>
                            Seleccione los alumnos con nombre y apellido invertidos para corregirlos
                        </p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <DataTable
                        ref={dt}
                        value={students}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        selection={selectedStudents}
                        onSelectionChange={(e) => setSelectedStudents(e.value)}
                        dataKey="id"
                        paginator
                        rows={20}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        className="datatable-responsive datatable-compact"
                        rowHover
                        stripedRows
                        emptyMessage="No se encontraron alumnos."
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                        <Column field="id" header="ID" style={{ width: '5rem' }} sortable />
                        <Column field="nombre" header="Nombre (en DB)" body={nombreBody} sortable />
                        <Column field="apellido" header="Apellido (en DB)" body={apellidoBody} sortable />
                        <Column header="Pasa a ser Nombre" body={correctNombreBody} />
                        <Column header="Pasa a ser Apellido" body={correctApellidoBody} />
                    </DataTable>

                    <Dialog visible={confirmDialog} style={{ width: '450px' }} header="Confirmar" modal footer={confirmDialogFooter} onHide={hideConfirmDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Confirma corregir nombre y apellido de <b>{selectedStudents.length}</b> alumno(s) seleccionado(s)?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
