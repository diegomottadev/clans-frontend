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



export default function ReportPaymentsByTeacher() {

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
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(false);
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);
    const [month, setMonth] = useState(null);
    const [invoices, setInvoices] = useState(null);
    const [teachers, setTeachers] = useState(null);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
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
        async function loadTeachers() {
            try {
                await axios.get(`${BASE_URL}/api/teachers?all=1`).then(({ data: { data: { data: teachers } } }) => {
                    setTeachers(teachers);
                });
                setLoading(false);
            } catch (error) {
                console.log(error)
                console.warn('Hubo un problema al cargar los registros de reportes de recibos de docentes');
                setShowError(true);
                setLoadingDatatable(false);
                setLoading(false)
            }
        }
        loadTeachers();
    }, []);

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
                let url = `${BASE_URL}/api/reports/reportPaymentTeacher?page=${lazyParams.page + 1}&dateInit=${init}&dateFinish=${finish}&teacherId=${teacher}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
    
                await axios.get(url).then(({ data: { data: invoices } }) => {
                    const total = (invoices.meta && invoices.meta.pagination.total) || 0;
                    setTotalRecords(total);
                    const data = (invoices && invoices.data) || null;
                    setInvoices(data);
                    setLoadingDatatable(false);
                });
    
            }
            catch(error){
                console.log(error)
                console.warn('Hubo un problema al cargar los registros de reportes de recibos de docentes');
                setShowError(true);
                setLoadingDatatable(false);
                setLoading(false)
            }            
        }
        loadLazyData();
    }, [lazyParams, teacher, month, dateInit, dateFinish, schoolYear]) // eslint-disable-line react-hooks/exhaustive-deps

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
            url: `${BASE_URL}/api/reports/downloadReceiptByPaymentTeacher/${rowData.id}`,
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
            FileDownload(response.data, 'recibo-pago-docente.pdf');
        }).catch((error) => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el recibo de pago a docente', life: 3000 });
        });
    }

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-arrow-circle-down" className="p-button-rounded p-button-outlined p-button-info" onClick={() => downloadReceipt(rowData)} />
        </div>
    );

    const  downloadPdf = () =>{
        const init = formatDate(dateInit)
        const finish = formatDate(dateFinish)
        const mes = formatMonth(month)
        let url = `${BASE_URL}/api/reports/downloadPaymentTeacher?page=${lazyParams.page + 1}&dateInit=${init}&dateFinish=${finish}&teacherId=${teacher}&month=${mes}&schoolYearId=${schoolYear ? schoolYear.id : null}`;
        setDownload(true);
        axios({
            url: url,
            method: 'GET',
            responseType: 'blob', // Important
        }).then((response) => {
            FileDownload(response.data, 'repote-pago-de-docente.pdf');
            setDownload(false);
        }).catch((error) =>{
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el reporte de cobros por idioma y curso', life: 3000 });
            setDownload(false);
        });
    }
    const dateBodyTemplate = (rowData) => {
        if (!rowData.date) return '-';
        const parts = rowData.date.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return rowData.date;
    };

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Detalle de pagos por docente</span>
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

    if (loading) {
        return (
            <Loading />
        );
    }

    if(showError){
        return(
            <Error mensaje={'Hubo un problema al cargar los registros de reportes de recibos de docentes'}></Error>
        );
    } 

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-wallet" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Pagos por docente</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Recibos de docentes</p>
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
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Docente</label>
                            <Dropdown appendTo={document.body} id="course" value={teacher} onChange={e => setTeacher(e.target.value !== undefined ? e.target.value : null)} options={teachers} optionLabel="completeName" optionValue="id" filter showClear filterBy="completeName" placeholder="-- Seleccione docente --" style={{ width: '100%' }} />
                        </div>
                    </div>

                    <DataTable ref={dt} value={invoices} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover >
                    <Column field="date" header="Fecha" body={dateBodyTemplate}></Column>
                    <Column field="amount" header="Monto"></Column>
                    <Column field="teacher.data.completeName" header="Docente"></Column>
                    <Column body={actionBodyTemplate} header="" style={{ width: '5rem' }}></Column>
                    </DataTable>
                </div>
            </div>
        </div>

    );

}