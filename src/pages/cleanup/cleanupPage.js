import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import Loading from '../../components/Loading';

export default function CleanupPage() {

    const toast = useRef(null);
    const confirmToast = useRef(null);
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const hasData = previewData && Array.isArray(previewData) && previewData.length > 0;

    async function loadPreview() {
        try {
            setLoadingPreview(true);
            setPreviewData(null);
            const { data } = await axios.get(`${BASE_URL}/api/schoolYears/duplicateCourses/preview`);
            setPreviewData(data.data);
        } catch (err) {
            console.error(err);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar el preview. Intente nuevamente.',
                life: 4000
            });
        } finally {
            setLoadingPreview(false);
        }
    }

    async function executeDeletion() {
        confirmToast.current.clear();
        try {
            setLoadingDelete(true);
            const { data } = await axios.delete(`${BASE_URL}/api/schoolYears/duplicateCourses`);
            toast.current.show({
                severity: 'success',
                summary: 'Limpieza completada',
                detail: data?.message || 'Los cursos duplicados fueron eliminados correctamente.',
                life: 5000
            });
            setPreviewData(null);
        } catch (err) {
            console.error(err);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: err?.response?.data?.message || 'Ocurrió un error durante la limpieza.',
                life: 5000
            });
        } finally {
            setLoadingDelete(false);
        }
    }

    function showConfirmToast() {
        confirmToast.current.show({
            severity: 'warn',
            sticky: true,
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.6rem', color: '#e65100' }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#7f3900' }}>
                                ¿Confirmar limpieza permanente?
                            </div>
                            <div style={{ fontSize: '0.87rem', color: '#bf360c', marginTop: 3 }}>
                                Se eliminarán <strong>{previewData?.length}</strong> curso(s) con sus fechas y evaluaciones.
                                Esta acción <strong>no se puede deshacer</strong>.
                            </div>
                        </div>
                    </div>
                    <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={() => confirmToast.current.clear()}
                        />
                        <Button
                            label="Sí, eliminar"
                            icon="pi pi-trash"
                            className="p-button-danger p-button-sm"
                            onClick={executeDeletion}
                        />
                    </div>
                </div>
            )
        });
    }

    if (loadingDelete) {
        return <Loading />;
    }

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-trash" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Limpieza de cursos duplicados</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Detectar y eliminar cursos duplicados del ciclo anterior</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <Toast ref={confirmToast} position="center" />

                    <div className="p-mb-4">
                        <h4 className="p-m-0" style={{ color: '#495057' }}>
                            <i className="pi pi-info-circle p-mr-2" style={{ color: '#3ab54a' }}></i>
                            Instrucciones
                        </h4>
                        <p className="p-mt-2" style={{ color: '#6c757d', fontSize: '0.95rem' }}>
                            Esta herramienta detecta y elimina cursos duplicados del ciclo lectivo anterior.
                            Primero cargue el <strong>preview</strong> para ver qué se eliminará y luego confirme la limpieza.
                        </p>
                    </div>

                    {/* Botones en la misma fila */}
                    <div className="p-d-flex p-ai-center p-mb-4" style={{ gap: 12, flexWrap: 'wrap' }}>
                        <Button
                            label="Cargar preview"
                            icon="pi pi-eye"
                            className="p-button-outlined p-button-info"
                            onClick={loadPreview}
                            loading={loadingPreview}
                            disabled={loadingPreview || loadingDelete}
                        />
                        <Button
                            label="Eliminar cursos duplicados"
                            icon="pi pi-trash"
                            className="p-button-danger"
                            onClick={showConfirmToast}
                            disabled={!hasData || loadingPreview || loadingDelete}
                        />
                    </div>

                    {/* Spinner mientras carga el preview */}
                    {loadingPreview && (
                        <div className="p-d-flex p-jc-center p-mt-4">
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#4CAF50' }}></i>
                        </div>
                    )}

                    {/* Resultados del preview */}
                    {!loadingPreview && previewData !== null && (
                        <>
                            {!hasData ? (
                                <div
                                    className="p-d-flex p-ai-center p-p-3 p-mb-4"
                                    style={{ background: '#e8f5e9', borderRadius: 6, border: '1px solid #a5d6a7' }}
                                >
                                    <i className="pi pi-check-circle p-mr-2" style={{ color: '#388e3c', fontSize: '1.3rem' }}></i>
                                    <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                                        No se encontraron cursos duplicados. No es necesaria la limpieza.
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="p-d-flex p-ai-center p-p-3 p-mb-3"
                                        style={{ background: '#fff3e0', borderRadius: 6, border: '1px solid #ffcc80' }}
                                    >
                                        <i className="pi pi-exclamation-triangle p-mr-2" style={{ color: '#e65100', fontSize: '1.2rem' }}></i>
                                        <span style={{ color: '#bf360c', fontWeight: 600 }}>
                                            Se encontraron <strong>{previewData.length}</strong> curso(s) duplicado(s) que serán eliminados junto con sus datos asociados.
                                        </span>
                                    </div>

                                    <DataTable
                                        value={previewData}
                                        className="datatable-responsive datatable-compact"
                                        rowHover
                                        responsiveLayout="scroll"
                                    >
                                        <Column field="curso_nombre" header="Curso" sortable style={{ minWidth: '200px' }} />
                                        <Column field="nivel" header="Nivel" sortable style={{ minWidth: '120px' }} />
                                        <Column field="anio_academico" header="Ciclo lectivo" sortable style={{ minWidth: '130px' }} />
                                        <Column
                                            field="fechas_asistencia"
                                            header="Fechas"
                                            sortable
                                            style={{ minWidth: '90px', textAlign: 'center' }}
                                            body={(row) => (
                                                <span className="p-badge p-badge-warning">{row.fechas_asistencia ?? 0}</span>
                                            )}
                                        />
                                        <Column
                                            field="evaluaciones"
                                            header="Evaluaciones"
                                            sortable
                                            style={{ minWidth: '120px', textAlign: 'center' }}
                                            body={(row) => (
                                                <span className="p-badge p-badge-info">{row.evaluaciones ?? 0}</span>
                                            )}
                                        />
                                    </DataTable>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
