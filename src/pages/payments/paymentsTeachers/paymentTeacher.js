import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import {BASE_URL} from '../../../helpers/BaseUrl';
import { sortQuery } from '../../../helpers/listQuery';
import { InputNumber } from 'primereact/inputnumber';
import Loading from '../../../components/Loading';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { addLocale } from 'primereact/api';
import Error from '../../../components/Error';
const FileDownload = require('js-file-download');

export default function PaymentTeacher(){

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

    let emptyPaymentTeacher= {
        teacher: null,
        date: null,
        amount: 0,
    };
    const [teachers, setTeachers] = useState(null);
    const [paymentTeachers, setPaymentTeachers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentTeacher,setPaymentTeacher] = useState(emptyPaymentTeacher)
    const [paymentTeacherDialog, setPaymentTeacherDialog] = useState(false);
    const [deletePaymentTeacherDialog, setDeletePaymentTeacherDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);

    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showError, setShowError] = useState(false);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(()=>{
        setLoading(false);
        async function loadDropdownData() {
            try {
                const {data: {data: {data: teachers}}} = await axios.get(`${BASE_URL}/api/teachers`);
                setTeachers(teachers);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de pagos de docentes');
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
                let url = `${BASE_URL}/api/paymentTeachers/?page=${lazyParams.page+1}`;
                if(lazyParams.filters!==undefined && lazyParams.filters.teacher!==undefined){
                    let keys = Object.keys(lazyParams.filters);
                    url = `${BASE_URL}/api/paymentTeachers/?page=${lazyParams.page+1}&${keys[0]}=${encodeURIComponent(lazyParams.filters.teacher.value)}`;
                }
                await axios.get(url + sortQuery(lazyParams)).then(({data: {data:  paymentTeachers}}) => {
                    setTotalRecords(paymentTeachers.meta.pagination.total);
                    setPaymentTeachers(paymentTeachers.data)
                    setLoadingDatatable(false);
                });
            }
            catch(err){
                console.log(err);
                console.warn('Hubo un problema con la carga de pagos de docentes');
                setShowError(true);
                setLoadingDatatable(false);
            }
          
        }
        loadLazyData();
    },[lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {
        
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => { 
        console.log(event);
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onFilter = (e) => {
        const eventData = {filters:{
            teacher:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    }

    const openNew = () => {
        setPaymentTeacher(emptyPaymentTeacher);
        setSubmitted(false);
        setPaymentTeacherDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setPaymentTeacherDialog(false);
    }

    const hideDeletePaymentTeacherDialog = () => {
        setDeletePaymentTeacherDialog(false);
    }

     async function savePaymentTeacher()  {

            try {
          
                setSubmitted(true);
                if(paymentTeacher.id){
    
                    await axios.put(`${BASE_URL}/api/paymentTeachers/${paymentTeacher.id}`, paymentTeacher).then(function(){
                        setLazyParams({...lazyParams,page: 0})
                        setSubmitted(false);
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Pago a docente actualizado', life: 3000 });
                    });


                }else{

                    await axios.post(`${BASE_URL}/api/paymentTeachers`, paymentTeacher).then(function(){
                        setLazyParams({...lazyParams,page: 0})
                        setSubmitted(false);
                        toast.current.show({ severity: 'success', summary: 'Exito', detail:`Pago a docente agregado`, life: 3000 });
                    });
                }

                setPaymentTeacher(emptyPaymentTeacher);
                setPaymentTeacherDialog(false);

              } catch (error) {
                console.error(error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el pago a docente', life: 3000 });
              } 
        }
       
      
      const editPaymentTeacher = (_paymentTeacher) => {
        let editPaymentTeacher= {
            id: _paymentTeacher.id,
            teacher: _paymentTeacher.teacher_id,
            amount: _paymentTeacher.amount,
            date :_paymentTeacher.date != null ? new Date(_paymentTeacher.date):null,
        };
        setPaymentTeacher({ ...editPaymentTeacher });
        setPaymentTeacherDialog(true);
    }

    const confirmDeletePaymentTeacher = (_paymentTeacher) => {
        let delelePaymentTeacher= {
            id: _paymentTeacher.id,
        };
        setPaymentTeacher({ ...delelePaymentTeacher });     
        setDeletePaymentTeacherDialog(true);
    }

    async function deletePaymentTeacher() {

        try{
            await axios.delete(`${BASE_URL}/api/paymentTeachers/${paymentTeacher.id}`).then(function(){
                setLazyParams({...lazyParams,page: 0})
                setDeletePaymentTeacherDialog(false);
                setPaymentTeacher(emptyPaymentTeacher);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Pago a docente eliminado`, life: 3000 });
            });
        }catch(err){
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el pago a docente', life: 3000 });
        }
        

    }

    const downloadReceipt = (_paymentTeacher) => {
        axios({
            url: `${BASE_URL}/api/reports/downloadReceiptByPaymentTeacher/${_paymentTeacher.id}`,
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
            FileDownload(response.data, 'recibo-pago-docente.pdf');
        }).catch((error) => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el recibo de pago a docente', life: 3000 });
        });
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _paymentTeacher = { ...paymentTeacher };
        _paymentTeacher[`${name}`] = val;

        setPaymentTeacher(_paymentTeacher);
    }


    const formatCurrency = (value) => {
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    const priceBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Monto</span>
                {formatCurrency(parseFloat(rowData.amount))}
            </>
        );
    }


    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editPaymentTeacher(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeletePaymentTeacher(rowData)} />
            <Button icon="pi pi-arrow-circle-down" className="p-button-rounded p-button-outlined p-button-info" onClick={() => downloadReceipt(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Pagos a docentes</span>
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

    const paymentTeacherDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={savePaymentTeacher} />
        </div>
    );
    const deletePaymentTeacherDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeletePaymentTeacherDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deletePaymentTeacher} />
        </div>
    );


    if(loading){
        return (
            <Loading/> 
        );
    } 
    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de pagos de docentes'}></Error>
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
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Pagos a docentes</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de pagos a docentes</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={paymentTeachers} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                     
                        <Column field="id" header="Id" sortable ></Column>
                        <Column field="amount" header="Monto"   body={priceBodyTemplate} sortable ></Column>
                        <Column field="date" header="Fecha" sortable ></Column>
                        <Column field="teacher.data.completeName" header="Docente" sortable ></Column>
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={paymentTeacherDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle pago a docente" modal className="p-fluid" footer={paymentTeacherDialogFooter} onHide={hideDialog}>

                        <div className="p-field">
                            <label htmlFor="teachers">Docente</label>
                            <Dropdown appendTo={document.body} value={paymentTeacher.teacher}  onChange={(e) => onInputChange(e,'teacher')} options={teachers} optionValue="id" optionLabel="completeName" filter showClear filterBy="nameComplete" placeholder="-- Seleccione docente --" className={classNames({ 'p-invalid': submitted && !paymentTeacher.teacher })}/>
                            {submitted && !paymentTeacher.teachers && <small className="p-invalid">Docente es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="spanish">Fecha</label>
                            <Calendar  monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="spanish" value={paymentTeacher.date || ''} viewDate={new Date()} onChange={(e) => onInputChange(e, 'date')} locale="es" dateFormat="dd/mm/yy" className={classNames({ 'p-invalid': submitted && !paymentTeacher.date })}/>
                            {submitted && !paymentTeacher.date && <small className="p-invalid">Fecha es requerido.</small>}
                        </div>
                        <div className="p-field">
                                <label htmlFor="amount">Monto</label>
                                <InputNumber id="amount" value={paymentTeacher.amount} onValueChange={(e) => onInputChange(e, 'amount')} mode="currency" currency="ARS" locale="es-AR" className={classNames({ 'p-invalid': submitted && !paymentTeacher.amount })}/>
                                {submitted && !paymentTeacher.amount && <small className="p-invalid">Monto es requerido.</small>}
                        </div>
                    </Dialog>
                    
                    <Dialog visible={deletePaymentTeacherDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deletePaymentTeacherDialogFooter} onHide={hideDeletePaymentTeacherDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {paymentTeacher && <span>Confirma eliminar el costo fijo <b>{paymentTeacher.typeExpense}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}