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

export default function ReportInvoicesByLanguajeCourse() {

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
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(null);
    const [invoices, setInvoices] = useState(null);
    const [courses, setCourses] = useState(null);
    const [languaje, setLanguaje] = useState(null);
    const [course, setCourse] = useState(null);
    const [languajes, setLanguajes] = useState(null);
    const [schoolYear, setSchoolYear] = useState(null); // eslint-disable-line no-unused-vars
    const [schoolYears, setSchoolYears] = useState(null); // eslint-disable-line no-unused-vars

    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [download, setDownload] = useState(false);
    const [chargingCourse, setChargingCourse] = useState(false);

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
                await axios.get(`${BASE_URL}/api/languajes?all=1`).then(({ data: { data: { data: languajes } } }) => {
                    setLanguajes(languajes);
                    setCourses(null);
                });
                setLoading(false);
            } catch (error) {
                console.warn('Hubo un problema al cargar los registros de facturas por idioma y curso');
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
                if (languaje != null && schoolYear != null){
                    setChargingCourse(true);
                    await axios.get(`${BASE_URL}/api/languajes/${languaje}/courses?flag=1&all=1&schoolYear=${schoolYear.id}`).then(({ data: { data: { data: courses } } }) => {
                        setCourses(courses);
                        setChargingCourse(false);
                    });
                }

            } catch (error) {
                console.warn('Hubo un problema al cargar los registros de cobros por idioma y curso');
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
                let url = `${BASE_URL}/api/reports/reportInvoicesByLanguajeCourse?page=${lazyParams.page + 1}&dateInit=${init}&dateFinish=${finish}&languajeId=${languaje}&courseId=${course}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
    
                await axios.get(url).then(({ data: { data: invoices } }) => {
                    const total = (invoices.meta && invoices.meta.pagination.total) || 0;
                    setTotalRecords(total);
                    const data = (invoices && invoices.data) || null;
                    setInvoices(data);
                    setLoadingDatatable(false);
                });
            } 
            catch(err){
                console.log(err);
                console.warn('Hubo un problema al cargar los registros de facturas por idioma y curso');
                setShowError(true);
                setLoadingDatatable(false);
            } 
          
        }
        loadLazyData();
    }, [lazyParams, course, month, languaje, dateInit, dateFinish, schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {

        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => {
        console.log(event);
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }


    const downloadReceipt = (rowData) => {
        axios({
            url: `${BASE_URL}/api/reports/downloadReportByInvoice/${rowData.id}`,
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
            FileDownload(response.data, 'recibo-pago-cuota.pdf');
        }).catch((error) => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el recibo', life: 3000 });
        });
    }

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-arrow-circle-down" className="p-button-rounded p-button-outlined p-button-info" onClick={() => downloadReceipt(rowData)} tooltip="Descargar comprobante" tooltipOptions={{ position: 'left', showDelay: 300 }} />
        </div>
    );

    const  downloadPdf = () =>{
        if(languaje !== null){
            const init = formatDate(dateInit)
            const finish = formatDate(dateFinish)
            const mes = formatMonth(month)
            let url = `${BASE_URL}/api/reports/downloadInvoicesByLanguajeCourse?languajeId=${languaje}&dateInit=${init}&dateFinish=${finish}&courseId=${course}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
            setDownload(true);
            axios({
                url: url,
                method: 'GET',
                responseType: 'blob', // Important
            }).then((response) => {
                FileDownload(response.data, 'repote-cobros-por-idioma-y-curso.pdf');
                setDownload(false);
            }).catch((error) =>{
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el reporte de cobros por idioma y curso', life: 3000 });
                setDownload(false);

            });
        }else{
            toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'No ha seleccionado un idioma', life: 3000 });
            setDownload(false);

        }

    }


    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Detalle de cobros</span>
            </div>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ECEFF1', border: '1.5px solid #B0BEC5', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#78909C', flexShrink: 0, boxShadow: '0 0 0 2px rgba(120,144,156,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#37474F', lineHeight: 1 }}>{totalRecords}</span>
                    <span style={{ fontSize: '0.75rem', color: '#546E7A', fontWeight: 600 }}>Total</span>
                </div>
                <Button label={download ? "Descargando..." : "Generar PDF"} icon={download ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} className="btn-pdf" onClick={downloadPdf} disabled={download} style={{ borderRadius: 8 }} />
            </div>
        </div>
    );



    const dateBodyTemplate = (rowData) => {
        if (!rowData.dateIssue) return '-';
        const parts = rowData.dateIssue.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return rowData.dateIssue;
    };

    const languajeBodyTemplate = (rowData) => {
        if(languaje!==null && course !==null){
            return  <span>{languaje.name}</span>  ;       
        }
    }
 
    if (loading) {
        return (
            <Loading />
        );
    }

    if(showError){
        return(
            <Error mensaje={'Hubo un problema al cargar los registros de facturas por idioma y curso'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-chart-bar" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Cobros por idioma y curso</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Reporte de cobros por idioma y curso</p>
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
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Idioma</label>
                            <Dropdown appendTo={document.body} id="languaje" value={languaje} onChange={e => setLanguaje(e.target.value !== undefined ? e.target.value : null)} options={languajes} optionLabel="name" optionValue="id" filter showClear filterBy="name" placeholder="-- Seleccione idioma --" style={{ width: '100%' }} />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <Dropdown appendTo={document.body} id="course" value={course} onChange={e => setCourse(e.target.value !== undefined ? e.target.value : null)} options={courses} optionLabel="nameId" optionValue="id" filter showClear filterBy="nameId" placeholder="-- Seleccione curso --" style={{ width: '100%' }} />
                        </div>
                    </div>

                    <DataTable ref={dt} value={invoices} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover >
                    <Column field="dateIssue" header="Fecha"></Column>
                    <Column field="fee" header="Monto"></Column>
                    <Column field="month" header="Mes"></Column>
                    <Column field="student.apellido_nombre_completo" header="Alumno"></Column>
                    <Column field="studentCourse.course.nombre" header="Curso"></Column>
                    <Column body={actionBodyTemplate} header="" style={{ width: '5rem' }}></Column>
                    {
                     (languaje!==null && course !==null) ?
                        <Column body={languajeBodyTemplate} header="Idioma"></Column>
                        :
                        null
                    }

                    </DataTable>

                </div>
            </div>
        </div>

    );

}