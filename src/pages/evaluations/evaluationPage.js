import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { addLocale } from 'primereact/api';
import classNames from 'classnames';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Editor } from 'primereact/editor';
import Error from '../../components/Error';
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';


export default function EvalutionB() {

    let emptyEvaluation = {
        id: null,
        name: '',
        typeEvaluation: null,
        course: null,
        date: null,
    };

    addLocale('es', {
        firstDayOfWeek: 1,
        dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
        dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Hoy',
        clear: 'Claro'
    });
    const [showError, setShowError] = useState(false);

    const [evaluations, setEvaluations] = useState(null);
    const [evaluation, setEvaluation] = useState(emptyEvaluation);
    const [courses, setCourses] = useState(null);
    const [typeEvaluations, setTypeEvaluations] = useState(null);
    const [evaluationDialog, setEvaluationDialog] = useState(false);
    const [deleteEvaluationDialog, setDeleteEvaluationDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [ active, setActive] = useState(0);
    const [ studentsEvaluated, setStudentsEvaluated] = useState([]);
    const [student, setStudent] = useState(null)
    const [students, setStudents] = useState(null)
    const [concepts, setConcepts] = useState(null)
    const [concept, setConcept] = useState(null)
    const [observation, setObservation ] = useState(null)

    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        async function loadSchoolYears() {
            try {
                const { data } = await axios.get(`${BASE_URL}/api/schoolYears?all=1`);
                const years = data.data.data;
                setSchoolYears(years);
                // No auto-seleccionar: los cursos con school_year_id NULL no matchearían
                // El usuario puede filtrar por año si lo necesita
            } catch (error) {
                console.warn('Hubo un problema con la carga de los años lectivos');
            }
        }
        loadSchoolYears();
    }, []);

    useEffect(()=>{
        async function loadDropdownData() {
            try {
                const [coursesRes, typeEvaluationsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/courses?all=1`),
                    axios.get(`${BASE_URL}/api/typeEvaluations?all=1`),
                ]);
                setCourses(coursesRes.data.data.data);
                setTypeEvaluations(typeEvaluationsRes.data.data.data);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de evaluaciones');
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
                const schoolYearId = schoolYear ? schoolYear.id : '';
                let url = `${BASE_URL}/api/evaluations?page=${lazyParams.page+1}&schoolYearId=${schoolYearId}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.name!==undefined && lazyParams.filters.name!==""){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/evaluations?page=${lazyParams.page+1}&schoolYearId=${schoolYearId}&${keys[0]}=${lazyParams.filters.name.value}`;
                }
                await axios.get(url).then(({data: {data: evaluations}}) => {
                    setTotalRecords(evaluations.meta.pagination.total);
                    setEvaluations(evaluations.data);
                    setLoadingDatatable(false);
                });
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de evaluaciones.');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    },[lazyParams, schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

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
            name:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...event };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }, 400);

    const openNew = () => {
        setEvaluation(emptyEvaluation);
        setSubmitted(false);
        setEvaluationDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setActive(0);
        setStudentsEvaluated([])
        setEvaluationDialog(false);
    }

    const hideDeleteEvaluationDialog = () => {
        setDeleteEvaluationDialog(false);
    }

    async function updateEvaluations() {
        const { data: { data:{ data: evaluations } }} = await axios.get(`${BASE_URL}/api/evaluations`);
        setEvaluations(evaluations)
    }
   
    async function saveEvaluation() {
        try {
            setSubmitted(true);

            if (evaluation.id) {
                await axios.put(`${BASE_URL}/api/evaluations/${evaluation.id}`, evaluation).then(data =>{
                    setLazyParams({...lazyParams,page: 0})
                    setEvaluationDialog(false);
                    setSubmitted(false);
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Evaluación ${evaluation.name} actualizada`, life: 3000 });
                });
                
            } else {
                if(evaluation.name && evaluation.course && evaluation.typeEvaluation){
                    
                    await axios.post(`${BASE_URL}/api/evaluations`, evaluation).then(({data}) => {
                      setLazyParams({...lazyParams,page: 0})
                      setSubmitted(false);
                      setEvaluation({...evaluation,id:data.data.id})
                      setActive(1);      
                      axios.get(`${BASE_URL}/api/courses/${evaluation.course}`).then(({data: {data: course} })=>setStudents(course.students.data));
                      loadConcept(evaluation.course);
                      toast.current.show({ severity: 'success', summary: 'Exito', detail: `Evaluación ${evaluation.name} creada`, life: 3000 });

                    });
                   
                }
            }

        } catch (error) {
            console.error(error)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar la evaluación', life: 3000 });
        }
    }


    async function addEvaluationStudent() {

        try{
            setSubmitted(false);
            if(!student || student == null || !concept  || concept=== null){
                setSubmitted(true)
                return;
            }
            let body = {
                student: student.id,
                concept: concept.id,
                observation: observation,
                puntuation: concept.name 
            }
            
            axios.post(`${BASE_URL}/api/evaluations/${evaluation.id}/students`,body)
            .then(({data})=>{
                setLazyParams({...lazyParams,page: 0})
                setStudentsEvaluated( data.data.studentsEvaluated);
                setStudent(null);
                setConcept(null);
                setObservation(null);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Nota creada`, life: 3000 });
            }).catch(error =>{
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar la nota', life: 3000 });
            });
        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar la nota', life: 3000 });
        }
    }

    async function loadConcept(id_course){
        await axios.get(`${BASE_URL}/api/courses/${id_course}/concepts`).then(({data: {data: {data: concepts}} })=>setConcepts(concepts));
        id_course = null;
    }

    const editEvaluation = (_evaluation) => {
        loadConcept(_evaluation.id_course);
        let editEvaluation = {
            id: _evaluation.id,
            name: _evaluation.name,
            course: _evaluation.id_course,
            date: _evaluation.date != null ? new Date(_evaluation.date):null,
            typeEvaluation : _evaluation.typeEvaluation.id,
        };
        setStudentsEvaluated(studentsEvaluated => studentsEvaluated.concat( _evaluation.studentsEvaluated));
        setStudents(_evaluation.course.students);
        setEvaluation({ ...editEvaluation });
        setEvaluationDialog(true);
    }

    const confirmDeleteEvaluation = (evaluation) => {
        let deleteEvaluation= {
            id: evaluation.id,
            name: evaluation.name,
        };
        setEvaluation({ ...deleteEvaluation });     
        setDeleteEvaluationDialog(true);

    }

    async function deleteEvaluation() {
        try{
            await axios.delete(`${BASE_URL}/api/evaluations/${evaluation.id}`).then(data =>{
                setLazyParams({...lazyParams,page: 0})
                setDeleteEvaluationDialog(false);
                setEvaluation(emptyEvaluation);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Evaluación ${evaluation.name} eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar la evaluación', life: 3000 });
        }

    }

    const confirmDeleteNote = (_student,index) => {
       
        async function deleteNote(){
            await axios.put(`${BASE_URL}/api/evaluations/${evaluation.id}/students/${_student.id}`).then(data =>{
                setStudentsEvaluated(studentsEvaluated.filter(student => student !== _student));
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Nota eliminada`, life: 3000 });
                setLazyParams({...lazyParams,page: 0})
            });
        }
        deleteNote();
    }


    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _evaluation = { ...evaluation };
        _evaluation[`${name}`] = val;

        setEvaluation(_evaluation);
    }


    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );



    const observationBodyTemplate = (rowData) => {
        return (
            <>
                <div dangerouslySetInnerHTML={{__html: rowData.pivot.observaciones}} />
            </>
        );
    }
    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editEvaluation(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteEvaluation(rowData)} />
        </div>
    );

    const actionBodyNoteTemplate = (rowData) => {
        return (
            <div className="actions">
                <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={(index) => confirmDeleteNote(rowData,index)} />
            </div>
        );
    }

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Detalle de evaluación</span>
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

    const evaluationDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveEvaluation} />
        </div>
    );

    const evaluationStudentDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Aceptar" icon="pi pi-check" className="p-button-success" onClick={hideDialog} />
        </div>
    );

    const deleteEvaluationDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteEvaluationDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteEvaluation} />
        </div>
    );
    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de evaluaciones'}></Error>
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
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Evaluaciones</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de evaluaciones</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>
                <div className="p-fluid p-formgrid p-grid p-mb-3">
                    <div className="p-field p-col-12 p-md-3">
                        <label htmlFor="schoolYear" className="p-d-block">Año lectivo</label>
                        <Dropdown
                            appendTo={document.body}
                            id="schoolYear"
                            value={schoolYear}
                            onChange={e => setSchoolYear(e.target.value || null)}
                            options={schoolYears}
                            optionLabel="year"
                            placeholder="-- Año lectivo --"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
                        <DataTable ref={dt} value={evaluations} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                        <Column field="id" header="Id" sortable></Column>
                        <Column field="name" header="Nombre" sortable></Column>
                        <Column field="date" header="Fecha" sortable></Column>
                        <Column field="course.nombre" header="Curso" sortable></Column>
                        <Column field="typeEvaluation.nombre" header="Tipo de evaluación" sortable></Column>
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Dialog visible={evaluationDialog} style={{ width: '70vw' }} header="Detalle de la evaluación" modal className="p-fluid" footer={active ?  evaluationStudentDialogFooter : evaluationDialogFooter} onHide={hideDialog}>
                        <TabView activeIndex={active} onTabChange={(e) => setActive(e.index)} className="tabview-custom">
                            <TabPanel header="Evaluación" rightIcon="pi pi-list">

                                <div className="p-fluid p-grid p-formgrid">
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="name">Nombre</label>
                                        <InputText id="name" value={evaluation.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !evaluation.name })} />
                                        {submitted && !evaluation.name && <small className="p-invalid">Nombre es requerido.</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="name">Tipo de evaluación</label>
                                        <Dropdown appendTo={document.body} value={evaluation.typeEvaluation}  onChange={(e) => onInputChange(e,'typeEvaluation')} options={typeEvaluations} optionValue="id" optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione un tipo de evaluacion --" className={classNames({ 'p-invalid': submitted && !evaluation.typeEvaluation })}/>
                                        {submitted && !evaluation.typeEvaluation && <small className="p-invalid">Tipo de evaluación es requerido.</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="name">Curso</label>
                                        <Dropdown appendTo={document.body} value={evaluation.course}  onChange={(e) => onInputChange(e,'course')} options={courses} optionValue="id" optionLabel="nameId" filter showClear filterBy="nameId" placeholder="-- Seleccione un curso --" className={classNames({ 'p-invalid': submitted && !evaluation.course })}/>
                                        {submitted && !evaluation.course && <small className="p-invalid">Curso es requerido.</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="spanish">Fecha</label>
                                        <Calendar  monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="spanish" value={evaluation.date || undefined} viewDate={new Date()} onChange={(e) => onInputChange(e, 'date')} locale="es" dateFormat="dd/mm/yy" />
                                    </div>
                                </div>

                            </TabPanel>
                            <TabPanel header="Notas" rightIcon="pi pi-th-large">
                                <div className="p-fluid p-grid p-formgrid">
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="student">Alumno</label>
                                        <Dropdown appendTo={document.body} value={student} onChange={e => setStudent(e.target.value)} options={students} optionLabel="name_complete" filter showClear filterBy="name_complete" placeholder="-- Seleccione alumno --" className={classNames({ 'p-invalid': submitted && !student })} />
                                        {submitted && !student && <small className="p-invalid">Alumno es requerido.</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6 ">
                                        <label htmlFor="student">Concepto</label>
                                        <Dropdown appendTo={document.body} value={concept} onChange={e => setConcept(e.target.value)} options={concepts} optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione concepto --" className={classNames({ 'p-invalid': submitted && !concept })} />
                                        {submitted && !concept && <small className="p-invalid">Concepto es requerido.</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-12">
                                        <label htmlFor="observation">Observaciones</label>
                                        <Editor style={{ height: '100px' }} value={observation || ''} onTextChange={(e) => setObservation(e.htmlValue)} />
                                    </div>
                                    <div className="p-field p-col-12 p-md-2">
                                        <label htmlFor="spanish">&nbsp;&nbsp;&nbsp;</label>
                                        <Button right label="Agregar" icon="pi pi-plus" onClick={addEvaluationStudent} className="p-button-info p-mr-2 p-mb-2" />
                                    </div>
                                    {studentsEvaluated.length > 0   &&
                                        <div className="p-fluid p-grid p-formgrid">
                                                    <h5>Notas</h5>
                                                     <DataTable value={studentsEvaluated}
                                                        dataKey="id" className="datatable-responsive datatable-compact">
                                                        <Column field="apellido_nombre_completo"  header="Apellido y Nombre"></Column>
                                                        <Column field="pivot.concept"  header="Concepto"></Column> 

                                                        <Column field="pivot.observaciones" body={observationBodyTemplate} header="Observación"></Column> 
                                                      <Column body={actionBodyNoteTemplate}></Column> 
                                                    </DataTable> 
                                        </div>
                                    } 
                                </div>

                            </TabPanel>
                        </TabView>
                    </Dialog>
                    <Dialog visible={deleteEvaluationDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteEvaluationDialogFooter} onHide={hideDeleteEvaluationDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {evaluation && <span>Confirma eliminar la evaluación <b>{evaluation.name}</b>?</span>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
