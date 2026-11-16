import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { sortQuery } from '../../helpers/listQuery';
import Loading from '../../components/Loading';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import Error from '../../components/Error';
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';

export default function ChangeYear() {

    let emptyAcademicYear = {
        year: '',
    };
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState(null);
    const [academicYear, setAcademicYear] = useState(emptyAcademicYear);
    const [academicYearDialog, setAcademicYearDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false); // eslint-disable-line no-unused-vars
    const [checked, setChecked] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const dt = useRef(null);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(() => {
        async  function loadLazyData () {
            try{

                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/schoolYears/?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.year!==undefined){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/schoolYears/?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.year.value)}`;
                }
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data: _academicYears}}) => {
                    setTotalRecords(_academicYears.meta.pagination.total);
                    setAcademicYears(_academicYears.data)
                    setLoadingDatatable(false);
                });
                      
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de años lectivos');
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


    const onFilter = useDebouncedCallback((e) => {
        const event = {filters:{
            year:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...event };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }, 400);
    async function generateNewYear() {
        try{
            setLoading(true);
            let url = `${BASE_URL}/api/schoolYears`;
            await axios.post(url).then((data) => {
                setLoading(false);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `${data.data}`, life: 3000 });
                setLazyParams({ ...lazyParams, page: 0 });
            }).catch((error) => {
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: `${error.response.data.message}`, life: 3000 });
            });
        }catch(err){
            console.error(err)
            setLoading(false);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error al generar un nuevo ciclo lectivo', life: 3000 }); 
        }
       
    }


    async function saveAcademicYear() {

        try {

            setSubmitted(true);
            if (academicYear.id) {
                await axios.put(`${BASE_URL}/api/schoolYears/${academicYear.id}`, academicYear).then(function(){
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Ciclo lectivo actualizado', life: 3000 });
                });
            }
            setAcademicYear(emptyAcademicYear);
            setAcademicYearDialog(false);
            setSubmitted(false);
            setLazyParams({ ...lazyParams, page: 0 })

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el ciclo lectivo', life: 3000 });

        }
    }


    const LeftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={generateNewYear} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const onInputChangeBox = (e, name) => {
        let _academicYear = { ...academicYear };
        _academicYear[`${name}`] = e.checked;
        setAcademicYear(_academicYear);
    }

    const editYear = (_academicYear) => {
        let __academicYear = {
            id: _academicYear.id,
            year: _academicYear.year,
            active: _academicYear.active,

        };
        setChecked(__academicYear.active);
        setAcademicYear({ ...__academicYear });
        setAcademicYearDialog(true);
    }

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de ciclos lectivos</span>
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => onFilter(e)} placeholder="Buscar..." style={{ width: '100%' }} />
            </span>
        </div>
    );
    

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editYear(rowData)} />
        </div>
    );

    const hideDialog = () => {
        setSubmitted(false);
        setAcademicYearDialog(false);
    }

    const levelDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveAcademicYear} />
        </div>
    );

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let updatedAcademicYear = { ...academicYear };
        updatedAcademicYear[`${name}`] = val;
        setAcademicYear(updatedAcademicYear);
    }

    const yearBodyTemplate = (rowData) => {
        if (rowData.active) {
            return (
                <>
                    <Tag className="p-mr-2" severity="success" value="En curso"></Tag>
                </>
            );
        } else {
            return (
                <>
                    <Tag className="p-mr-2" severity="warning" value="Finalizado"></Tag>
                </>
            );
        }

    }

    if (loading) {
        return (
            <Loading />
        );
    }

    if(showError){
        return(
          <Error mensaje={'Hubo un problema al cargar de los ciclos lectivos'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-calendar" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Años lectivos</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de ciclos lectivos</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {LeftToolbarTemplate()}
                </div>
                        <DataTable ref={dt} value={academicYears} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >

                        <Column field="year" header="Año lectivo" sortable ></Column>
                        <Column field="active" header="En curso" body={yearBodyTemplate}  ></Column>

                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>


                    <Dialog visible={academicYearDialog} breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }} header="Detalle del nivel" modal className="p-fluid" footer={levelDialogFooter} onHide={hideDialog}>
                        <div className="p-field p-col-12 p-md-12">
                            <label htmlFor="year">Año lectivo</label>
                            <InputText id="year" value={academicYear.year} onChange={(e) => onInputChange(e, 'year')} disabled />
                        </div>
                        {academicYear.id !== undefined &&
                            <div className="p-field-checkbox p-col-12 p-md-12">
                                <Checkbox inputId="active" checked={checked} onChange={(e) => {
                                    onInputChangeBox(e, 'active');
                                    setChecked(e.checked);
                                }
                                } />
                                <label htmlFor="status">Activo</label>
                            </div>
                        }
                    </Dialog>
                </div>
            </div>
            {/* <div className="p-col-3">
                <div className="card">
                    <div className="table-header">
                        <div className="p-fluid">
                            <div className="p-field p-col-12">
                                <label htmlFor="dateInit" className="p-d-block">Actualizar cursos al nuevo ciclo lectivo</label>
                                <Button label="Actualizar" icon="pi pi-plus" className="p-button-success" onClick={generateNewYear} style={{ borderRadius: 8 }} />

                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
}