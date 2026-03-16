import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Loading from '../../components/Loading';
import axios from 'axios';
import {BASE_URL} from '../../helpers/BaseUrl';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import Error from '../../components/Error';

export default function Course(props){


    console.log(props.usuario);

    let emptyCourse= {
        name: '',
        teacher: null,
        level: null
    };
    
    const [courses, setCourses] = useState(null);
    const [teachers, setTeachers] = useState(null);
    const [levels, setLevels] = useState(null);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState(emptyCourse)
    const [courseDialog, setCourseDialog] = useState(false);
    const [deleteCourseDialog, setDeleteCourseDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [checked, setChecked] = useState(false);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(()=>{
        setLoading(false);
        async function loadDropdownData() {
            try {
                const [teachersRes, levelsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/teachers?all=1`),
                    axios.get(`${BASE_URL}/api/levels?all=1`),
                ]);
                setTeachers(teachersRes.data.data.data);
                setLevels(levelsRes.data.data.data);
            } catch (err) {
                console.log(err);
                console.warn('Hubo un problema con la carga de cursos.');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadDropdownData();
    },[]);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });


    useEffect(() => {
        async  function loadLazyData () {
            try{

                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/courses/?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/courses/?page=${lazyParams.page+1}&${keys[0]}=${lazyParams.filters.name.value}`;
                }
                await axios.get(url).then(({data: {data: courses}}) => {
                    setTotalRecords(courses.meta.pagination.total);
                    setCourses(courses.data);
                    setLoadingDatatable(false);
                });
                      
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de cursos.');
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
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }


    const onFilter = (e) => {
        const event = {filters:{
            name:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...event };
        _lazyParams['first'] = 0;
        setLazyParams(_lazyParams);
    }
    


    const openNew = () => {
        setCourse(emptyCourse);
        setSubmitted(false);
        setCourseDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setCourseDialog(false);
    }

    const hideDeleteCourseDialog = () => {
        setDeleteCourseDialog(false);
    }
    
    async function saveCourse()  {

            try {
          
                setSubmitted(true);
                if(course.id){
                    await axios.put(`${BASE_URL}/api/courses/${course.id}`, course).then(function(){
                        setSubmitted(false);
                        setLazyParams({...lazyParams,page: 0})
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: `Curso: ${course.name} actualizando`, life: 3000 });

                    });

                }else{
                    await axios.post(`${BASE_URL}/api/courses`, course).then(function(){
                        setSubmitted(false);
                        setLazyParams({...lazyParams,page: 0})
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: `Curso: ${course.name} agregado`, life: 3000 });
                    });
                }
                setCourse(emptyCourse);
                setCourseDialog(false);
              } catch (error) {
                console.error(error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el curso', life: 3000 });
              } 
     }
      
      const editCourse = (_course) => {
        let editCourse= {
            id: _course.id,
            name: _course.name,
            teacher: _course.teacher.id,
            level: _course.level.id,
            status: _course.status,
        };
        setCourse({...editCourse});
        setChecked(_course.status)
        setCourseDialog(true);
    }

    const confirmDeleteCourse = (_course) => {
        let deleleCourse= {
            id: _course.id,
            name: _course.name,
           
        };
        setCourse({ ...deleleCourse });     
        setDeleteCourseDialog(true);
    }

    async function deleteCourse() {

        try{
            await axios.delete(`${BASE_URL}/api/courses/${course.id}`).then(function(){
                setDeleteCourseDialog(false);
                setCourse(emptyCourse);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Curso: ${course.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el curso', life: 3000 });
        }

        
    }

    const onInputChangeBox = (e, name) => {
        let _course = { ...course };
        _course[`${name}`] = e.checked;
        setCourse(_course);
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _course = { ...course };
        _course[`${name}`] = val;

        setCourse(_course);
    }

    const teacherBodyTemplate = (rowData) => {
        return (
            <>
                {/* <span className="p-column-title">Docente</span> */}
                {rowData.teacher.nombre} {rowData.teacher.apellido} 

            </>
        );
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
            </React.Fragment>
        )
    }

    const actionBodyTemplate = (rowData) => {
        if (props.usuario.role === 'admin') {
            return (
                <div className="actions">
                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editCourse(rowData)} />
                    <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteCourse(rowData)} />
                </div>
            ) 
        }
        else {
            return (
                <div className="actions">

                </div>
            ) 
        }
    }

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de cursos</span>
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

    const courseDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveCourse} />
        </div>
    );
    const deleteCourseDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteCourseDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteCourse} />
        </div>
    );

    const statusBodyTemplate = (rowData) => {
        
        if (rowData.status) {
            return (
                <>
                    <Tag className="p-mr-2" severity="success" value="Activo"></Tag>
                </>
            );
        } else {
            return (
                <>
                    <Tag className="p-mr-2" severity="warning" value="Inactivo"></Tag>
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
                <Error mensaje={'Hubo un problema al cargar de cursos. Vuelva a refrescar'}></Error>
        );
    } 
    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-list" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Cursos</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de cursos</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {props.usuario.role === 'admin' && (
                        <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            {leftToolbarTemplate()}
                        </div>
                    )}

                    <DataTable ref={dt} value={courses} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                    
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="name" header="Nombre" sortable ></Column>
                        <Column field="level.nombre" header="Curso" sortable ></Column>
                        <Column field="teacher.nombre" header="Docente" body={teacherBodyTemplate}  ></Column>
                        <Column field="status" header="Estado" body={statusBodyTemplate} sortable  ></Column>

                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={courseDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle del idioma" modal className="p-fluid" footer={courseDialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="name">Nombre</label>
                            <InputText id="name" value={course.name || ''} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !course.name })} />

                            {submitted && !course.name && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="teacher">Docente</label>
                            <Dropdown appendTo={document.body} value={course.teacher || ''}  onChange={(e) => onInputChange(e,'teacher')} options={teachers} optionValue="id" optionLabel="completeName" filter showClear filterBy="completeName" placeholder="-- Seleccione un profesor --" className={classNames({ 'p-invalid': submitted && !course.teacher })}/>
                            {submitted && !course.teacher && <small className="p-invalid">Docente es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="name">Nivel</label>
                            <Dropdown appendTo={document.body} value={course.level || ''}  onChange={(e) => onInputChange(e,'level')} options={levels} optionValue="id" optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione un nivel --" className={classNames({ 'p-invalid': submitted && !course.level })}/>
                            {submitted && !course.level && <small className="p-invalid">Nivel es requerido.</small>}
                        </div>
                        { course.id > 0  &&
                                <div className="p-field-checkbox p-col-12 p-md-12">
                                    <Checkbox inputId="status" checked={checked} onChange={ (e) => { 
                                        onInputChangeBox(e, 'status');
                                        setChecked(e.checked);
                                        }
                                    } />
                                    <label htmlFor="status">Activo</label>
                                </div>
                        }
                    </Dialog>

                    <Dialog visible={deleteCourseDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteCourseDialogFooter} onHide={hideDeleteCourseDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {course && <span>Confirma eliminar el nivel <b>{course.name}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}