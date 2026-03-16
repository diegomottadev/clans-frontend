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
import { InputNumber } from 'primereact/inputnumber';
import Loading from '../../../components/Loading';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { addLocale } from 'primereact/api';
import Error from '../../../components/Error';

export default function FixedCost(){

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

    let emptyFixedCost= {
        typeExpense: null,
        date: null,
        amount: null,
    };
    const [showError, setShowError] = useState(false);

    const [typeExpenses, setTypeExpenses] = useState(null);
    const [fixedCosts, setFixedCosts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fixedCost,setFixedCost] = useState(emptyFixedCost)
    const [fixedCostDialog, setFixedCostDialog] = useState(false);
    const [deleteFixedCostDialog, setDeleteFixedCostDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);

    const [loadingTable, setLoadingTable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    useEffect(()=>{
        setLoading(false);
        async function loadDropdownData() {
            try {
                const {data: {data: {data: typeExpenses}}} = await axios.get(`${BASE_URL}/api/typeExpenses?all=1`);
                setTypeExpenses(typeExpenses);
            } catch(err){
                console.log(err);
                console.warn('Hubo un problema al cargar los conceptos');
                setShowError(true);
            }
        }
        loadDropdownData();
    },[]);


    useEffect(() => {
        loadLazyData();
    },[lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

    async  function loadLazyData () {
        try{
            setLoadingTable(true);
            let url = `${BASE_URL}/api/fixedCosts?page=${lazyParams.page+1}`;
            if(lazyParams.filters!==undefined && lazyParams.filters.typeExpense!==undefined && lazyParams.filters.typeExpense!==""){
                let keys = Object.keys(lazyParams.filters);
                url = `${BASE_URL}/api/fixedCosts?page=${lazyParams.page+1}&${keys[0]}=${lazyParams.filters.typeExpense.value}`;
            }
            await axios.get(url).then(({data: {data:  fixedCosts}}) => {
                setTotalRecords(fixedCosts.meta.pagination.total);
                setFixedCosts(fixedCosts.data);
                setLoadingTable(false);
            });
        
        }catch(err){
            console.log(err);
            console.warn('Hubo un problema con la carga de conceptos');
            setShowError(true);
            setLoadingTable(false);
        }
        
    }


    const onPage = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => { 
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onFilter = (e) => {

        const event = {filters:{
            typeExpense:{
                value: e.target.value
            }
        }};
        let _lazyParams = { ...lazyParams, ...event };
        _lazyParams['first'] = 0;
        setLazyParams(_lazyParams);
    }

    const openNew = () => {
        setFixedCost(emptyFixedCost);
        setSubmitted(false);
        setFixedCostDialog(true);
    }

    const hideDialog = () => {
        setSubmitted(false);
        setFixedCostDialog(false);
    }

    const hideDeleteFixedCostDialog = () => {
        setDeleteFixedCostDialog(false);
    }

     async function saveFixedCost()  {

            try {
                setSubmitted(true);
                if(fixedCost.id){
                    await axios.put(`${BASE_URL}/api/fixedCosts/${fixedCost.id}`, fixedCost).then(()=>{
                        setLazyParams({...lazyParams,page: 0});
                        toast.current.show({ severity: 'success', summary: 'Exito', detail: `Concepto: ${fixedCost.typeExpenseName} actualizado`, life: 3000 });
                    });
                }else{
                    await axios.post(`${BASE_URL}/api/fixedCosts`, fixedCost).then(()=>{
                        setLazyParams({...lazyParams,page: 0});
                        toast.current.show({ severity: 'success', summary: 'Exito', detail:`Concepto agregado`, life: 3000 });
                    });
                }
                setFixedCost(emptyFixedCost);
                setFixedCostDialog(false);
              } catch (error) {
                console.error(error)
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el concepto', life: 3000 });
              } 
        }
       
      
      const editFixedCost = (_fixedCost) => {
        let editFixedCost= {
            id: _fixedCost.id,
            typeExpense: _fixedCost.typeExpense.id,
            typeExpenseName: _fixedCost.typeExpense.nombre,
            amount: _fixedCost.amount,
            date :_fixedCost.date != null ? new Date(_fixedCost.date):null,

        };
        setFixedCost({ ...editFixedCost });
        setFixedCostDialog(true);
    }

    const confirmDeleteFixedCost = (_fixedCost) => {
        let deleleFixedCost= {
            id: _fixedCost.id,
            typeExpense: _fixedCost.typeExpense.nombre,
        };
        setFixedCost({ ...deleleFixedCost });     
        setDeleteFixedCostDialog(true);
    }

    async function deleteFixedCost() {
        try{
            await axios.delete(`${BASE_URL}/api/fixedCosts/${fixedCost.id}`).then(()=>{
                setLazyParams({...lazyParams,page: 0});
                setDeleteFixedCostDialog(false);
                setFixedCost(emptyFixedCost);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Concepto: ${fixedCost.typeExpense} eliminado`, life: 3000 });    
            });  
        }catch(err){
            console.error(err)
            toast.current.show({ severity: 'error', summary: 'Exito', detail: `Hubo un problema al eliminar el concepto`, life: 3000 });    

        }
       
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _fixedCost = { ...fixedCost };
        _fixedCost[`${name}`] = val;

        setFixedCost(_fixedCost);
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
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editFixedCost(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteFixedCost(rowData)} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Costos fijos</span>
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

    const fixedCostDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveFixedCost} />
        </div>
    );
    const deleteFixedCostDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteFixedCostDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteFixedCost} />
        </div>
    );


    if(loading){
        return (
            <Loading/> 
        );
    } 

    if(showError){
        return(
                <Error mensaje={'Hubo un problema al cargar de conceptos'}></Error>
        );
    } 
    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-dollar" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Costos fijos</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión de costos fijos y egresos</p>
                    </div>
                </div>
                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    {leftToolbarTemplate()}
                </div>

                    <DataTable ref={dt} value={fixedCosts} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingTable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                        >
                        <Column field="amount" header="Cuota" body={priceBodyTemplate} sortable ></Column>
                        <Column field="date" header="Fecha" sortable ></Column>
                        <Column field="typeExpense.nombre" header="Tipo de egreso" sortable ></Column>
                        <Column body={actionBodyTemplate}></Column>
                    </DataTable>

                    <Dialog visible={fixedCostDialog} breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '50vw'}} header="Detalle de concepto" modal className="p-fluid" footer={fixedCostDialogFooter} onHide={hideDialog}>

                        <div className="p-field">
                            <label htmlFor="typeExpense">Tipo de egreso</label>
                            <Dropdown appendTo={document.body} value={fixedCost.typeExpense}  onChange={(e) => onInputChange(e,'typeExpense')} options={typeExpenses} optionValue="id" optionLabel="name" filter showClear filterBy="name" placeholder="-- Seleccione un tipo de egreso --" className={classNames({ 'p-invalid': submitted && !fixedCost.typeExpense })}/>
                            {submitted && !fixedCost.typeExpense && <small className="p-invalid">Tipo de egreso es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="spanish">Fecha</label>
                            <Calendar  monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="spanish" value={fixedCost.date || ''} viewDate={new Date()} onChange={(e) => onInputChange(e, 'date')} locale="es" dateFormat="dd/mm/yy" className={classNames({ 'p-invalid': submitted && !fixedCost.date })}/>
                            {submitted && !fixedCost.date && <small className="p-invalid">Fecha es requerido.</small>}
                        </div>
                        <div className="p-field">
                                <label htmlFor="amount">Monto</label>
                                <InputNumber id="amount" value={fixedCost.amount} onValueChange={(e) => onInputChange(e, 'amount')} mode="currency" currency="ARS" locale="es-AR" className={classNames({ 'p-invalid': submitted && !fixedCost.amount })}/>
                                {submitted && !fixedCost.amount && <small className="p-invalid">Monto es requerido.</small>}
                        </div>
                    </Dialog>
                    
                    <Dialog visible={deleteFixedCostDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteFixedCostDialogFooter} onHide={hideDeleteFixedCostDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            {fixedCost && <span>Confirma eliminar el Concepto <b>{fixedCost.typeExpense}</b>?</span>}
                        </div>
                    </Dialog>

                 
                </div>
            </div>
        </div>
    );
}