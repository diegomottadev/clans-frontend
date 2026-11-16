import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Loading from '../../components/Loading';
import axios from 'axios';
import {BASE_URL} from '../../helpers/BaseUrl';
import { sortQuery } from '../../helpers/listQuery';
import { Dropdown } from 'primereact/dropdown';
import Error from '../../components/Error';

export default function Level({  usuario}) {

    let emptyLevel= {
        name: '',
        languaje: null,
        fee: 0,
        typeCourse: null,
        monthInit: null,
        monthFinish: null,
    };
    const [showError, setShowError] = useState(false);

    const [levels, setLevels] = useState(null);
    const [loading, setLoading] = useState(false);
    const [level,setLevel] = useState(emptyLevel)
    const [levelDialog, setLevelDialog] = useState(false);
    const [languajes, setLanguajes] = useState(null);
    const [months, setMonths] = useState(null);
    const [typeCourses, setTypeCourses] = useState(null);
    const [deleteLevelDialog, setDeleteLevelDialog] = useState(false);

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

    useEffect(()=>{
        setLoading(false);
        async function loadDropdownData() {
            try {
                const [languajesRes, monthsRes, typeCoursesRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/languajes`),
                    axios.get(`${BASE_URL}/api/months`),
                    axios.get(`${BASE_URL}/api/typeCourses`),
                ]);
                setLanguajes(languajesRes.data.data.data);
                setMonths(monthsRes.data.data);
                setTypeCourses(typeCoursesRes.data.data.data);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema al cargar los niveles');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadDropdownData();
    },[]);

    useEffect(() => {
        async  function loadLazyData () {
            try{
                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/levels/?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/levels/?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.name.value)}`;
                }
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  levels}}) => {
                    // console.log(students)
                    setTotalRecords(levels.meta.pagination.total);
                    setLevels(levels.data)
                    setLoadingDatatable(false);
                });
            }catch(err){
                console.warn('Hubo un problema al cargar los niveles.');
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al cargar los niveles', life: 3000 });
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
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }

    const formatCurrency = (value) => {
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    const openNew = () => {
        setLevel(emptyLevel);
        setSubmitted(false);
        setLevelDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setLevelDialog(false);
    }

    const hideDeleteLevelDialog = () => {
        setDeleteLevelDialog(false);
    }


    async function updateLevels(){
        const {data: {data:{data: levels}}} = await axios.get(`${BASE_URL}/api/levels`);
        setLevels(levels)
    }

     async function saveLevel()  {

            try {
                setSubmitted(true);
                if(level.id){
                    await axios.put(`${BASE_URL}/api/levels/${level.id}`, level).then(function(){
                        setLazyParams({...lazyParams,page: 0})
                        setSubmitted(false);
                        toast.current.show({ severity: 'success', summary: 'Exito', detail:`Nivel actualizado`, life: 3000 });
                    });
                }else{
                    await axios.post(`${BASE_URL}/api/levels`, level).then(function(){
                        setLazyParams({...lazyParams,page: 0})
                        setSubmitted(false);
                        toast.current.show({ severity: 'success', summary: 'Exito', detail:`Nivel agregado`, life: 3000 });
                    });

                }
                setLevel(emptyLevel);
                setLevelDialog(false);
              } catch (error) {
                console.error(error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el nivel', life: 3000 });
      
              } 
        }
       
      
      const editLevel = (_level) => {
        let editLevel= {
            id: _level.id,
            name: _level.name,
            languaje: _level.languaje.id,
            fee: _level.fee,
            typeCourse: _level.typeCourse.id,
            monthInit:  _level.monthInit,
            monthFinish:  _level.monthFinish,
        };
        setLevel({ ...editLevel });
        setLevelDialog(true);
    }

    const confirmDeleteProduct = (_level) => {
        let deleleLevel= {
            id: _level.id,
            name: _level.name,
            languaje: _level.course.id,
            fee: _level.fee,
            typeCourse: _level.typeCourse,
            monthInit:  _level.monthInit,
            monthFinish:  _level.monthFinish,
        };
        setLevel({ ...deleleLevel });     
        setDeleteLevelDialog(true);
    }

    async function deleteLevel() {
        try{
            await axios.delete(`${BASE_URL}/api/levels/${level.id}`).then(function(){
                setDeleteLevelDialog(false);
                setLevel(emptyLevel);
                updateLevels();
                toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Nivel eliminado', life: 3000 });
            });

        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el nivel', life: 3000 });
        } 
    }

    

    const exportCSV = () => {
        dt.current.exportCSV();
    }



    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _level = { ...level };
        _level[`${name}`] = val;

        setLevel(_level);
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
            </React.Fragment>
        )
    }


    const priceBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Cuota</span>
                {formatCurrency(parseFloat(rowData.fee))}
            </>
        );
    }


    const actionBodyTemplate = (rowData) => {
        return (
            <div className="actions">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editLevel(rowData)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteProduct(rowData)} />
            </div>
        );
    }

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de niveles</span>
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

    const levelDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveLevel} />
        </div>
    );
    const deleteLevelDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteLevelDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteLevel} />
        </div>
    );


    if(loading){
        return (
            <Loading/> 
        );
    } 

    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de niveles'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-layer-group" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Niveles</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de niveles</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={levels} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                     
                       {/*  <Column field="id" header="Id" sortable ></Column>*/} 
                        <Column field="name" header="Nombre" sortable ></Column>
                        <Column field="languaje.nombre" header="Idioma" sortable ></Column>
                        <Column field="typeCourse.nombre" header="Tipo de curso" sortable ></Column>
                        <Column field="fee" header="Cuota"   body={priceBodyTemplate} sortable ></Column>

                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={levelDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del nivel" modal className="p-fluid" footer={levelDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={level.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !level.name })} />
                            {submitted && !level.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                       <div className="p-field">
                            <label htmlFor="languaje">Idioma</label>
                            <Dropdown appendTo={document.body} value={level.languaje}  onChange={(e) => onInputChange(e,'languaje')} options={languajes} optionValue="id" optionLabel="name"  placeholder="-- Seleccione un idioma --" className={classNames({ 'p-invalid': submitted && !level.languaje })}/>
                            {submitted && !level.languaje && <small className="p-invalid">Idioma es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="typeCourse">Tipo de curso</label>
                            <Dropdown appendTo={document.body} value={level.typeCourse}  onChange={(e) => onInputChange(e,'typeCourse')} options={typeCourses} optionValue="id" optionLabel="name"  placeholder="-- Seleccione un tipo de curso --" className={classNames({ 'p-invalid': submitted && !level.typeCourse })}/>
                            {submitted && !level.typeCourse && <small className="p-invalid">Tipo de cursos es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="fee">Cuota</label>
                            <InputNumber id="fee" value={level.fee} onValueChange={(e) => onInputChange(e, 'fee')} mode="currency" currency="ARS" locale="es-AR" />
                        </div>

                        <div className="p-field">
                            <div className="p-formgrid p-grid">
                                <div className="p-col-6">
                                    <label htmlFor="monthStarted">Mes desde</label>
                                    <Dropdown appendTo={document.body} value={level.monthInit} onChange={(e) => onInputChange(e,'monthInit')} options={months} optionValue="id"  optionLabel="name" placeholder="-- Seleccione mes desde --" />
                                </div>

                                <div className="p-col-6">
                                    <label htmlFor="monthFinished">Mes hasta</label>
                                    <Dropdown  appendTo={document.body} value={level.monthFinish} onChange={(e) =>  onInputChange(e,'monthFinish')} options={months} optionValue="id"  optionLabel="name" placeholder="-- Seleccione mes hasta --" />
                                </div>
                            </div>
                        </div> 
                    </Dialog>

                    <Dialog visible={deleteLevelDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteLevelDialogFooter} onHide={hideDeleteLevelDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {level && <span>Confirma eliminar el nivel <b>{level.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}