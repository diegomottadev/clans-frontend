import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import Loading from '../../components/Loading';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { addLocale } from 'primereact/api';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import Error from '../../components/Error';
import { Message } from 'primereact/message';

import { InputText } from 'primereact/inputtext';
import { Editor } from 'primereact/editor';

const FileDownload = require('js-file-download');

export default function ReportAnalyticByStudent() {

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

    const toast = useRef(null);

    const [dateInit, setDateInit] = useState(null);
    const [dateFinish, setDateFinish] = useState(null);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(null); // eslint-disable-line no-unused-vars
    const [courses, setCourses] = useState(null);
    const [languaje, setLanguaje] = useState(null);
    const [course, setCourse] = useState(null);
    const [languajes, setLanguajes] = useState(null);
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);
    const [students, setStudents] = useState(null);
    const [student, setStudent] = useState(null);
    const [download, setDownload] = useState(false);
    const [chargingCourse, setChargingCourse] = useState(false);
    const [chargingStudent, setChargingStudent] = useState(false);
    const [oralidad, setOralidad] = useState('');
    const [participacion, setParticipacion] = useState('');
    const [cumplimiento, setCumplimiento] = useState('');
    const [observations, setObservations] = useState('');
    const [listening, setListening] = useState('');
    const [vocabulary, setVocabulary] = useState(''); 
    const [languajeFocus, setLanguajeFocus] = useState(''); 
    const [reading, setReading] = useState(''); 
    const [communication, setCommunication] = useState(''); 
    const [writing, setWriting] = useState(''); 
    const [oralExam, setOralExam] = useState(''); 
    const [pending , setPending] = useState(''); 
    const [delivered , setDelivered] = useState(''); 
    const [assigned , setAssigned] = useState(''); 
    const [units , setUnits] = useState(''); 
    const [typeAssistences , setTypeAssistences] = useState(null) ; 

    const [lazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(() => {
        async function loadSchoolYears() {
            try {
                await axios.get(`${BASE_URL}/api/schoolYears?all=1`).then(({ data: { data: { data: years } } }) => {
                    setSchoolYears(years);
                    const active = years.find(function(y) { return y.active === true; });
                    setSchoolYear(active || null);
                });
            } catch (error) {
                console.warn('Hubo un problema con la carga de los años lectivos');
            }
        }
        loadSchoolYears();
    }, []);

    useEffect(() => {
        if (schoolYear?.year) {
            const now = new Date();
            const yr = Number(schoolYear.year);
            setCalViewDate(yr === now.getFullYear() ? now : new Date(yr, now.getMonth(), now.getDate()));
        }
    }, [schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const abortController = new AbortController();

        async function loadLanguajes() {
            try {
                await axios.get(`${BASE_URL}/api/languajes?all=1`, {
                    signal: abortController.signal
                }).then(({ data: { data: { data: languajes } } }) => {
                    if (!abortController.signal.aborted) {
                        setLanguajes(languajes);
                        setCourses(null);
                        setLoading(false);
                    }
                });
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.warn('Hubo un problema al cargar los datos para el informe analítico del alumno');
                    setShowError(true);
                    setLoading(false);
                }
            }
        }
        loadLanguajes();
        
        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        const abortController = new AbortController();

        async function loadCourses() {
            try {
                setCourses(null);
                setCourse(null);
                setStudents(null);
                setStudent(null);
                if (languaje != null && schoolYear != null) {
                    setChargingCourse(true);
                    await axios.get(`${BASE_URL}/api/languajes/${languaje}/courses?all=1&schoolYear=${schoolYear.id}`, {
                        signal: abortController.signal
                    }).then(({ data: { data: { data: courses } } }) => {
                        if (!abortController.signal.aborted) {
                            setCourses(courses);
                            setChargingCourse(false);
                        }
                    });
                }

            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.warn('Hubo un problema al cargar los cursos');
                    setChargingCourse(false);
                }
            }
        }
        loadCourses();

        return () => {
            abortController.abort();
        };
    }, [languaje, schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const abortController = new AbortController();
        
        async function loadStudents() {
            try {
                if (course != null) {
                    setChargingStudent(true);
                    setStudent(null);
                    await axios.get(`${BASE_URL}/api/courses/${course}/students?all=1`, {
                        signal: abortController.signal
                    }).then((data) => {
                        if (!abortController.signal.aborted) {
                            setStudents(data.data);
                            setChargingStudent(false);
                        }
                    });
                }

            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.warn('Hubo un problema al cargar los estudiantes');
                    setChargingStudent(false);
                }
            }
        }
        loadStudents();
        
        return () => {
            abortController.abort();
        };
    }, [course]);

    function formatDate(date) {
        if (date === null || date === undefined) {
            return null;
        }
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    }


    useEffect(() => {
        const abortController = new AbortController();
        
        async function loadLazyData() {
            try {
                if (dateInit !== null && dateFinish !== null && languaje !== null && course !== null && student !== null) {
                    let url = `${BASE_URL}/api/reports/reportAnalytical?page=${lazyParams.page + 1}&dateInit=${formatDate(dateInit)}&dateFinish=${formatDate(dateFinish)}&languajeId=${languaje}&courseId=${course}&studentId=${student}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
                    await axios.get(url, {
                        signal: abortController.signal
                    }).then(data => {
                        if (!abortController.signal.aborted) {
                            const result = (data && data.data) || null;
                            const scoreFinal = result.scoreFinal;
                            const scorePractice = result.scoreFinalPractice;
                            const assistences = result.assistences
                            const units = result.units;
                            console.log(scoreFinal)
                            setListening(scoreFinal[0].listening);
                            setReading(scoreFinal[0].reading);
                            setCommunication(scoreFinal[0].communication);
                            setOralExam(scoreFinal[0].oralExam);
                            setWriting(scoreFinal[0].writing);
                            setLanguajeFocus(scoreFinal[0].languajeFocus);
                            setVocabulary(scoreFinal[0].vocabulary);
                            setUnits(units);
                            setPending(scorePractice[0].pending);
                            setDelivered(scorePractice[0].delivered);
                            setAssigned(scorePractice[0].assigned);
                            setTypeAssistences(assistences);
                        }
                    });
                }
            }
            catch (err) {
                if (!abortController.signal.aborted) {
                    console.log(err);
                    console.warn('Hubo un problema al cargar los datos para el informe analítico del alumno');
                    setShowError(true);
                }
            }

        }
        loadLazyData();
        
        return () => {
            abortController.abort();
        };
    }, [student, schoolYear, dateInit, dateFinish, languaje, course]) // eslint-disable-line react-hooks/exhaustive-deps

    const downloadPdf = () => {
        if (dateInit !== null && dateFinish !== null && languaje !== null && course !== null && student !== null &&  oralidad  !== null &&   participacion !== null &&  cumplimiento !== null  ) {
            const init = formatDate(dateInit)
            const finish = formatDate(dateFinish)
            let url = `${BASE_URL}/api/reports/downloadReportAnalytical?dateInit=${init}&dateFinish=${finish}&courseId=${course}&studentId=${student}&oralidad=${oralidad}&participacion=${participacion}&cumplimiento=${cumplimiento}&observations=${observations}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
            setDownload(true);
            axios({
                url: url,
                method: 'GET',
                responseType: 'blob', // Important
            }).then((response) => {
                const disposition = response.headers['content-disposition'] || '';
                const match = disposition.match(/filename="?([^"]+)"?/);
                const filename = match ? match[1] : 'Analitico.pdf';
                FileDownload(response.data, filename);
                setDownload(false);
            }).catch((error) => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al cargar los datos para el informe analítico del alumno', life: 3000 });
                setDownload(false);

            });
        } else {
            console.log(dateInit,dateFinish,languaje,course,student,oralidad,participacion,cumplimiento);
            setDownload(false);

        }

    }


    if (showError) {
        return (
            <Error mensaje={'Hubo un problema al cargar los datos para el informe analítico del alumno'}></Error>
        );
    }

    const oralidadValues = [
        { label: 'Excelente', value: 'Excelente' },
        { label: 'Distinguido', value: 'Distinguido' },
        { label: 'Muy bueno', value: 'Muy bueno' },
        { label: 'Regular', value: 'Regular' },
    ];

    const participacionValues = [
        { label: 'Excelente', value: 'Excelente' },
        { label: 'Distinguido', value: 'Distinguido' },
        { label: 'Muy bueno', value: 'Muy bueno' },
        { label: 'Regular', value: 'Regular' },
    ];


    const cumplimientoValues = [
        { label: 'Excelente', value: 'Excelente' },
        { label: 'Distinguido', value: 'Distinguido' },
        { label: 'Muy bueno', value: 'Muy bueno' },
        { label: 'Regular', value: 'Regular' },
    ];

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-chart-line" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Reporte analítico por alumno</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Desempeño y evaluaciones</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {languaje != null && schoolYear != null && !chargingCourse && Array.isArray(courses) && courses.length === 0 && (
                        <Message
                            severity="warn"
                            text={`El idioma seleccionado no tiene cursos en el año lectivo seleccionado. Elija otro idioma o año.`}
                            className="p-mb-3 p-d-block"
                        />
                    )}
                    <div className="p-d-flex p-jc-end p-mb-3">
                        <Button label={download ? "Descargando..." : "Generar PDF"} icon={download ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} className="btn-pdf" onClick={downloadPdf} disabled={download} style={{ borderRadius: 8 }} />
                    </div>

                    {/* Filtros */}
                    <div className="p-fluid p-mb-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown appendTo={document.body} id="schoolYear" value={schoolYear} onChange={e => setSchoolYear(e.target.value || null)} options={schoolYears} optionLabel="year" placeholder="-- Año lectivo --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha inicio</label>
                            <Calendar monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="dateInit" value={dateInit || undefined} viewDate={calViewDate || undefined} onViewDateChange={(e) => setCalViewDate(e.value)} onChange={(e) => { setMonth(null); setDateInit(e.target.value); }} locale="es" dateFormat="dd/mm/yy" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha fin</label>
                            <Calendar monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="dateFinish" value={dateFinish || undefined} viewDate={calViewDate || undefined} onViewDateChange={(e) => setCalViewDate(e.value)} onChange={(e) => { setMonth(null); setDateFinish(e.target.value); }} locale="es" dateFormat="dd/mm/yy" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Idioma</label>
                            <Dropdown appendTo={document.body} id="languaje" value={languaje} onChange={e => setLanguaje(e.target.value !== undefined ? e.target.value : null)} options={languajes} optionLabel="name" optionValue="id" filter showClear filterBy="name" placeholder="-- Seleccione idioma --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown appendTo={document.body} id="course" value={course} onChange={e => setCourse(e.target.value !== undefined ? e.target.value : null)} options={courses} optionLabel="nameId" optionValue="id" filter showClear filterBy="nameId" disabled={chargingCourse} placeholder={chargingCourse ? '' : '-- Seleccione curso --'} style={{ width: '100%' }} />
                                {chargingCourse && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando cursos...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '130px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Estudiante</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown appendTo={document.body} id="student" value={student} onChange={e => setStudent(e.target.value !== undefined ? e.target.value : null)} options={students} optionLabel="name_complete" optionValue="id" filter showClear filterBy="name_complete" disabled={chargingStudent} placeholder={chargingStudent ? '' : '-- Seleccione alumno --'} style={{ width: '100%' }} />
                                {chargingStudent && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando alumnos...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contenido analítico */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>

                        {/* Panel: Evaluaciones */}
                        <div style={{ background: '#f8fafb', borderRadius: 10, border: '1px solid #e0e6ed', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #3ab54a' }}>
                                <i className="pi pi-chart-bar" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>Evaluaciones</span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                                <tbody>
                                    {[
                                        { label: 'Listening', value: listening },
                                        { label: 'Vocabulary', value: vocabulary },
                                        { label: 'Reading', value: reading },
                                        { label: 'Communication', value: communication },
                                        { label: 'Writing', value: writing },
                                        { label: 'Oral Exam', value: oralExam },
                                        { label: 'Language Focus', value: languajeFocus },
                                    ].map((item, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600, fontSize: '0.85rem', color: '#495057', width: '45%' }}>{item.label}</td>
                                            <td style={{ padding: '0.45rem 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, background: '#e9ecef', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                                                        <div style={{ width: `${(parseFloat(item.value) || 0) * 10}%`, height: '100%', background: (parseFloat(item.value) || 0) >= 7 ? '#3ab54a' : (parseFloat(item.value) || 0) >= 4 ? '#f59e0b' : '#ef4444', borderRadius: 6, transition: 'width 0.4s ease' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a3320', minWidth: 32, textAlign: 'right' }}>{item.value || '-'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#fff', borderRadius: 8, border: '1px solid #e0e6ed' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: 4 }}>Unidades evaluadas</label>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>{units || '-'}</span>
                            </div>
                        </div>

                        {/* Panel: Desempeño en clases */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#f8fafb', borderRadius: 10, border: '1px solid #e0e6ed', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #3b82f6' }}>
                                    <i className="pi pi-star" style={{ color: '#3b82f6', fontSize: '1.1rem' }}></i>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>Desempeño en clases</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    <div className="p-field" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#495057', marginBottom: 4, display: 'block' }}>Oralidad</label>
                                        <Dropdown appendTo={document.body} value={oralidad || ''} options={oralidadValues} onChange={(e) => setOralidad(e.target.value)} optionValue="value" optionLabel="label" placeholder="-- Seleccionar --" style={{ width: '100%' }} />
                                    </div>
                                    <div className="p-field" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#495057', marginBottom: 4, display: 'block' }}>Participación</label>
                                        <Dropdown appendTo={document.body} value={participacion || ''} options={participacionValues} onChange={(e) => setParticipacion(e.target.value)} optionValue="value" optionLabel="label" placeholder="-- Seleccionar --" style={{ width: '100%' }} />
                                    </div>
                                    <div className="p-field" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#495057', marginBottom: 4, display: 'block' }}>Cumplimiento</label>
                                        <Dropdown appendTo={document.body} value={cumplimiento || ''} options={cumplimientoValues} onChange={(e) => setCumplimiento(e.target.value)} optionValue="value" optionLabel="label" placeholder="-- Seleccionar --" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Panel: Tareas */}
                            <div style={{ background: '#f8fafb', borderRadius: 10, border: '1px solid #e0e6ed', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #f59e0b' }}>
                                    <i className="pi pi-book" style={{ color: '#f59e0b', fontSize: '1.1rem' }}></i>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>Tareas (Activity Book)</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Asignados', value: assigned, color: '#3b82f6', icon: 'pi-list' },
                                        { label: 'Entregados', value: delivered, color: '#3ab54a', icon: 'pi-check-circle' },
                                        { label: 'Pendientes', value: pending, color: '#ef4444', icon: 'pi-clock' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '0.75rem 0.5rem', border: '1px solid #e0e6ed' }}>
                                            <i className={`pi ${item.icon}`} style={{ color: item.color, fontSize: '1.3rem', marginBottom: 4, display: 'block' }}></i>
                                            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1a3320', lineHeight: 1.2 }}>{item.value || '0'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel: Asistencias */}
                    {typeAssistences && typeAssistences.length > 0 && (
                        <div style={{ background: '#f8fafb', borderRadius: 10, border: '1px solid #e0e6ed', padding: '1.25rem', marginTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #8b5cf6' }}>
                                <i className="pi pi-calendar-plus" style={{ color: '#8b5cf6', fontSize: '1.1rem' }}></i>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>Asistencias</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {typeAssistences.map((typeAssistence, idx) => (
                                    <div key={idx} style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '0.75rem 1.5rem', border: '1px solid #e0e6ed', minWidth: 100 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1a3320', lineHeight: 1.2 }}>{typeAssistence.cant}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 600, marginTop: 4 }}>{typeAssistence.typeAssistance}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Panel: Observaciones */}
                    <div style={{ background: '#f8fafb', borderRadius: 10, border: '1px solid #e0e6ed', padding: '1.25rem', marginTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: '2px solid #6c757d' }}>
                            <i className="pi pi-comment" style={{ color: '#6c757d', fontSize: '1.1rem' }}></i>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3320' }}>Observaciones</span>
                        </div>
                        <Editor style={{ height: '120px' }} value={observations || ''} onTextChange={(e) => setObservations(e.htmlValue)} />
                    </div>
                </div>
            </div>
        </div>
    );
}