import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import Error from '../../components/Error';
import { addLocale } from 'primereact/api';

export default function ClassSchedulePage() {

    addLocale('es', {
        firstDayOfWeek: 1,
        dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
        dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Hoy', clear: 'Limpiar'
    });

    let emptyClass = { course_id: null, teacher_id: null, classroom_id: null, date: null, start_time: null, end_time: null, days_of_week: [], start_date: null, end_date: null };

    const dayOptions = [
        { label: 'Lunes', value: 1 },
        { label: 'Martes', value: 2 },
        { label: 'Miércoles', value: 3 },
        { label: 'Jueves', value: 4 },
        { label: 'Viernes', value: 5 },
        { label: 'Sábado', value: 6 },
        { label: 'Domingo', value: 0 },
    ];

    const [classes, setClasses] = useState(null);
    const [classItem, setClassItem] = useState(emptyClass);
    const [classDialog, setClassDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });

    const [courses, setCourses] = useState(null);
    const [teachers, setTeachers] = useState(null);
    const [classrooms, setClassrooms] = useState(null);

    // Filtros
    const [filterCourse, setFilterCourse] = useState(null);
    const [filterTeacher, setFilterTeacher] = useState(null);
    const [filterClassroom, setFilterClassroom] = useState(null);
    const [filterDateFrom, setFilterDateFrom] = useState(null);
    const [filterDateTo, setFilterDateTo] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);
    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

    useEffect(() => {
        async function loadDropdowns() {
            try {
                const [cRes, tRes, rRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/courses?all=1`),
                    axios.get(`${BASE_URL}/api/teachers?all=1`),
                    axios.get(`${BASE_URL}/api/classrooms?all=1`),
                ]);
                setCourses(cRes.data.data.data);
                setTeachers(tRes.data.data.data);
                setClassrooms(rRes.data.data.data);
            } catch (err) {
                console.error(err);
            }
        }
        loadDropdowns();
    }, []);

    useEffect(() => {
        loadData();
    }, [lazyParams, filterCourse, filterTeacher, filterClassroom, filterDateFrom, filterDateTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const formatDateForFilter = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    async function loadData() {
        try {
            setLoadingDatatable(true);
            let url = `${BASE_URL}/api/classSchedules?page=${lazyParams.page + 1}`;
            if (filterCourse) url += `&course_id=${filterCourse}`;
            if (filterTeacher) url += `&teacher_id=${filterTeacher}`;
            if (filterClassroom) url += `&classroom_id=${filterClassroom}`;
            if (filterDateFrom) url += `&date_from=${formatDateForFilter(filterDateFrom)}`;
            if (filterDateTo) url += `&date_to=${formatDateForFilter(filterDateTo)}`;
            const { data: { data: result } } = await axios.get(url);
            setClasses(result.data);
            setTotalRecords(result.meta.pagination.total);
        } catch (err) {
            console.error(err);
            setShowError(true);
        } finally {
            setLoadingDatatable(false);
        }
    }

    const onPage = (event) => setLazyParams({ first: event.first, rows: event.rows, page: event.page });

    const clearFilters = () => {
        setFilterCourse(null);
        setFilterTeacher(null);
        setFilterClassroom(null);
        setFilterDateFrom(null);
        setFilterDateTo(null);
    };

    const openNew = () => { setClassItem(emptyClass); setSubmitted(false); setClassDialog(true); };
    const hideDialog = () => { setSubmitted(false); setClassDialog(false); };
    const hideDeleteDialog = () => setDeleteDialog(false);

    const editClass = (rowData) => {
        const dateObj = rowData.date ? new Date(rowData.date + 'T12:00:00') : null;
        const dayOfWeek = dateObj ? dateObj.getDay() : null; // 0=dom, 1=lun, ...
        const cId = rowData.course ? parseInt(rowData.course.id) : null;
        const tId = rowData.teacher ? parseInt(rowData.teacher.id) : null;
        const rId = rowData.classroom ? parseInt(rowData.classroom.id) : null;
        setClassItem({
            id: rowData.id,
            course_id: cId,
            teacher_id: tId,
            classroom_id: rId,
            date: null,
            start_time: rowData.startTime ? parseTime(rowData.startTime) : null,
            end_time: rowData.endTime ? parseTime(rowData.endTime) : null,
            days_of_week: dayOfWeek !== null ? [dayOfWeek] : [],
            start_date: dateObj,
            end_date: dateObj,
        });
        setClassDialog(true);
    };

    const parseTime = (timeStr) => {
        const parts = timeStr.split(':');
        const d = new Date();
        d.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
        return d;
    };

    const confirmDelete = (rowData) => {
        setClassItem({ id: rowData.id, courseName: rowData.course?.nombre || '' });
        setDeleteDialog(true);
    };

    const formatDateForApi = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    const formatTimeForApi = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };

    const saveClass = async () => {
        setSubmitted(true);

        if (!classItem.course_id || !classItem.teacher_id || !classItem.classroom_id || !classItem.start_time || !classItem.end_time) return;
        if (!classItem.days_of_week || classItem.days_of_week.length === 0 || !classItem.start_date || !classItem.end_date) return;

        setSaving(true);
        try {
            // Si es edición, eliminar la clase original primero
            if (classItem.id) {
                await axios.delete(`${BASE_URL}/api/classSchedules/${classItem.id}`);
            }

            const payload = {
                course_id: classItem.course_id,
                teacher_id: classItem.teacher_id,
                classroom_id: classItem.classroom_id,
                start_date: formatDateForApi(classItem.start_date),
                end_date: formatDateForApi(classItem.end_date),
                start_time: formatTimeForApi(classItem.start_time),
                end_time: formatTimeForApi(classItem.end_time),
                days_of_week: classItem.days_of_week,
            };
            const { data } = await axios.post(`${BASE_URL}/api/classSchedules/bulk`, payload);
            const detail = data.message || `Se crearon ${data.created} clases.`;
            toast.current.show({ severity: data.created > 0 ? 'success' : 'warn', summary: data.created > 0 ? 'Guardado' : 'Atención', detail, life: 5000 });

            setClassDialog(false);
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'No se pudo guardar.';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
        } finally {
            setSaving(false);
        }
    };

    const deleteClass = async () => {
        try {
            await axios.delete(`${BASE_URL}/api/classSchedules/${classItem.id}`);
            toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Clase eliminada', life: 3000 });
            setDeleteDialog(false);
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.', life: 4000 });
        }
    };

    const dateBody = (rowData) => {
        if (!rowData.date) return '—';
        const p = rowData.date.split('-');
        return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : rowData.date;
    };

    const timeBody = (rowData) => {
        const s = (rowData.startTime || '').substring(0, 5);
        const e = (rowData.endTime || '').substring(0, 5);
        return <span style={{ fontWeight: 600, ...font }}>{s} - {e}</span>;
    };

    const courseBody = (rowData) => (
        <span style={{ fontWeight: 600, color: '#1a3320', ...font }}>{rowData.course?.nombre || '—'}</span>
    );

    const teacherBody = (rowData) => {
        const t = rowData.teacher;
        return t ? `${t.apellido}, ${t.nombre}` : '—';
    };

    const classroomBody = (rowData) => rowData.classroom?.nombre || '—';

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editClass(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDelete(rowData)} />
        </div>
    );

    const dialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} disabled={saving} />
            <Button label={saving ? 'Guardando...' : 'Guardar'} icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="p-button-success" onClick={saveClass} disabled={saving} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteClass} />
        </div>
    );

    const header = (
        <div className="p-d-flex p-ai-center" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-clock" style={{ color: '#3ab54a', fontSize: '1rem' }} />
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem', ...font }}>Clases programadas</span>
                <span style={{ background: '#ECEFF1', color: '#37474F', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #B0BEC5' }}>
                    {totalRecords} total
                </span>
            </div>
        </div>
    );

    if (showError) return <Error mensaje="Hubo un problema al cargar las clases" />;

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-clock" style={{ color: '#fff', fontSize: '1.4rem' }} />
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>Clases</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>Programación de clases por curso, docente y aula</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />

                    <div className="p-d-flex p-jc-between p-ai-center p-mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Button label="Nueva clase" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
                        <Button label="Limpiar filtros" icon="pi pi-filter-slash" className="p-button-outlined p-button-secondary" onClick={clearFilters} style={{ borderRadius: 8 }} />
                    </div>

                    {/* Filtros */}
                    <div className="p-fluid p-formgrid p-grid p-mb-3">
                        <div className="p-field p-col-12 p-md-2">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057', ...font }}>Fecha desde</label>
                            <Calendar appendTo={document.body} value={filterDateFrom}
                                onChange={e => { setFilterDateFrom(e.target.value || null); setLazyParams(p => ({ ...p, first: 0, page: 0 })); }}
                                locale="es" dateFormat="dd/mm/yy" showClear placeholder="Desde..." />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057', ...font }}>Fecha hasta</label>
                            <Calendar appendTo={document.body} value={filterDateTo}
                                onChange={e => { setFilterDateTo(e.target.value || null); setLazyParams(p => ({ ...p, first: 0, page: 0 })); }}
                                locale="es" dateFormat="dd/mm/yy" showClear placeholder="Hasta..."
                                minDate={filterDateFrom || undefined} />
                        </div>
                        <div className="p-field p-col-12 p-md-3">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057', ...font }}>Curso</label>
                            <Dropdown appendTo={document.body} value={filterCourse}
                                onChange={e => { setFilterCourse(e.value ?? null); setLazyParams(p => ({ ...p, first: 0, page: 0 })); }}
                                options={courses} optionLabel="nameYear" optionValue="id"
                                filter showClear filterBy="nameYear" placeholder="-- Todos --" />
                        </div>
                        <div className="p-field p-col-12 p-md-3">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057', ...font }}>Docente</label>
                            <Dropdown appendTo={document.body} value={filterTeacher}
                                onChange={e => { setFilterTeacher(e.value ?? null); setLazyParams(p => ({ ...p, first: 0, page: 0 })); }}
                                options={teachers} optionLabel="apellido_nombre_completo" optionValue="id"
                                filter showClear filterBy="apellido_nombre_completo" placeholder="-- Todos --" />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057', ...font }}>Aula</label>
                            <Dropdown appendTo={document.body} value={filterClassroom}
                                onChange={e => { setFilterClassroom(e.value ?? null); setLazyParams(p => ({ ...p, first: 0, page: 0 })); }}
                                options={classrooms} optionLabel="name" optionValue="id"
                                filter showClear filterBy="name" placeholder="-- Todas --" />
                        </div>
                    </div>

                    <DataTable ref={dt} value={classes} lazy paginator first={lazyParams.first} rows={10}
                        totalRecords={totalRecords} onPage={onPage} loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover>
                        <Column field="date" header="Fecha" body={dateBody} style={{ width: '110px' }} />
                        <Column header="Horario" body={timeBody} style={{ width: '130px' }} />
                        <Column header="Curso" body={courseBody} />
                        <Column header="Docente" body={teacherBody} />
                        <Column header="Aula" body={classroomBody} style={{ width: '140px' }} />
                        <Column body={actionBodyTemplate} style={{ width: '120px' }} />
                    </DataTable>

                    <Dialog visible={classDialog} breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '650px' }}
                        header={classItem.id ? 'Editar Clase' : 'Programar Clases'} modal className="p-fluid" footer={dialogFooter} onHide={hideDialog}>
                        <div className="p-field">
                            <label htmlFor="course_id">Curso</label>
                            <Dropdown appendTo={document.body} id="course_id" value={classItem.course_id}
                                onChange={(e) => setClassItem({ ...classItem, course_id: e.target.value })}
                                options={courses} optionLabel="nameYear" optionValue="id"
                                filter showClear filterBy="nameYear" placeholder="-- Seleccione curso --"
                                className={classNames({ 'p-invalid': submitted && !classItem.course_id })} />
                            {submitted && !classItem.course_id && <small className="p-invalid">Curso es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="teacher_id">Docente</label>
                            <Dropdown appendTo={document.body} id="teacher_id" value={classItem.teacher_id}
                                onChange={(e) => setClassItem({ ...classItem, teacher_id: e.target.value })}
                                options={teachers} optionLabel="apellido_nombre_completo" optionValue="id"
                                filter showClear filterBy="apellido_nombre_completo" placeholder="-- Seleccione docente --"
                                className={classNames({ 'p-invalid': submitted && !classItem.teacher_id })} />
                            {submitted && !classItem.teacher_id && <small className="p-invalid">Docente es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="classroom_id">Aula</label>
                            <Dropdown appendTo={document.body} id="classroom_id" value={classItem.classroom_id}
                                onChange={(e) => setClassItem({ ...classItem, classroom_id: e.target.value })}
                                options={classrooms} optionLabel="name" optionValue="id"
                                filter showClear filterBy="name" placeholder="-- Seleccione aula --"
                                className={classNames({ 'p-invalid': submitted && !classItem.classroom_id })} />
                            {submitted && !classItem.classroom_id && <small className="p-invalid">Aula es requerido.</small>}
                        </div>
                        <div className="p-field">
                            <label htmlFor="days_of_week">Días de la semana</label>
                            <MultiSelect appendTo={document.body} id="days_of_week" value={classItem.days_of_week}
                                onChange={(e) => setClassItem({ ...classItem, days_of_week: e.value })}
                                options={dayOptions} optionLabel="label" optionValue="value"
                                placeholder="-- Seleccione días --" display="chip"
                                className={classNames({ 'p-invalid': submitted && (!classItem.days_of_week || classItem.days_of_week.length === 0) })} />
                            {submitted && (!classItem.days_of_week || classItem.days_of_week.length === 0) && <small className="p-invalid">Seleccione al menos un día.</small>}
                        </div>
                        <div className="p-formgrid p-grid">
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="start_date">Fecha inicio</label>
                                <Calendar appendTo={document.body} id="start_date" value={classItem.start_date}
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        const updates = { ...classItem, start_date: newStart };
                                        if (newStart && classItem.end_date && new Date(classItem.end_date) < new Date(newStart)) {
                                            updates.end_date = null;
                                        }
                                        setClassItem(updates);
                                    }}
                                    locale="es" dateFormat="dd/mm/yy" monthNavigator yearNavigator yearRange="2024:2030"
                                    className={classNames({ 'p-invalid': submitted && !classItem.start_date })} />
                                {submitted && !classItem.start_date && <small className="p-invalid">Requerido.</small>}
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="end_date">Fecha fin</label>
                                <Calendar appendTo={document.body} id="end_date" value={classItem.end_date}
                                    onChange={(e) => setClassItem({ ...classItem, end_date: e.target.value })}
                                    locale="es" dateFormat="dd/mm/yy" monthNavigator yearNavigator yearRange="2024:2030"
                                    minDate={classItem.start_date || undefined}
                                    className={classNames({ 'p-invalid': submitted && !classItem.end_date })} />
                                {submitted && !classItem.end_date && <small className="p-invalid">Requerido.</small>}
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="start_time">Hora inicio</label>
                                <Calendar appendTo={document.body} id="start_time" value={classItem.start_time}
                                    onChange={(e) => setClassItem({ ...classItem, start_time: e.target.value })}
                                    timeOnly hourFormat="24"
                                    className={classNames({ 'p-invalid': submitted && !classItem.start_time })} />
                                {submitted && !classItem.start_time && <small className="p-invalid">Requerido.</small>}
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="end_time">Hora fin</label>
                                <Calendar appendTo={document.body} id="end_time" value={classItem.end_time}
                                    onChange={(e) => setClassItem({ ...classItem, end_time: e.target.value })}
                                    timeOnly hourFormat="24"
                                    className={classNames({ 'p-invalid': submitted && !classItem.end_time })} />
                                {submitted && !classItem.end_time && <small className="p-invalid">Requerido.</small>}
                            </div>
                        </div>
                    </Dialog>

                    <Dialog visible={deleteDialog} style={{ width: '450px' }} header="Confirmar" modal footer={deleteDialogFooter} onHide={hideDeleteDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Eliminar esta clase?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
