import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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

const FileDownload = require('js-file-download');

export default function ReportAssistanceByCourse() {

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
    const dt = useRef(null);

    const [dateInit, setDateInit] = useState(null);
    const [dateFinish, setDateFinish] = useState(null);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [course, setCourse] = useState(null);
    const [languajes, setLanguajes] = useState(null);
    const [languaje, setLanguaje] = useState(null);
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);

    const [courses, setCourses] = useState(null);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(null);
    const [assistances, setAssistances] = useState(null);
    const [students, setStudents] = useState(null);

    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [chargingCourse, setChargingCourse] = useState(false);
    const [download, setDownload] = useState(false);
    const [lazyParams, setLazyParams] = useState({
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
                console.log(error);
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
        async function loadLanguajes() {
            try {
                setChargingCourse(true)
                await axios.get(`${BASE_URL}/api/languajes?all=1`).then(({ data: { data: { data: languajes } } }) => {
                    setLanguajes(languajes);
                    setCourses(null);
                    setChargingCourse(false)
                });
                setLoading(false);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de registros de asistencias por curso');
                setShowError(true);
                setLoadingDatatable(false);
                setLoading(false)
            }
        }
        loadLanguajes();
    }, []);

    useEffect(() => {
        async function loadCourses() {
            try {
                setCourses(null);
                setCourse(null);
                setShowError(false);
                if (languaje != null && schoolYear != null){
                    setChargingCourse(true);
                    const { data } = await axios.get(`${BASE_URL}/api/languajes/${languaje.id}/courses?all=1&schoolYear=${schoolYear.id}`);
                    // La API puede devolver { data: [] } (showList) o { data: { data: [], meta } } (showAll)
                    const raw = data && data.data;
                    const list = Array.isArray(raw) ? raw : (raw && raw.data && Array.isArray(raw.data)) ? raw.data : [];
                    setCourses(list.map(c => ({ ...c, nameIdYear: c.year != null ? `${c.nameId} - ${c.year}` : c.nameId })));
                    setChargingCourse(false);
                }
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de registros de asistencias por curso');
                setShowError(true);
                setLoadingDatatable(false);
                setChargingCourse(false);
            }
        }
        loadCourses();
    }, [languaje, schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps 

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

    function formatMonth(date) {
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

        return [year, month].join('-');
    }

    useEffect(() => {
        async function loadLazyData() {

            try{
                setLoadingDatatable(true);

                const init = formatDate(dateInit)
                const finish = formatDate(dateFinish)
                const mes = formatMonth(month)
                let url = `${BASE_URL}/api/reports/assistencesByCourse?page=${lazyParams.page + 1}&dateInit=${init}&dateFinish=${finish}&courseId=${course}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;

                await axios.get(url).then(({ data: { data: assistances } }) => {
                    const total = (assistances.meta && assistances.meta.pagination.total) || 0;
                    setTotalRecords(total);
                    const data = (assistances && assistances.data) || null;
                    setAssistances(data);
                    setLoadingDatatable(false);
                });
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de registros de asistencias por curso');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    }, [lazyParams, course, month, dateInit, dateFinish, schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {

        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => {
        console.log(event);
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }


    const onRowGroupExpand = () => {};
    const onRowGroupCollapse = () => {};


    const  downloadPdf = () =>{
        const init = formatDate(dateInit)
        const finish = formatDate(dateFinish)
        const mes = formatMonth(month)
        let url = `${BASE_URL}/api/reports/downloadReportByCourse?&dateInit=${init}&dateFinish=${finish}&courseId=${course}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
        setDownload(true);
         axios({
            url: url,
            method: 'GET',
            responseType: 'blob', // Important
        }).then((response) => {
            console.log(response)
            FileDownload(response.data, 'reporte_asistencia_por_curso.pdf');
            setDownload(false);
        }).catch((e) =>{
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el reporte de asistencias por curso', life: 3000 });
            setDownload(false);
        });
    }


    const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: '#495057' };

    const fullNameBodyTemplate = (rowData) => {
        const apellido = rowData.apellido || '';
        const nombre = rowData.nombre || '';
        return (
            <span style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: '0.88rem', color: '#1a3320', fontWeight: 500, letterSpacing: '0.01em' }}>
                <span style={{ fontWeight: 700 }}>{apellido}</span> {nombre}
            </span>
        );
    };

    const formatDni = (value) => {
        if (!value) return '-';
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const dniBodyTemplate = (rowData) => (
        <span style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: '0.85rem', color: '#495057', fontWeight: 500, letterSpacing: '0.03em' }}>
            {formatDni(rowData.dni)}
        </span>
    );

    const getAssistanceStyle = (nombre) => {
        const n = (nombre || '').toLowerCase();
        if (n.includes('presente')) return { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' };
        if (n.includes('ausente')) return { bg: '#ffebee', color: '#c62828', border: '#ef9a9a' };
        if (n.includes('tard')) return { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' };
        if (n.includes('justific')) return { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' };
        return { bg: '#f5f5f5', color: '#546E7A', border: '#cfd8dc' };
    };

    const rowExpansionTemplate = (data) => {
        const sorted = data.studentsAssisted;
        const total = sorted ? sorted.length : 0;

        return (
            <div style={{ padding: '0.75rem 1rem 1rem', background: 'linear-gradient(135deg, #f9fdf9 0%, #f4f8f4 100%)', borderLeft: '4px solid #3ab54a', borderRadius: '0 0 8px 8px', margin: '0 0.5rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(58,181,74,0.3)', flexShrink: 0 }}>
                        <i className="pi pi-users" style={{ color: '#fff', fontSize: '0.85rem' }}></i>
                    </div>
                    <span style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1a3320' }}>
                        {data.course.nombre}
                    </span>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.75rem', borderRadius: 12, padding: '0.15rem 0.55rem', border: '1px solid #a5d6a7' }}>
                        {total} {total === 1 ? 'alumno' : 'alumnos'}
                    </span>
                </div>
                <DataTable value={sorted} className="datatable-responsive datatable-compact"
                    style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}
                    rowHover stripedRows>
                    <Column header="Nº Documento" body={dniBodyTemplate} style={{ width: '20%' }}
                        headerStyle={{ background: '#1a5c25', color: '#fff', fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: '0.82rem', padding: '0.6rem 0.75rem', letterSpacing: '0.02em', borderBottom: 'none' }}
                        bodyStyle={{ padding: '0.5rem 0.75rem' }}></Column>
                    <Column header="Apellido y Nombre" body={fullNameBodyTemplate} style={{ width: '50%' }}
                        headerStyle={{ background: '#1a5c25', color: '#fff', fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: '0.82rem', padding: '0.6rem 0.75rem', letterSpacing: '0.02em', borderBottom: 'none' }}
                        bodyStyle={{ padding: '0.5rem 0.75rem' }}></Column>
                    <Column header="Asistencia" body={showTypeAssitence} style={{ width: '30%' }}
                        headerStyle={{ background: '#1a5c25', color: '#fff', fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: '0.82rem', padding: '0.6rem 0.75rem', letterSpacing: '0.02em', borderBottom: 'none' }}
                        bodyStyle={{ padding: '0.5rem 0.75rem' }}></Column>
                </DataTable>
            </div>
        );
    }

    const showTypeAssitence = (rowData) => {
        const nombre = rowData.pivot.nameTypeAssistance ? rowData.pivot.nameTypeAssistance.nombre : null;
        if (nombre !== null) {
            const s = getAssistanceStyle(nombre);
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: s.bg, color: s.color, fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: '0.8rem', borderRadius: 14, padding: '0.2rem 0.65rem', border: `1px solid ${s.border}`, letterSpacing: '0.01em' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    {nombre}
                </span>
            );
        } else {
            return <span style={{ color: '#9e9e9e', fontStyle: 'italic', fontSize: '0.82rem' }}>Sin datos</span>;
        }
    }

    const expandAll = () => {
        let _expandedRows = {};
        assistances.forEach(p => _expandedRows[`${p.id}`] = true);

        setStudents(_expandedRows);
    }

    const collapseAll = () => {
        setStudents(null);
    }
    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Asistencias por curso</span>
            </div>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ECEFF1', border: '1.5px solid #B0BEC5', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#78909C', flexShrink: 0, boxShadow: '0 0 0 2px rgba(120,144,156,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#37474F', lineHeight: 1 }}>{totalRecords}</span>
                    <span style={{ fontSize: '0.75rem', color: '#546E7A', fontWeight: 600 }}>Total</span>
                </div>
                <Button icon="pi pi-plus" label="Abrir todos" onClick={expandAll} className="p-button-success p-mr-2" style={{ borderRadius: 8 }} />
                <Button icon="pi pi-minus" label="Cerrar todos" onClick={collapseAll} className="p-button-outlined p-button-secondary" style={{ borderRadius: 8 }} />
                <Button label={download ? "Descargando..." : "Generar PDF"} icon={download ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} className="btn-pdf" onClick={downloadPdf} disabled={download} style={{ borderRadius: 8 }} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <Loading />
        );
    }

    if(showError){
        return(
            <Error mensaje={'Hubo un problema al cargar los registros de asistencia por curso'}></Error>
        );
    } 
    const showNoCoursesWarning = languaje != null && schoolYear != null && !chargingCourse && Array.isArray(courses) && courses.length === 0;

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                {/* Page header - mismo patrón que studentPage */}
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #3ab54a, #1a5c25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(58,181,74,0.35)',
                    }}>
                        <i className="pi pi-calendar-plus" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Asistencia por Curso</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Reporte de asistencias por curso y período</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {showNoCoursesWarning && (
                        <Message
                            severity="warn"
                            text={`El idioma "${languaje ? languaje.name : ''}" no tiene cursos en el año lectivo seleccionado. Elija otro idioma o año.`}
                            className="p-mb-3 p-d-block"
                        />
                    )}

                    {/* Filtros - mismo patrón que studentPage */}
                    <div className="p-fluid p-formgrid p-grid p-mb-3">
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="schoolYear" className="p-d-block" style={labelStyle}>Año lectivo</label>
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
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="dateInit" className="p-d-block" style={labelStyle}>Fecha inicio</label>
                            <Calendar
                                monthNavigator yearNavigator yearRange="2010:2050"
                                appendTo={document.body}
                                id="dateInit"
                                value={dateInit || undefined}
                                viewDate={calViewDate || undefined}
                                onViewDateChange={(e) => setCalViewDate(e.value)}
                                onChange={(e) => {
                                    setMonth(null);
                                    setDateInit(e.target.value);
                                }}
                                locale="es"
                                dateFormat="dd/mm/yy"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="dateFinish" className="p-d-block" style={labelStyle}>Fecha fin</label>
                            <Calendar
                                monthNavigator yearNavigator yearRange="2010:2050"
                                appendTo={document.body}
                                id="dateFinish"
                                value={dateFinish || undefined}
                                viewDate={calViewDate || undefined}
                                onViewDateChange={(e) => setCalViewDate(e.value)}
                                onChange={(e) => {
                                    setMonth(null);
                                    setDateFinish(e.target.value);
                                }}
                                locale="es"
                                dateFormat="dd/mm/yy"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="month" className="p-d-block" style={labelStyle}>Mes</label>
                            <Calendar
                                id="month"
                                value={month}
                                onChange={(e) => {
                                    setDateInit(null);
                                    setDateFinish(null);
                                    setMonth(e.target.value);
                                }}
                                view="month"
                                dateFormat="mm/yy"
                                yearNavigator
                                yearRange="2000:2100"
                                appendTo={document.body}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="languaje" className="p-d-block" style={labelStyle}>Idioma</label>
                            <Dropdown
                                appendTo={document.body}
                                id="languaje"
                                value={languaje}
                                onChange={e => setLanguaje(e.target.value !== undefined ? e.target.value : null)}
                                options={languajes}
                                optionLabel="name"
                                filter
                                filterBy="name"
                                placeholder="-- Seleccione idioma --"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label htmlFor="course" className="p-d-block" style={labelStyle}>Curso</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown
                                    appendTo={document.body}
                                    id="course"
                                    value={course}
                                    onChange={e => setCourse(e.target.value !== undefined ? e.target.value : null)}
                                    options={courses}
                                    optionLabel="nameIdYear"
                                    optionValue="id"
                                    filter
                                    filterBy="nameIdYear"
                                    disabled={chargingCourse}
                                    placeholder={chargingCourse ? '' : '-- Seleccione curso --'}
                                    style={{ width: '100%' }}
                                />
                                {chargingCourse && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando cursos...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <DataTable
                        value={assistances}
                        expandedRows={students}
                        onRowToggle={(e) => setStudents(e.data)}
                        onRowExpand={onRowGroupExpand}
                        onRowCollapse={onRowGroupCollapse}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="id"
                        header={header}
                        ref={dt}
                        lazy
                        paginator
                        first={lazyParams.first}
                        rows={10}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        onSort={onSort}
                        sortField={lazyParams.sortField}
                        sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact"
                        stripedRows
                        rowHover
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column field="date" header="Fecha" />
                    </DataTable>
                </div>
            </div>
        </div>
    );

}