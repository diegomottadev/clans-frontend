import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { BASE_URL } from '../../../helpers/BaseUrl';
import { sortQuery } from '../../../helpers/listQuery';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { addLocale } from 'primereact/api';
import Error from '../../../components/Error';
import { useDebouncedCallback } from '../../../helpers/useDebouncedCallback';

const FileDownload = require('js-file-download');

export default function Invoice() {

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

    let emptyInvoice = {
        studentCourse: null,
        student: null,
        fee: null,
        dateIssue: null,
        month: null,
        mora: 0,
        previousYearDebt: false,
        previousYear: null,
        previousEnrollmentId: null,
        previousCourseId: null,
    };
    const [invoices, setInvoices] = useState(null);
    const [invoicesPayed, setInvoicesPayed] = useState(null);

    const [students, setStudents] = useState(null);
    const [invoice, setInvoice] = useState(emptyInvoice);
    const [months, setMonths] = useState(null);
    const [monthsBis, setMonthsBis] = useState(null);
    const [courses, setCourses] = useState(null);
    const [invoiceDialog, setInvoiceDialog] = useState(false);
    const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [chargingInitial, setChargingInitial] = useState(true);
    const [chargingInvoicesByStudent, setChargingInvoicesByStudent] = useState(false);
    const [lastFeePay] = useState(null); // eslint-disable-line no-unused-vars
    const [showError, setShowError] = useState(false);

    const [loadingTable, setLoadingTable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });
    useEffect(() => {
        async function loadInvoices() {
            try {
                setChargingInitial(true)
                await axios.get(`${BASE_URL}/api/months`).then(({ data: { data: months } }) => {
                    setMonths(months);
                    setMonthsBis(months);
                });
                await axios.get(`${BASE_URL}/api/students?all=1`).then(({ data: { data: { data: students } } }) => {
                    setStudents(students)
                });
                setChargingInitial(false)
            }catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de facturas, Vuelva a refrescar la página');
                setShowError(true);
                setLoadingTable(false);
                setChargingInitial(false)
            }
        }
        loadInvoices();
    }, []);

    useEffect(() => {
        loadLazyData();
    }, [lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

    async function loadLazyData() {

        try{
            setLoadingTable(true);
            let url = `${BASE_URL}/api/invoices?page=${lazyParams.page + 1}`;
            if (lazyParams.filters !== undefined && lazyParams.filters.student !== undefined && lazyParams.filters.student !== "") {
                let keys = Object.keys(lazyParams.filters);
                url = `${BASE_URL}/api/invoices?page=${lazyParams.page + 1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.student.value)}`;
            }
            await axios.get(url + sortQuery(lazyParams)).then(({ data: { data: invoices } }) => {
                setTotalRecords(invoices.meta.pagination.total);
                setInvoices(invoices.data);
                setLoadingTable(false);
            });
        }catch(err){
            console.log(err);
            console.warn('Hubo un problema al cargar las factuas');
            setShowError(true);
            setLoadingTable(false);
        }

    }


    useEffect(() => {
        async function loadInvoicesByStudentCourse() {
            try {
                //?all=1
                if (invoice.studentCourse != null) {
                    setChargingInvoicesByStudent(true);
                    await axios.get(`${BASE_URL}/api/invoices/getInvoiceByStudentAndCourse?course=${invoice.studentCourse}&student=${invoice.student}`,).then(({ data: { data: { data: invoices } } }) => {
                        setInvoicesPayed(invoices);
                        setChargingInvoicesByStudent(false);
                    });
                }

            } catch (error) {
                console.warn('Hubo un problema al cargar los datos para el informe analítico del alumno');
                setShowError(true);
                setChargingInvoicesByStudent(false)
            }
        }
        loadInvoicesByStudentCourse();
    }, [invoice.studentCourse, invoice.student]);


    const onPage = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onFilter = useDebouncedCallback((e) => {

        const event = {
            filters: {
                student: {
                    value: e.target.value
                }
            }
        };
        let _lazyParams = { ...lazyParams, ...event };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }, 400);

    const openNew = () => {
        setInvoice(emptyInvoice);
        setSubmitted(false);
        setInvoiceDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setInvoiceDialog(false);
    }

    const hideDeleteInvoiceDialog = () => {
        setDeleteInvoiceDialog(false);
    }

    async function saveInvoice() {

        try {

            setSubmitted(true);
            if (invoice.id) {
                await axios.put(`${BASE_URL}/api/invoices/${invoice.id}`, invoice).then((data) => {

                    setLazyParams({ ...lazyParams, page: 0 });
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Factura actualizada`, life: 3000 });
                })
            } else {
                // Si es deuda del año anterior, usar el curso anterior
                const payload = { ...invoice };
                if (invoice.previousYearDebt && invoice.previousCourseId) {
                    payload.studentCourse = invoice.previousCourseId;
                }
                await axios.post(`${BASE_URL}/api/invoices`, payload).then((data) => {
                    print(data.data.data);
                    setLazyParams({ ...lazyParams, page: 0 });
                    const yearLabel = invoice.previousYearDebt ? ` (${invoice.previousYear})` : '';
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: `Factura agregada${yearLabel}`, life: 3000 });
                })
            }
            setInvoice(emptyInvoice);
            setInvoiceDialog(false);

        } catch (error) {
            console.error(error)
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar factura', life: 3000 });
        }
    }


    const editInvoice = (_invoice) => {
        setCourses(_invoice.student.id !== undefined ? _invoice.student.courses : _invoice.studentCourse.student.courses);
        let editInvoice = {
            id: _invoice.id,
            studentCourse: _invoice.studentCourse.id_curso,
            student: _invoice.student.id !== undefined ? _invoice.student.id : parseInt(_invoice.studentCourse.id_alumno),
            fee: _invoice.fee,
            month: parseInt(_invoice.month),
            dateIssue: _invoice.dateIssue != null ? new Date(_invoice.dateIssue) : null,
        }
        setInvoice({ ...editInvoice });
        setInvoiceDialog(true);
    }

    const confirmDeleteInvoice = (_invoice) => {
        let deleleInvoice = {
            id: _invoice.id,
        };
        setInvoice({ ...deleleInvoice });
        setDeleteInvoiceDialog(true);
    }

    async function deleteInvoice() {

        try{
            await axios.delete(`${BASE_URL}/api/invoices/${invoice.id}`).then(() => {
                setLazyParams({ ...lazyParams, page: 0 });
                setDeleteInvoiceDialog(false);
                setInvoice(emptyInvoice);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Factura eliminado`, life: 3000 });
            });
        }
        catch(err){
            console.error(err)
            toast.current.show({ severity: 'success', summary: 'Exito', detail: `Hubo un problema al eliminar la factura`, life: 3000 });
        }

    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    async function getCourseStudent(val) {
        const [student] = await Promise.all([
            axios.get(`${BASE_URL}/api/students/${val}`)
                .then(({ data: { data: student } }) => setCourses(student.courses)),
        ]);

        return student;
    }

    async function getLastInvoicePay(courseId, studentId) {

        const [lastInvoiceData, courseAmount] = await Promise.all([
            axios.get(`${BASE_URL}/api/getLastInvoicePay?courseId=${courseId}&studentId=${studentId}`)
                .then(({ data: { data: lastInvoice } }) => lastInvoice),
            axios.get(`${BASE_URL}/api/getAmountCourse?courseId=${courseId}`)
                .then(({ data: { data: level } }) => level.fee)
        ]);

        // Si tiene deuda del año anterior
        if (lastInvoiceData && lastInvoiceData.hasPreviousYearDebt) {
            const debtMonth = lastInvoiceData.debtMonth || parseInt(lastInvoiceData.month) + 1;
            const _months = monthsBis.map(a => Object.assign({}, a));
            const monthObj = _months.find(m => m.id === debtMonth);
            if (monthObj) {
                setMonths([{ ...monthObj, name: `${monthObj.name} (${lastInvoiceData.previousYear})` }]);
            }
            return [debtMonth, parseFloat(lastInvoiceData.fee), {
                previousYearDebt: true,
                previousYear: lastInvoiceData.previousYear,
                previousEnrollmentId: lastInvoiceData.previousEnrollmentId,
                previousCourseId: lastInvoiceData.previousCourseId,
            }];
        }

        // Sin deuda anterior: flujo normal
        if (lastInvoiceData !== undefined) {
            const _months = monthsBis.map(a => Object.assign({}, a));
            const filtered = _months.filter(element => element.id > parseInt(lastInvoiceData.month));
            const uniqueMonth = filtered.slice(0, 1).shift();
            setMonths([uniqueMonth]);
            return [uniqueMonth.id, courseAmount, null];
        } else {
            const _months = monthsBis.map(a => Object.assign({}, a));
            const uniqueMonth = _months.slice(0, 1).shift();
            setMonths([uniqueMonth]);
            return [uniqueMonth.id, courseAmount, null];
        }
    }




    async function fetchMora(month, year) {
        if (!month || month === 13) return 0;
        try {
            let url = `${BASE_URL}/api/invoices/getMoraForMonth?month=${month}`;
            if (year) url += `&year=${year}`;
            const { data } = await axios.get(url);
            return data.mora || 0;
        } catch (err) {
            console.error('Error al calcular mora:', err);
            return 0;
        }
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _invoice = { ...invoice };
        if (name === 'student') {
            setCourses(null);
            getCourseStudent(val);
        }
        _invoice[`${name}`] = val;
        setInvoice(_invoice);
        if (name === 'studentCourse') {
            if (_invoice.student != null && val != null) {
                setMonths({...monthsBis});
                const lastMonth = getLastInvoicePay(val, _invoice.student);

                lastMonth.then(async (result)=>{
                    console.log(result);
                    const prevDebt = result[2]; // datos de deuda año anterior (o null)
                    if(result[0] === 13){
                        setInvoice({...invoice, studentCourse: val, month:13, mora: 0,
                            previousYearDebt: false, previousYear: null, previousEnrollmentId: null, previousCourseId: null});
                    }else{
                        const moraYear = prevDebt ? prevDebt.previousYear : null;
                        const mora = await fetchMora(result[0], moraYear);
                        setInvoice({...invoice, studentCourse: val, month:result[0], fee:result[1], mora: mora,
                            previousYearDebt: prevDebt ? prevDebt.previousYearDebt : false,
                            previousYear: prevDebt ? prevDebt.previousYear : null,
                            previousEnrollmentId: prevDebt ? prevDebt.previousEnrollmentId : null,
                            previousCourseId: prevDebt ? prevDebt.previousCourseId : null,
                        });
                    }
                });

            }
        }


    }

    const formatCurrency = (value) => {
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    const priceBodyTemplate = (rowData) => {
        const fee = parseFloat(rowData.fee) || 0;
        const mora = parseFloat(rowData.mora) || 0;
        const total = fee + mora;
        return (
            <div className="p-d-flex p-ai-center" style={{ gap: '0.4rem' }}>
                <span>{formatCurrency(total)}</span>
                {mora > 0 && (
                    <i className="pi pi-info-circle"
                        style={{ color: '#e65100', fontSize: '0.9rem', cursor: 'help' }}
                        title="Pagado con mora"
                        data-pr-tooltip="Pagado con mora"
                    />
                )}
            </div>
        );
    }



    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const download = (_invoice) => {


        axios({
            url: `${BASE_URL}/api/reports/downloadReportByInvoice/${_invoice.id}`,
            method: 'GET',
            responseType: 'blob', // Important
            data: _invoice
        }).then((response) => {
            FileDownload(response.data, 'recibo-pago-cuota.pdf');
        }).catch((error) => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el recibo de pago de cuota', life: 3000 });
        });
    }

    function printPdf(pdf) {

        var iframe = document.createElement('iframe');
        iframe.style.display = "none";
        iframe.src = pdf;
    
        document.body.appendChild(iframe);
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }

    const print = (_invoice) => {
        console.log(_invoice);
        axios({
            url: `${BASE_URL}/api/reports/downloadReportByInvoice/${_invoice.id}`,
            method: 'GET',
            responseType: 'blob', // Important
            data: _invoice
        }).then((response) => {
            console.log(response);
            var blobURL = URL.createObjectURL(response.data);
            printPdf(blobURL);
        }).catch((error) => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el recibo de pago de cuota', life: 3000 });
        });
    }

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editInvoice(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteInvoice(rowData)} />
            <Button icon="pi pi-print" className="p-button-rounded p-button-outlined p-button-info" onClick={() => print(rowData)} />
            <Button icon="pi pi-arrow-circle-down" className="p-button-rounded p-button-outlined p-button-info" onClick={() => download(rowData)} />
        </div>
    );




    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Detalle de cobros</span>
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

    const invoiceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveInvoice} />
        </div>
    );
    const deleteInvoiceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteInvoiceDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteInvoice} />
        </div>
    );



    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de facturas'}></Error>
        );
    } 


    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-receipt" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Facturas</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de facturas y cobros</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    {chargingInitial && (
                        <div className="p-d-flex p-ai-center p-jc-center p-py-4">
                            <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.5rem', marginRight: 8 }} />
                            <span style={{ color: '#6c757d', fontSize: '0.9rem', fontWeight: 500 }}>Cargando datos...</span>
                        </div>
                    )}
                    {!chargingInitial && <>
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>
                    <DataTable ref={dt} value={invoices} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingTable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                    >
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="dateIssue" header="Fecha de emisión" sortable ></Column>
                        <Column field="month" header="Mes" sortable ></Column>
                        <Column field="student.apellido_nombre_completo" header="Apellido y Nombre" sortable ></Column>
                        <Column field="studentCourse.course.nombre" header="Curso" ></Column>

                        <Column field="fee" sortField="amount" header="Monto" body={priceBodyTemplate} sortable ></Column>

                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={invoiceDialog} breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }} header="Detalle de costo fijo" modal className="p-fluid" footer={invoiceDialogFooter} onHide={hideDialog}>

                        <div className="p-field">
                            <label htmlFor="typeExpense">Alumnos</label>
                            <Dropdown appendTo={document.body} value={invoice.student} onChange={(e) => onInputChange(e, 'student')} options={students} optionValue="id" optionLabel="name_complete" filter showFilterClear filterBy="name_complete" placeholder="-- Seleccione alumno --" className={classNames({ 'p-invalid': submitted && !invoice.student })} />
                            {submitted && !invoice.student && <small className="p-invalid">Alumno es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="typeExpense">Curso</label>
                            <Dropdown appendTo={document.body} value={invoice.studentCourse} onChange={(e) => onInputChange(e, 'studentCourse')} options={courses} optionValue="id" optionLabel="nameId" filter showFilterClear filterBy="nameId" placeholder="-- Seleccione curso --" className={classNames({ 'p-invalid': submitted && !invoice.studentCourse })} />
                            {submitted && !invoice.studentCourse && <small className="p-invalid">Curso es requerido.</small>}
                        </div>
                        {invoice.previousYearDebt && (
                            <div style={{
                                background: '#ffebee', borderRadius: 8, padding: '0.7rem 1rem',
                                border: '1px solid #ef9a9a', marginBottom: '0.8rem'
                            }}>
                                <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-exclamation-triangle" style={{ color: '#c62828', fontSize: '1rem' }} />
                                    <span style={{ color: '#c62828', fontWeight: 700, fontSize: '0.85rem' }}>
                                        Deuda del año {invoice.previousYear}
                                    </span>
                                </div>
                                <p style={{ color: '#5d4037', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                                    Este alumno tiene cuotas impagas del ciclo anterior. Debe pagar primero las cuotas pendientes de {invoice.previousYear}.
                                </p>
                            </div>
                        )}

                        {invoice.id ?
                            <div className="p-field">
                                <label htmlFor="month">Mes</label>
                                <Dropdown appendTo={document.body} value={invoice.month} onChange={(e) => onInputChange(e, 'month')} options={months} disabled={true} optionValue="id" optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione mes --" className={classNames({ 'p-invalid': submitted && !invoice.month })} />
                            </div>
                            :
                            <div className="p-field">
                                <label htmlFor="month">Mes</label>
                                <Dropdown appendTo={document.body} value={invoice.month} onChange={(e) => onInputChange(e, 'month')} options={months} disabled={invoice.month!== null && invoice.month === 13} optionValue="id" optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione mes --" className={classNames({ 'p-invalid': submitted && !invoice.month })} />
                                {submitted && !invoice.month && <small className="p-invalid">Mes es requerido.</small>}
                            </div>
                        }

                        <div className="p-field">
                            <label htmlFor="fee">Monto</label>
                            <InputNumber id="fee" value={invoice.fee} onValueChange={(e) => onInputChange(e, 'fee')} mode="currency" currency="ARS" locale="es-AR" className={classNames({ 'p-invalid': submitted && !invoice.fee })} />
                            {submitted && !invoice.fee && <small className="p-invalid">Cuota es requerido.</small>}
                        </div>

                        {invoice.mora > 0 && (
                            <div className="p-field">
                                <label htmlFor="mora">Mora por vencimiento</label>
                                <InputNumber id="mora" value={invoice.mora} mode="currency" currency="ARS" locale="es-AR" disabled
                                    style={{ opacity: 1 }}
                                />
                                <small style={{ color: '#e65100' }}>
                                    Interés aplicado por cuota vencida. Total: {(parseFloat(invoice.fee || 0) + parseFloat(invoice.mora || 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                </small>
                            </div>
                        )}

                        <div className="p-field">
                            <label htmlFor="spanish">Fecha de emisión</label>
                            <Calendar  monthNavigator yearNavigator yearRange="1930:2150" appendTo={document.body} id="spanish" value={invoice.dateIssue || ''} viewDate={new Date()} onChange={(e) => onInputChange(e, 'dateIssue')} locale="es" dateFormat="dd/mm/yy" className={classNames({ 'p-invalid': submitted && !invoice.dateIssue })} />
                            {submitted && !invoice.dateIssue && <small className="p-invalid">Fecha es requerido.</small>}
                        </div>
                        {chargingInvoicesByStudent && (
                            <div className="p-d-flex p-ai-center p-jc-center p-py-3">
                                <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando facturas...</span>
                            </div>
                        )}
                        {!chargingInvoicesByStudent && invoicesPayed && invoicesPayed!== null  ?
                            <DataTable value={invoicesPayed} dataKey="id" className="datatable-responsive datatable-compact" sortField="apellido" sortOrder={1} >
                                    <Column field="id"  header="Nro. Recibo"></Column>
                                    <Column field="studentCourse.course.nombre"  header="Curso"></Column>
                                    <Column field="dateIssue"  header="Fecha de emisión"></Column>
                                    <Column field="month"  header="Mes"></Column>
                                    <Column field="fee" header="Monto" body={priceBodyTemplate}></Column>
                            </DataTable>
                            :""
                    }
                    </Dialog>

 
                    <Dialog visible={deleteInvoiceDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteInvoiceDialogFooter} onHide={hideDeleteInvoiceDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {invoice && <span>Confirma eliminar la factura <b></b>?</span>}
                        </div>
                    </Dialog>

                </>}
                </div>
            </div>
        </div>
    );
}



/* async function getLastInvoicePay(courseId, studentId) {

    const [lastMontn] = await Promise.all([axios.get(`${BASE_URL}/api/getLastInvoicePay?courseId=${courseId}&studentId=${studentId}`).
        then(({ data: { data: lastInvoice } }) => {
                if (lastInvoice !== null) {
                    const _months = monthsBis.map(a => Object.assign({}, a));
                    const filtered = _months.filter(element => { return element.id > parseInt(lastInvoice.month) });
                    const uniqueMonth = filtered.slice(0, 1).shift()
                    setMonths([uniqueMonth]); 
                    return uniqueMonth.id;
                }
            }
        )
    ]);
    return lastMontn;

}

const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    let _invoice = { ...invoice };
    if (name === 'student') {
        setCourses(null);
        getCourseStudent(val);
    }
    _invoice[`${name}`] = val;
    
    setInvoice(_invoice);
    
    if (name === 'studentCourse') {
        if (_invoice.student != null && val != null) {
            setMonths({...monthsBis});
            const lastMonth = getLastInvoicePay(val, _invoice.student);
            lastMonth.then((result)=>{ 
                setInvoice({...invoice,month: result})
                setInvoice({...invoice,studentCourse: val})
            });
        }
    }
} */