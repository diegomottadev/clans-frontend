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

const FileDownload = require('js-file-download');

    
export default function ReportCompleteByStudent() {

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
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);

    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(null);
    const [assistances, setAssistances] = useState(null);
    const [students, setStudents] = useState(null);
    const [invoices, setInvoices] = useState(null);
    const [evaluations, setEvaluations] = useState(null);
    const [student, setStudent] = useState(null);
    const [download, setDownload] = useState(false);
    const  [chargingData,setChargingData] = useState(false);
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
        async function loadStudents() {
            try {
                await axios.get(`${BASE_URL}/api/students?all=1`).then(({ data: { data: { data: students } } }) => {
                    setStudents(students);
                    setLoading(false);
                });

            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de registros de reporte completo de estudiantes');
                setShowError(true);
                setLoading(false)
            }
        }
        loadStudents();
    }, []);

    useEffect(() => {
        async function loadCourses() {
            try {

                const init = formatDate(dateInit)
                const finish = formatDate(dateFinish)
                const mes = formatMonth(month)
                const studentId = student

                // Sin alumno no hay informe; sin fechas el backend usa el año lectivo completo
                if (student === null || student === undefined) {
                    console.log(init,finish,studentId)
                    setLoading(false);
                    return;
                }
                setChargingData(true);
                await axios.get(`${BASE_URL}/api/reports/reportCompleteByStudent?dateInit=${init}&dateFinish=${finish}&studentId=${student}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`).then( data  => {
                    console.log(data.data)
                    setAssistances(data.data.assistences);
                    setEvaluations(data.data.evaluations);
                    setInvoices(data.data.invoices);
                    setLoading(false);
                    setChargingData(false);

                })
                /* .catch(data =>{
                    console.log(data);
                    console.warn('Hubo un problema con la carga de registros de reporte completo de estudiantes');
                    setShowError(true);
                    setLoading(false)
                 });*/

            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de registros de reporte completo de estudiantes');
                //setShowError(true);
                setLoading(false)
                setChargingData(false);

            }
        }
        loadCourses();
    }, [student, dateInit, dateFinish, schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

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
 
    const  downloadPdf = () =>{
        const init = formatDate(dateInit)
        const finish = formatDate(dateFinish)
        const mes = formatMonth(month)
        let url = `${BASE_URL}/api/reports/downloadReportCompleteByStudent?dateInit=${init}&dateFinish=${finish}&studentId=${student}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
        setDownload(true);
         axios({
            url: url,
            method: 'GET',
            responseType: 'blob', // Important
        }).then((response) => {
            FileDownload(response.data, 'reporte_informe_completo_por_alumno.pdf');
            setDownload(false);
        }).catch((error) =>{
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el reporte de informe completo por alumno', life: 3000 });
            setDownload(false);

        });
    }

    const headerAssistances = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-calendar-plus" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Asistencias</span>
            </div>
            <Button label={download ? "Descargando..." : "Generar PDF"} icon={download ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} className="btn-pdf" onClick={downloadPdf} disabled={download} style={{ borderRadius: 8 }} />
        </div>
    );

    const headerEvaluations = (
        <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
            <i className="pi pi-file-edit" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Evaluaciones</span>
        </div>
    );

    const headerInvoices = (
        <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
            <i className="pi pi-wallet" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Facturas</span>
        </div>
    );


    if (loading) {
        return (
            <Loading />
        );
    }


    if(showError){
        return(
            <Error mensaje={'Hubo un problema con la carga de registros de reporte completo de estudiantes'}></Error>
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
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Reporte completo por alumno</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Asistencias, evaluaciones y facturas</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {/* Filtros */}
                    <div className="p-fluid p-mb-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown appendTo={document.body} id="schoolYear" value={schoolYear} onChange={e => setSchoolYear(e.target.value || null)} options={schoolYears} optionLabel="year" placeholder="-- Año lectivo --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha inicio</label>
                            <Calendar monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="dateInit" value={dateInit || undefined} viewDate={calViewDate || undefined} onViewDateChange={(e) => setCalViewDate(e.value)} onChange={(e) => { setMonth(null); setDateInit(e.target.value); }} locale="es" dateFormat="dd/mm/yy" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha fin</label>
                            <Calendar monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="dateFinish" value={dateFinish || undefined} viewDate={calViewDate || undefined} onViewDateChange={(e) => setCalViewDate(e.value)} onChange={(e) => { setMonth(null); setDateFinish(e.target.value); }} locale="es" dateFormat="dd/mm/yy" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '180px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Alumno</label>
                            <Dropdown appendTo={document.body} id="student" value={student} onChange={e => setStudent(e.target.value !== undefined ? e.target.value : null)} options={students} optionLabel="name_complete" optionValue="id" filter showClear filterBy="name_complete" placeholder="-- Seleccione alumno --" style={{ width: '100%' }} />
                        </div>
                    </div>

                    { chargingData && <Loading /> }
                    { !chargingData && (
                        <div>
                            <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                                <DataTable value={assistances} className="datatable-responsive datatable-compact" header={headerAssistances} stripedRows rowHover>
                                <Column field="fecha" header="Fecha"></Column>
                                <Column field="course.nombre" header="Curso"></Column>
                                <Column field="pivot.nameTypeAssistance.nombre" header="Tipo de asistencia"></Column>
                                </DataTable>
                            </div>
                            <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                                <DataTable value={evaluations} className="datatable-responsive datatable-compact" header={headerEvaluations} stripedRows rowHover>
                                <Column field="fecha" header="Fecha"></Column>
                                <Column field="nombre" header="Curso"></Column>
                                <Column field="type_evaluation.nombre" header="Tipo de evaluación"></Column>
                                <Column field="pivot.nameStudentConcept.nombre" header="Nota"></Column>
                                <Column field="pivot.observaciones" header="Observación"></Column>
                                </DataTable>
                            </div>
                            <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                                <DataTable value={invoices} className="datatable-responsive datatable-compact" header={headerInvoices} stripedRows rowHover>
                                <Column field="fecha_emision" header="Fecha"></Column>
                                <Column field="cuota" header="Monto"></Column>
                                <Column field="student_course.course.nombre" header="Curso"></Column>
                                <Column field="mes" header="Mes"></Column>
                                </DataTable>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

}