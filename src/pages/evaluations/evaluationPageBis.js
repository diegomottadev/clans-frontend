import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Loading from '../../components/Loading';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { appendSortParams } from '../../helpers/listQuery';
import { addLocale } from 'primereact/api';
import classNames from 'classnames';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import Error from '../../components/Error';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';


export default function Evalution() {

    let emptyEvaluation = {
        id: null,
        name: '',
        typeEvaluation: null,
        course: null,
        date: null,
    };


    let emptyScore = {
            listening: null,
            vocabulary: null,
            languajeFocus: null,
            reading: null,
            communication: null,
            writing : null,
            oralExam: null,
            pending:false,
            delivered:false,
            assigned:false,
            observaciones:''
        
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
    const [score] = useState(emptyScore); // eslint-disable-line no-unused-vars
    const [courses, setCourses] = useState([]);
    const [typeEvaluations, setTypeEvaluations] = useState(null);
    const [levels, setLevels] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [schoolYear, setSchoolYear] = useState(undefined); // undefined = todavía no cargado
    const [levelFilter, setLevelFilter] = useState(null);
    const [courseFilter, setCourseFilter] = useState(null);
    const [dateFilter, setDateFilter] = useState(null);
    const [evalCounts, setEvalCounts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [evaluationDialog, setEvaluationDialog] = useState(false);
    const [deleteEvaluationDialog, setDeleteEvaluationDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [ active, setActive] = useState(0);
    const [ studentsEvaluated, setStudentsEvaluated] = useState([]); // eslint-disable-line no-unused-vars
    const [students, setStudents] = useState(null)
    const [scores,setScores] = useState([]); // eslint-disable-line no-unused-vars
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [studentWithScore,setStudentWithScore] = useState([]);
    const [studentsEvaluatedUseEffect] = useState(null) // eslint-disable-line no-unused-vars
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        setLoading(false);
        async function loadSchoolYears() {
            try {
                const { data: { data: { data: years } } } = await axios.get(`${BASE_URL}/api/schoolYears?all=1`);
                setSchoolYears(Array.isArray(years) ? years : []);
                const vigente = Array.isArray(years) ? years.find(y => y.active === true) : null;
                setSchoolYear(vigente || null);
            } catch (err) {
                console.warn('Hubo un problema con la carga de años lectivos');
                setSchoolYear(null); // Desbloquear loadLazyData aunque falle
            }
        }
        loadSchoolYears();
    }, []);

    useEffect(() => {
        async function loadDropdownData() {
            try {
                const [typeEvaluationsRes, levelsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/typeEvaluations?all=1`),
                    axios.get(`${BASE_URL}/api/levels?all=1`),
                ]);
                setTypeEvaluations(typeEvaluationsRes.data.data.data);
                // API levels puede devolver { data: { data: [...] } } o { data: { data: { data: [...] } } }
                const rawLevels = levelsRes.data?.data;
                const levelsList = Array.isArray(rawLevels) ? rawLevels : (rawLevels?.data != null) ? (Array.isArray(rawLevels.data) ? rawLevels.data : rawLevels.data?.data ?? []) : [];
                setLevels(levelsList);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de evaluaciones');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadDropdownData();
    }, []);

    useEffect(() => {
        async function loadCourses() {
            if (!schoolYear || !schoolYear.id) {
                setCourses([]);
                setCourseFilter(null);
                return;
            }
            try {
                const { data } = await axios.get(`${BASE_URL}/api/courses?all=1&schoolYearId=${schoolYear.id}`);
                const raw = data?.data;
                const list = Array.isArray(raw) ? raw : (raw?.data) ? raw.data : [];
                setCourses(list);
                setCourseFilter(null);
            } catch (err) {
                console.warn('Hubo un problema con la carga de cursos');
                setCourses([]);
            }
        }
        loadCourses();
    }, [schoolYear]);


    useEffect(() => {
        if (schoolYear === undefined) return; // Esperar a que se resuelva el año activo
        async function loadLazyData() {
            try {
                setLoadingDatatable(true);
                const params = new URLSearchParams();
                params.set('page', String(lazyParams.page + 1));
                if (schoolYear && schoolYear.id != null) {
                    params.set('schoolYearId', String(schoolYear.id));
                }
                if (lazyParams.filters !== undefined && lazyParams.filters.name !== undefined && lazyParams.filters.name.value != null && String(lazyParams.filters.name.value).trim() !== '') {
                    params.set('name', String(lazyParams.filters.name.value).trim());
                }
                if (levelFilter != null) {
                    const levelId = typeof levelFilter === 'object' && levelFilter?.id != null ? levelFilter.id : levelFilter;
                    params.set('levelId', String(levelId));
                }
                if (courseFilter != null && courseFilter.id != null) {
                    params.set('courseId', String(courseFilter.id));
                }
                if (dateFilter != null) {
                    const d = dateFilter instanceof Date ? dateFilter : new Date(dateFilter);
                    params.set('date', d.toISOString().split('T')[0]);
                }
                appendSortParams(params, lazyParams);
                const url = `${BASE_URL}/api/evaluations?${params.toString()}`;
                const { data } = await axios.get(url);
                // Aceptar respuesta paginada { data: { data: [], meta: { pagination: { total } } } } o array directo { data: [] }
                const isPaginated = data && typeof data.data === 'object' && !Array.isArray(data.data) && Array.isArray(data.data?.data);
                const list = isPaginated ? (data.data?.data ?? []) : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
                const total = isPaginated && data.data?.meta?.pagination?.total != null
                    ? data.data.meta.pagination.total
                    : (Array.isArray(list) ? list.length : 0);
                setTotalRecords(total);
                setEvaluations(list);
                setSubmitted(false);
                setActive(0);
                setStudentsEvaluated([]);
                setStudentWithScore([]);
                setLoadingDatatable(false);

                // Fetch counts con los mismos filtros activos
                try {
                    const countParams = new URLSearchParams();
                    if (schoolYear && schoolYear.id != null) countParams.set('schoolYearId', String(schoolYear.id));
                    if (levelFilter != null) {
                        const lvl = typeof levelFilter === 'object' && levelFilter?.id != null ? levelFilter.id : levelFilter;
                        countParams.set('levelId', String(lvl));
                    }
                    if (courseFilter != null && courseFilter.id != null) countParams.set('courseId', String(courseFilter.id));
                    if (dateFilter != null) {
                        const d = dateFilter instanceof Date ? dateFilter : new Date(dateFilter);
                        countParams.set('date', d.toISOString().split('T')[0]);
                    }
                    if (lazyParams.filters?.name?.value && String(lazyParams.filters.name.value).trim() !== '') {
                        countParams.set('name', String(lazyParams.filters.name.value).trim());
                    }
                    const { data: countData } = await axios.get(`${BASE_URL}/api/evaluations/counts?${countParams.toString()}`);
                    setEvalCounts(countData?.data ?? null);
                } catch (_) { /* silencioso */ }
            } catch (err) {
                console.log(err);
                console.warn('Hubo un problema con la carga de evaluaciones.');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    }, [lazyParams, schoolYear, levelFilter, courseFilter, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const value = e.target.value;
        const eventData = { filters: { name: { value } } };
        setLazyParams(prev => ({ ...prev, ...eventData, first: 0, page: 0 }));
    }, 400);

    const openNew = () => {
        setEvaluation(emptyEvaluation);
        setSubmitted(false);
        setEvaluationDialog(true);
    }

    const hideDialog = () => {
    
        setLazyParams({...lazyParams,page: 0})
        setEvaluationDialog(false);
    }

    const hideDeleteEvaluationDialog = () => {
        setDeleteEvaluationDialog(false);
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
                if(evaluation.name && evaluation.course && evaluation.typeEvaluation && evaluation.date){
                    
                    await axios.post(`${BASE_URL}/api/evaluations`, evaluation).then(({data}) => {
                      setLazyParams({...lazyParams,page: 0})
                      setSubmitted(false);
                      setEvaluation({...evaluation,id:data.data.id})
                      //setActive(1);      
                      setEvaluationDialog(false);

                      axios.get(`${BASE_URL}/api/courses/${evaluation.course}`).then(({data: {data: course} })=>setStudents(course.students.data));
                      toast.current.show({ severity: 'success', summary: 'Exito', detail: `Evaluación ${evaluation.name} creada`, life: 3000 });
                    });
                }
            }

        } catch (error) {
            console.error(error)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar la evaluación', life: 3000 });
        }
    }

    const editEvaluation = (_evaluation) => {
        
        let editEvaluation = {
            id: _evaluation.id,
            name: _evaluation.name,
            course: _evaluation.id_course,
            date: _evaluation.date != null ? new Date(_evaluation.date):null,
            typeEvaluation : _evaluation.typeEvaluation.id,
        };
        setStudents(_evaluation.course.students);
        setStudentsEvaluated(studentsEvaluated => studentsEvaluated.concat( _evaluation.studentsEvaluated));
        
    
        _evaluation.course.students.map(std =>{

            let studentWithScoreCurrent = getStudentWithScoreCurrent(std,_evaluation);
            if (studentWithScoreCurrent!==undefined){
                    

                    setStudentWithScore( arr => [...arr, {"stdId":std.id,"attrs":studentWithScoreCurrent.pivot}]); 
            }else{
                    setStudentWithScore( arr => [...arr, {"stdId":std.id,"attrs":emptyScore}]); 
            };
            return std;
        })

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

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editEvaluation(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteEvaluation(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de evaluaciones</span>
            </div>
            {/* Chips de estadística - margen derecho */}
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#e8f5e9', border: '1.5px solid #a5d6a7', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4CAF50', flexShrink: 0, boxShadow: '0 0 0 2px rgba(76,175,80,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2e7d32', lineHeight: 1 }}>{evalCounts !== null ? evalCounts.with_notes : '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#388e3c', fontWeight: 600 }}>Con notas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFF3E0', border: '1.5px solid #FFCC80', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF9800', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,152,0,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#E65100', lineHeight: 1 }}>{evalCounts !== null ? evalCounts.without_notes : '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#BF360C', fontWeight: 600 }}>Sin notas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ECEFF1', border: '1.5px solid #B0BEC5', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#78909C', flexShrink: 0, boxShadow: '0 0 0 2px rgba(120,144,156,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#37474F', lineHeight: 1 }}>{evalCounts !== null ? evalCounts.total : totalRecords}</span>
                    <span style={{ fontSize: '0.75rem', color: '#546E7A', fontWeight: 600 }}>Total</span>
                </div>
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
            <Button label="Aceptar" icon="pi pi-check" className="p-button-success" onClick={saveNotesToEvaluations} />
        </div>
    );

    const deleteEvaluationDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteEvaluationDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteEvaluation} />
        </div>
    );

    async function saveNotesToEvaluations() {
        setSubmitted(true);
        try{
            let body = {
                studentWithScore
            }

            axios.post(`${BASE_URL}/api/evaluations/${evaluation.id}/students`,body).then(({data})=>{
                setLazyParams({...lazyParams,page: 0})
                setStudentsEvaluated( data.data.studentsEvaluated);
                setSubmitted(false);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Notas creadas y asociadas a la evaluación`, life: 3000 });
            }) 
        }
        catch ( error){
            console.error(error)
            //toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar la notas asociadas a la evalación', life: 3000 });
        }
    }


    const setchecked = (index,e, name) =>{
        let value1 = null
        let value2 = null
        let value3 = null 
        let result = studentWithScore[index];
        const old =result.attrs;

        if (name ==="pending" ){
             value1 = e.checked
             value2 = false
             value3 = false 
        }else if(name ==="delivered"){
            value2 = e.checked
            value1 = false
            value3 = false 
        } else if (name ==="assigned"){
            value3 = e.checked 
            value2 = false
            value1 = false
        }
        const updated1 = { ...old, pending: value1, delivered: value2, assigned: value3}
        const clone = [...studentWithScore];
        clone[index].attrs = updated1;
        setStudentWithScore(clone); 
    
    }

    // Function to validate and format decimal values
    const validateDecimalInput = (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        // Convert to string to handle the validation
        let stringValue = value.toString();
        
        // Remove any non-numeric characters except dots
        stringValue = stringValue.replace(/[^0-9.]/g, '');
        
        // Ensure only one dot is present
        const dotCount = (stringValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            // Keep only the first dot
            const firstDotIndex = stringValue.indexOf('.');
            stringValue = stringValue.substring(0, firstDotIndex + 1) + stringValue.substring(firstDotIndex + 1).replace(/\./g, '');
        }
        
        // Convert back to number
        const numValue = parseFloat(stringValue);
        
        if (isNaN(numValue)) {
            return null;
        }
        
        // Format to ensure at least 2 decimal places
        return parseFloat(numValue.toFixed(2));
    };

    const updateItem = (index,e, name) => {
       let result = studentWithScore[index];
        const old =result.attrs;
        let value = e.target !== undefined ? e.target.value : e.value 
        
        // Apply decimal validation for score fields
        if (['listening', 'vocabulary', 'languajeFocus', 'reading', 'communication', 'writing', 'oralExam'].includes(name)) {
            value = validateDecimalInput(value);
        }
        
        if (name ==="pending" ||name ==="delivered" ||name ==="assigned" ){
            value = e.checked 
        }
        const updated = { ...old, [name]:value}
        const clone = [...studentWithScore];
        clone[index].attrs = updated;
        setStudentWithScore(clone); 

        console.log(studentWithScore);

    }


    const checkScoreNew = (studentId)=>{ // eslint-disable-line no-unused-vars
        if (studentWithScore.length > 0){
                let result = studentWithScore.filter(assistanceStudent =>{
                        return assistanceStudent.stdId === studentId
                    }   
                );
                console.log(result);
            return result.stdId ===  studentId    ? false: true;
        }
    }


    function updateListScoreNew( studentId, scoreRecived){ // eslint-disable-line no-unused-vars
        console.log( studentId, scoreRecived);

        setStudentWithScore(scoress=>{
            const scoressActualizados = scoress.map(scoreData =>{
                if (scoreData.stdId === studentId ){
                     console.log(scoreData);
                     scoreData.attrs.listening = scoreRecived.listening !== null ? scoreRecived.listening : scoreData.attrs.listening 
                     scoreData.attrs.vocabulary = scoreRecived.vocabulary !== null ? scoreRecived.vocabulary: scoreData.attrs.vocabulary 
                     scoreData.attrs.languajeFocus = scoreRecived.languajeFocus !== null ? scoreRecived.languajeFocus : scoreData.attrs.languajeFocus
                     scoreData.attrs.reading = scoreRecived.reading !== null ?   scoreRecived.reading :scoreData.attrs.reading 
                     scoreData.attrs.communication = scoreRecived.communication !== null ? scoreRecived.communication: scoreData.attrs.communication 
                     scoreData.attrs.writing  = scoreRecived.writing !== null ? scoreRecived.writing: scoreData.attrs.writing
                     scoreData.attrs.oralExam = scoreRecived.oralExam !== null ? scoreRecived.oralExam:scoreData.attrs.oralExam

                     scoreData.attrs.pending = scoreRecived.pending !== null && scoreRecived.pending === "pending"? true :false
                     scoreData.attrs.delivered = scoreRecived.delivered !== null && scoreRecived.delivered === "delivered"? true : false
                     scoreData.attrs.assigned = scoreRecived.assigned !== null && scoreRecived.assigned === "assigned" ?  true : false


                     scoreData.attrs.observaciones = scoreRecived.observaciones !== null ? scoreRecived.observaciones:scoreData.attrs.observaciones
                }
                return scoreData;
            });
            return scoressActualizados;
        });
    }








    const getStudentWithScoreCurrent = (rowData,_evaluation) =>{

        if (_evaluation.studentsEvaluated !== undefined){
            let studentWithScoreCurrent = _evaluation.studentsEvaluated.filter(studentWithScore => 
            
                {
                    var val = false;    
                    if(studentWithScore!==undefined){
                        val = rowData.id === studentWithScore.id
                    }
                    return val;
                })
                return studentWithScoreCurrent[0]

        }

    }



    if (loading) {
        return (
            <Loading />
        );
    }

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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                            <rect x="4" y="3" width="16" height="18" rx="2"/>
                            <line x1="8" y1="8" x2="16" y2="8"/>
                            <line x1="8" y1="12" x2="13" y2="12"/>
                            <polyline points="8,16.5 10,18.5 16,14.5"/>
                        </svg>
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

                    {/* Filtros - mismo patrón que studentPage */}
                    <div className="p-fluid p-mb-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown
                                appendTo={document.body}
                                value={schoolYear}
                                onChange={e => {
                                    setSchoolYear(e.target.value ?? null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={[{ id: null, year: 'Todos' }, ...schoolYears]}
                                optionLabel="year"
                                placeholder="-- Año lectivo --"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Nivel</label>
                            <Dropdown
                                appendTo={document.body}
                                value={levelFilter}
                                onChange={e => {
                                    setLevelFilter(e.target.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={levels}
                                optionLabel="name"
                                optionValue="id"
                                placeholder="-- Todos --"
                                showClear
                                filter
                                filterBy="name"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <Dropdown
                                appendTo={document.body}
                                value={courseFilter}
                                onChange={e => {
                                    setCourseFilter(e.target.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={courses}
                                optionLabel="nameId"
                                optionValue="id"
                                placeholder="-- Todos --"
                                showClear
                                filter
                                filterBy="nameId"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha evaluación</label>
                            <Calendar
                                monthNavigator
                                yearNavigator
                                yearRange="2010:2050"
                                appendTo={document.body}
                                value={dateFilter || undefined}
                                viewDate={new Date()}
                                onChange={e => {
                                    setDateFilter(e.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                locale="es"
                                dateFormat="dd/mm/yy"
                                showButtonBar
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Buscar evaluación</label>
                            <span className="p-input-icon-left" style={{ width: '100%' }}>
                                <i className="pi pi-search" />
                                <InputText type="search" onInput={onFilter} placeholder="Nombre de evaluación..." style={{ width: '100%' }} />
                            </span>
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
                    <Dialog
                        visible={evaluationDialog}
                        style={{ width: '90vw', maxWidth: '900px' }}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3ab54a, #2a8a36)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <rect x="4" y="3" width="16" height="18" rx="2"/>
                                        <line x1="8" y1="8" x2="16" y2="8"/>
                                        <line x1="8" y1="12" x2="13" y2="12"/>
                                        <polyline points="8,16.5 10,18.5 16,14.5"/>
                                    </svg>
                                </div>
                                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1.1rem' }}>
                                    {evaluation.id ? 'Editar evaluación' : 'Nueva evaluación'}
                                </span>
                            </div>
                        }
                        modal className="p-fluid" footer={active ? evaluationStudentDialogFooter : evaluationDialogFooter} onHide={hideDialog}>
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
                                        <Calendar  monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="spanish" value={evaluation.date || undefined} viewDate={new Date()} onChange={(e) => onInputChange(e, 'date')} locale="es" dateFormat="dd/mm/yy" className={classNames({ 'p-invalid': submitted && !evaluation.date })} />
                                        {submitted && !evaluation.date && <small className="p-invalid">Fecha es requerida.</small>}
                                    </div>
                                </div>

                            </TabPanel>
                            <TabPanel header="Notas" rightIcon="pi pi-th-large">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {students && students.length > 0 ? students.map((student) => {
                                        const idx = studentWithScore ? studentWithScore.findIndex(s => s.stdId === student.id) : -1;
                                        if (idx === -1) return null;
                                        const stdS = studentWithScore[idx];
                                        const activeStatus = stdS.attrs.delivered ? 'delivered' : stdS.attrs.assigned ? 'assigned' : stdS.attrs.pending ? 'pending' : null;
                                        const scoreFields = [
                                            { key: 'listening',     label: 'Listening' },
                                            { key: 'vocabulary',    label: 'Vocabulary' },
                                            { key: 'languajeFocus', label: 'Lang. Focus' },
                                            { key: 'reading',       label: 'Reading' },
                                            { key: 'communication', label: 'Communication' },
                                            { key: 'writing',       label: 'Writing' },
                                            { key: 'oralExam',      label: 'Oral Exam' },
                                        ];
                                        const statusOptions = [
                                            { key: 'delivered', label: 'Entregado', color: '#3ab54a' },
                                            { key: 'assigned',  label: 'Asignado',  color: '#f59e0b' },
                                            { key: 'pending',   label: 'Pendiente', color: '#9ca3af' },
                                        ];
                                        return (
                                            <div key={student.id} style={{ border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                                                {/* Header alumno */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #f0faf2, #e8f5ea)', borderBottom: '1px solid #d4edda' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3ab54a, #2a8a36)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                                                            {student.name_complete?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '0.875rem' }}>{student.name_complete}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        {statusOptions.map(({ key, label, color }) => {
                                                            const isActive = activeStatus === key;
                                                            return (
                                                                <button key={key} type="button"
                                                                    onClick={() => { setchecked(idx, { checked: true }, key); updateItem(idx, { checked: true }, key); }}
                                                                    style={{ padding: '0.2rem 0.65rem', borderRadius: 20, border: `1.5px solid ${isActive ? color : '#dee2e6'}`, background: isActive ? color : '#fff', color: isActive ? '#fff' : '#6c757d', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', lineHeight: 1.5 }}>
                                                                    {label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {/* Grid de notas: 7 columnas en una fila */}
                                                <div style={{ padding: '0.75rem 1rem 0.5rem', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem 0.6rem' }}>
                                                    {scoreFields.map(({ key, label }) => (
                                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</label>
                                                            <InputNumber value={stdS.attrs[key]} onChange={(e) => updateItem(idx, e, key)} minFractionDigits={2} maxFractionDigits={2} step={0.01} inputStyle={{ padding: '0.3rem 0.4rem', fontSize: '0.82rem', width: '100%' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Observación — fila separada */}
                                                <div style={{ padding: '0 1rem 0.75rem' }}>
                                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Observación</label>
                                                    <InputTextarea value={stdS.attrs.observaciones || ''} onChange={(e) => updateItem(idx, e, 'observaciones')} rows={2} style={{ resize: 'none', fontSize: '0.85rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.2rem' }} />
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
                                            <i className="pi pi-users" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                            <span style={{ fontSize: '0.875rem' }}>No hay alumnos en este curso</span>
                                        </div>
                                    )}
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
