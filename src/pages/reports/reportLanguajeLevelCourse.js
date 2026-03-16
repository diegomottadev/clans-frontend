import React, { useState, useEffect, useRef } from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { addLocale } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import Error from '../../components/Error';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';

const FileDownload = require('js-file-download');

export default function ReportLanguajeLevelCourse() {

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

    const [level, setLevel] = useState(null);
    const [languaje, setLanguaje] = useState(null);
    const [course, setCourse] = useState(null);
    const [schoolYear, setSchoolYear] = useState(null);

    const [languajes, setLanguajes] = useState(null);
    const [courses, setCourses] = useState(null);
    const [levels, setLevels] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);

    const [students, setStudents] = useState(null);
    const [chargingCourse, setChargingCourse] = useState(false);
    const [chargingLevel, setChargingLevel] = useState(false);

    const [download, setDownload] = useState(false);

    const [obsDialog, setObsDialog] = useState(false);
    const [obsContent, setObsContent] = useState('');
    const [obsStudentName, setObsStudentName] = useState('');
    const [showOnlyWithStudents, setShowOnlyWithStudents] = useState('con_alumnos');

    const filterOptions = [
        { label: 'Con alumnos', value: 'con_alumnos' },
        { label: 'Todos', value: 'todos' }
    ];

    useEffect(() => {
        async function loadSchoolYear() {
            try {
                    await axios.get(`${BASE_URL}/api/schoolYears?all=1`).then(({ data: { data: { data: schoolYearss } } }) => {
                        setSchoolYears(schoolYearss);
                        setCourses(null);
                        const active = schoolYearss.find(function(y) { return y.active === true; });
                        setSchoolYear(active || null);
                    });

            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de los años lectivos');
                setShowError(true);
            }
        }
        loadSchoolYear()
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        async function loadLanguajes() {
            try {
                setChargingCourse(true)
                await axios.get(`${BASE_URL}/api/languajes?all=1`).then(({ data: { data: { data: languajes } } }) => {
                    setLanguajes(languajes);
                    setLevels(null);
                    setCourses(null);
                    setChargingCourse(false)

                });
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de idiomas');
                setShowError(true);
                setChargingCourse(false)

            }
        }
        loadLanguajes();
    }, []);

    useEffect(() => {
        async function loadLevels() {
            try {
                if (languaje !=null){
                    setChargingLevel(true);
                    setLevels(null);
                    setCourses(null);
                    setLevel(null);
                    setCourse(null);

                    await axios.get(`${BASE_URL}/api/languajes/${languaje.id}/levels?all=1`).then(({ data: { data: { data: levels } } }) => {
                      setLevels(levels);
                      setChargingLevel(false);
                    });
                }

            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga los niveles por idioma');
                setShowError(true);
                setChargingLevel(false);
            }
        }
        loadLevels();
    }, [languaje]);

    useEffect(() => {
        async function loadCourse() {
            try {
                if (level !=null){
                    setChargingCourse(true)
                    setCourses(null);
                    setCourse(null);

                    await axios.get(`${BASE_URL}/api/levels/${level.id}/courses?all=1&schoolYear=${schoolYear.id}`).then(({ data: { data: { data: courses } } }) => {
                      setCourses(courses);
                      setChargingCourse(false)
                    });
                }

            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de los cursos por nivel');
                setShowError(true);
                setChargingCourse(false)
            }
        }
        loadCourse();
    }, [schoolYear, level]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        async function loadLazyData() {

            try{

                 let   languajeId = null
                 let   levelId = null
                 let   courseId = null
                 let   schoolYearV = null

                if (!languaje){
                    return
                }

                if (languaje && level && schoolYear && course){
                    languajeId = languaje.id
                    levelId = level.id
                    courseId = course
                    schoolYearV = schoolYear.id
                }
                else if (languaje && level && schoolYear ){
                    languajeId = languaje.id
                    levelId = level.id
                    schoolYearV = schoolYear.id
                }else if (languaje && level ){
                        languajeId = languaje.id
                        levelId = level.id
                }else if (languaje){
                    languajeId = languaje.id
                }
                setStudents(null);

                let url = `${BASE_URL}/api/reports/reportLanguajeLevelCourse?languajeId=${languajeId}&levelId=${levelId}&courseId=${courseId}&schoolYears=${schoolYearV}`;
                setChargingCourse(true)

                await axios.get(url).then(( data) => {
                    setStudents(data.data);
                    setChargingCourse(false)

                });
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de alumnos');
                setShowError(true);
            }
        }
        loadLazyData();
    }, [languaje, level, schoolYear, course]) // eslint-disable-line react-hooks/exhaustive-deps

    const  downloadPdf = () =>{
        let   languajeId = null
        let   levelId = null
        let   courseId = null
        let   schoolYearV = null

       if (!languaje){
           return
       }

       if (languaje && level && schoolYear && course){
           languajeId = languaje.id
           levelId = level.id
           courseId = course
           schoolYearV = schoolYear.id
       }
       else if (languaje && level && schoolYear ){
           languajeId = languaje.id
           levelId = level.id
           schoolYearV = schoolYear.id
       }else if (languaje && level ){
               languajeId = languaje.id
               levelId = level.id
       }else if (languaje){
           languajeId = languaje.id
       }

       let url = `${BASE_URL}/api/reports/downloadReportLanguajesLevelsCourses?languajeId=${languajeId}&levelId=${levelId}&courseId=${courseId}&schoolYears=${schoolYearV}`;
        setDownload(true);
         axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
            FileDownload(response.data, 'reporte-listado-idioma-nivel-curso.pdf');
            setDownload(false);
        }).catch((e) =>{
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el reporte de listado  por idioma, nivel y curso', life: 3000 });
            setDownload(false);
        });
    }

    // Helpers
    const getStudentCount = (node) => {
        if (!node || !node.children) return 0;
        return node.children.filter(c => c.data && c.data.apellido && c.data.apellido !== '').length;
    };

    const hasObservation = (html) => {
        return html && html !== '' && html !== '<p><br></p>' && html !== '<p></p>';
    };

    const nombreCol = (rowData) => {
        // Solo mostrar mensaje en nodos raíz (primer nivel) que no tengan alumnos
        // Los nodos raíz tienen key con formato "idioma-nivel-curso-index" y su data.apellido es "Nivel-Curso"
        const isRootNode = rowData.children && rowData.data.nombre === '' && rowData.data.dni === '' && rowData.data.turno_escolar === '';
        if (isRootNode && getStudentCount(rowData) === 0) {
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6c757d', fontSize: '0.82rem', fontStyle: 'italic' }}>
                    <i className="pi pi-info-circle" style={{ fontSize: '0.85rem', color: '#90A4AE' }} />
                    Sin alumnos inscriptos en este curso
                </span>
            );
        }
        return rowData.data.nombre;
    };

    const formatDni = (value) => {
        if (!value) return '';
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const dniCol = (rowData) => (
        <span>{formatDni(rowData.data.dni)}</span>
    );

    const observacionesCol = (rowData) => {
        const htmlContent = rowData.data.observaciones;
        if (!htmlContent || htmlContent === '' || htmlContent === '<p><br></p>' || htmlContent === '<p></p>') {
            return null;
        }
        return (
            <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-outlined p-button-info p-button-sm"
                style={{ width: '2rem', height: '2rem' }}
                tooltip="Ver observaciones"
                tooltipOptions={{ position: 'left', showDelay: 400 }}
                onClick={() => {
                    setObsContent(htmlContent);
                    setObsStudentName(`${rowData.data.apellido || ''} ${rowData.data.nombre || ''}`.trim());
                    setObsDialog(true);
                }}
            />
        );
    }

    const filteredStudents = React.useMemo(() => {
        if (!students || !Array.isArray(students)) return students;
        if (showOnlyWithStudents === 'todos') return students;
        return students.filter(node => getStudentCount(node) > 0);
    }, [students, showOnlyWithStudents]); // eslint-disable-line react-hooks/exhaustive-deps

    const stats = React.useMemo(() => {
        if (!students || !Array.isArray(students)) return { totalCourses: 0, totalStudents: 0, withObs: 0 };
        let totalCourses = students.length;
        let totalStudents = 0;
        let withObs = 0;
        students.forEach(node => {
            totalStudents += getStudentCount(node);
            if (node.children) {
                node.children.forEach(child => {
                    if (child.data && child.data.apellido && child.data.apellido !== '' && hasObservation(child.data.observaciones)) {
                        withObs++;
                    }
                });
            }
        });
        return { totalCourses, totalStudents, withObs };
    }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

    const treeHeader = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
                <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                    <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                    <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de alumnos por idioma, nivel y curso</span>
                </div>
                <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                    <SelectButton value={showOnlyWithStudents} options={filterOptions} onChange={(e) => { if (e.value) setShowOnlyWithStudents(e.value); }} style={{ fontSize: '0.78rem' }} />
                    <Button label={download ? "Descargando..." : "Generar PDF"} icon={download ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} className="btn-pdf" onClick={downloadPdf} disabled={download} style={{ borderRadius: 8 }} tooltip="Descargar comprobante" tooltipOptions={{ position: 'bottom', mouseTrack: false, showDelay: 400 }} />
                </div>
            </div>
            {students && Array.isArray(students) && students.length > 0 && (
                <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#E8F5E9', border: '1.5px solid #A5D6A7', borderRadius: 20, padding: '0.2rem 0.7rem' }}>
                        <i className="pi pi-users" style={{ fontSize: '0.8rem', color: '#2E7D32' }} />
                        <strong style={{ fontSize: '0.88rem', color: '#2E7D32' }}>{stats.totalStudents}</strong>
                        <span style={{ fontSize: '0.76rem', color: '#2E7D32', fontWeight: 500 }}>Alumnos</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#E3F2FD', border: '1.5px solid #90CAF9', borderRadius: 20, padding: '0.2rem 0.7rem' }}>
                        <i className="pi pi-book" style={{ fontSize: '0.8rem', color: '#1565C0' }} />
                        <strong style={{ fontSize: '0.88rem', color: '#1565C0' }}>{stats.totalCourses}</strong>
                        <span style={{ fontSize: '0.76rem', color: '#1565C0', fontWeight: 500 }}>Cursos</span>
                    </div>
                    {stats.withObs > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFF3E0', border: '1.5px solid #FFCC80', borderRadius: 20, padding: '0.2rem 0.7rem' }}>
                            <i className="pi pi-comment" style={{ fontSize: '0.8rem', color: '#E65100' }} />
                            <strong style={{ fontSize: '0.88rem', color: '#E65100' }}>{stats.withObs}</strong>
                            <span style={{ fontSize: '0.76rem', color: '#E65100', fontWeight: 500 }}>Con obs.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if(showError){
        return(
            <Error mensaje={'Hubo un problema al cargar los alumnos por idioma, nivel y curso'}></Error>
        );
    }

    const showNoLevelsWarning = languaje != null && !chargingLevel && Array.isArray(levels) && levels.length === 0;
    const showNoCoursesWarning = level != null && schoolYear != null && !chargingCourse && Array.isArray(courses) && courses.length === 0;

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-book" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Lista por idioma, nivel y curso</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Alumnos por idioma, nivel y curso</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {showNoLevelsWarning && (
                        <Message
                            severity="warn"
                            text={`El idioma "${languaje ? languaje.name : ''}" no tiene niveles cargados. Elija otro idioma.`}
                            className="p-mb-3 p-d-block"
                        />
                    )}
                    {showNoCoursesWarning && (
                        <Message
                            severity="warn"
                            text={`El nivel "${level ? level.name : ''}" no tiene cursos en el año lectivo seleccionado. Elija otro nivel o año.`}
                            className="p-mb-3 p-d-block"
                        />
                    )}
                    {/* Filtros */}
                    <div className="p-fluid p-mb-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown appendTo={document.body} id="schoolYear" value={schoolYear} onChange={e => setSchoolYear(e.target.value !== undefined ? e.target.value : null)} options={schoolYears} optionLabel="year" filter filterBy="year" placeholder="-- Seleccione año lectivo --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Idioma</label>
                            <Dropdown appendTo={document.body} id="languaje" value={languaje} onChange={e => setLanguaje(e.target.value !== undefined ? e.target.value : null)} options={languajes} optionLabel="name" filter filterBy="name" placeholder="-- Seleccione idioma --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Nivel</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown appendTo={document.body} id="level" value={level} onChange={e => setLevel(e.target.value !== undefined ? e.target.value : null)} options={levels} optionLabel="name" filter filterBy="name" disabled={chargingLevel} placeholder={chargingLevel ? '' : '-- Seleccione nivel --'} style={{ width: '100%' }} />
                                {chargingLevel && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando niveles...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown appendTo={document.body} id="course" value={course} onChange={e => setCourse(e.target.value !== undefined ? e.target.value : null)} options={courses} optionLabel="nameId" optionValue="id" filter filterBy="nameId" disabled={chargingCourse} placeholder={chargingCourse ? '' : '-- Seleccione curso --'} style={{ width: '100%' }} />
                                {chargingCourse && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando cursos...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <TreeTable value={filteredStudents} tableStyle={{ minWidth: '40rem', fontSize: '0.88rem' }} header={treeHeader}>
                        <Column field="apellido" header="Apellido" expander style={{ width: '22%' }}></Column>
                        <Column body={nombreCol} header="Nombre" style={{ width: '22%' }}></Column>
                        <Column field="dni" header="DNI" body={dniCol} style={{ width: '14%' }}></Column>
                        <Column field="turno_escolar" header="Turno" style={{ width: '14%' }}></Column>
                        <Column field="horario_ed_fisica" header="Ed. Fisica" style={{ width: '14%' }}></Column>
                        <Column body={observacionesCol} header="Obs." style={{ width: '5%', textAlign: 'center' }}></Column>
                    </TreeTable>

                    {/* Dialog observaciones */}
                    <Dialog
                        visible={obsDialog}
                        style={{ width: '500px' }}
                        header={`Observaciones - ${obsStudentName}`}
                        modal
                        onHide={() => setObsDialog(false)}
                        footer={
                            <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setObsDialog(false)} />
                        }
                    >
                        <div dangerouslySetInnerHTML={{ __html: obsContent }} style={{ lineHeight: 1.6, color: '#495057' }} />
                    </Dialog>

                </div>
            </div>
        </div>

    );

}
