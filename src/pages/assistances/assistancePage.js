import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Loading from '../../components/Loading';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { appendSortParams } from '../../helpers/listQuery';
import classNames from 'classnames';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import Error from '../../components/Error';
import { addLocale } from 'primereact/api';
import { useDebouncedCallback } from '../../helpers/useDebouncedCallback';


export default function Assistance() {

    let emptyAssistance = {
        course: null,
        date: null,
    };

    addLocale('es', {
        firstDayOfWeek: 1,
        dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
        dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Hoy',
        clear: 'Limpiar',
    });

    const [showError, setShowError] = useState(false);
    const [assistances, setAssistances] = useState(null);
    const [assistance, setAssistance] = useState(emptyAssistance);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [evaluationDialog, setAssistanceDialog] = useState(false);
    const [deleteEvaluationDialog, setDeleteAssistanceDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [active, setActive] = useState(0);
    const [assistancesStudents, setAssistencesStudents] = useState([]);
    const [students, setStudents] = useState(null);
    const [typeAssistances, setTypeAssistances] = useState(null);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filtros
    const [schoolYears, setSchoolYears] = useState([]);
    const [schoolYear, setSchoolYear] = useState(undefined); // undefined = todavía no cargado
    const [levels, setLevels] = useState([]);
    const [levelFilter, setLevelFilter] = useState(null);
    const [courseFilter, setCourseFilter] = useState(null);
    const [dateFilter, setDateFilter] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');

    // Estadísticas
    const [assistanceCounts, setAssistanceCounts] = useState(null);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    const toast = useRef(null);
    const dt = useRef(null);

    // Carga años lectivos
    useEffect(() => {
        setLoading(false);
        async function loadSchoolYears() {
            try {
                const { data: { data: { data: years } } } = await axios.get(`${BASE_URL}/api/schoolYears?all=1`);
                setSchoolYears(Array.isArray(years) ? years : []);
                const vigente = Array.isArray(years) ? years.find(y => y.active === true) : null;
                setSchoolYear(vigente || null);
            } catch (err) {
                console.warn('Hubo un problema con la carga de años lectivos');
                setSchoolYear(null); // Desbloquear loadLazyData aunque falle
            }
        }
        loadSchoolYears();
    }, []);

    // Carga tipos de asistencia y niveles
    useEffect(() => {
        async function loadDropdownData() {
            try {
                const [typeAssistancesRes, levelsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/typeAssistances?all=1`),
                    axios.get(`${BASE_URL}/api/levels?all=1`),
                ]);
                setTypeAssistances(typeAssistancesRes.data.data.data);
                const rawLevels = levelsRes.data?.data;
                const levelsList = Array.isArray(rawLevels) ? rawLevels
                    : (rawLevels?.data != null) ? (Array.isArray(rawLevels.data) ? rawLevels.data : rawLevels.data?.data ?? [])
                    : [];
                setLevels(levelsList);
            } catch (err) {
                console.error(err);
                console.warn('Hubo un problema al cargar datos de asistencias.');
                setShowError(true);
            }
        }
        loadDropdownData();
    }, []);

    // Carga cursos según año lectivo
    useEffect(() => {
        async function loadCourses() {
            if (!schoolYear || !schoolYear.id) {
                try {
                    const { data } = await axios.get(`${BASE_URL}/api/courses?all=1`);
                    const raw = data?.data;
                    const list = Array.isArray(raw) ? raw : (raw?.data) ? raw.data : [];
                    setCourses(list);
                } catch (err) {
                    setCourses([]);
                }
                setCourseFilter(null);
                return;
            }
            try {
                const { data } = await axios.get(`${BASE_URL}/api/courses?all=1&schoolYearId=${schoolYear.id}`);
                const raw = data?.data;
                const list = Array.isArray(raw) ? raw : (raw?.data) ? raw.data : [];
                setCourses(list);
                setCourseFilter(null);
            } catch (err) {
                console.warn('Hubo un problema con la carga de cursos');
                setCourses([]);
            }
        }
        loadCourses();
    }, [schoolYear]);

    // Carga asistencias (lazy)
    useEffect(() => {
        if (schoolYear === undefined) return; // Esperar a que se resuelva el año activo
        async function loadLazyData() {
            try {
                setLoadingDatatable(true);
                const params = new URLSearchParams();
                params.set('page', String(lazyParams.page + 1));
                if (schoolYear && schoolYear.id != null) {
                    params.set('schoolYearId', String(schoolYear.id));
                }
                if (levelFilter != null) {
                    const levelId = typeof levelFilter === 'object' && levelFilter?.id != null ? levelFilter.id : levelFilter;
                    params.set('levelId', String(levelId));
                }
                if (courseFilter != null && courseFilter.id != null) {
                    params.set('courseAssistence', String(courseFilter.id));
                }
                if (dateFilter != null) {
                    const d = dateFilter instanceof Date ? dateFilter : new Date(dateFilter);
                    params.set('dateAssistence', d.toISOString().split('T')[0]);
                }
                if (searchFilter && searchFilter.trim() !== '') {
                    params.set('courseSearch', searchFilter.trim());
                }

                appendSortParams(params, lazyParams);
                const url = `${BASE_URL}/api/assistances?${params.toString()}`;
                const { data: { data: assistancesData } } = await axios.get(url);

                if (assistancesData.meta !== undefined) {
                    setTotalRecords(assistancesData.meta.pagination.total);
                }
                const list = assistancesData.data;
                setAssistances(list);
                setLoadingDatatable(false);

                // Estadísticas globales con los mismos filtros activos
                try {
                    const countParams = new URLSearchParams();
                    if (schoolYear && schoolYear.id != null) countParams.set('schoolYearId', String(schoolYear.id));
                    if (levelFilter != null) {
                        const lvl = typeof levelFilter === 'object' && levelFilter?.id != null ? levelFilter.id : levelFilter;
                        countParams.set('levelId', String(lvl));
                    }
                    if (courseFilter != null && courseFilter.id != null) countParams.set('courseAssistence', String(courseFilter.id));
                    if (dateFilter != null) {
                        const d = dateFilter instanceof Date ? dateFilter : new Date(dateFilter);
                        countParams.set('dateAssistence', d.toISOString().split('T')[0]);
                    }
                    if (searchFilter && searchFilter.trim() !== '') countParams.set('courseSearch', searchFilter.trim());
                    const { data: countData } = await axios.get(`${BASE_URL}/api/assistances/counts?${countParams.toString()}`);
                    setAssistanceCounts(countData?.data ?? null);
                } catch (_) { /* silencioso */ }
            } catch (err) {
                console.error(err);
                console.warn('Hubo un problema con la carga de las asistencias');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    }, [lazyParams, schoolYear, levelFilter, courseFilter, dateFilter, searchFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    };

    const onSort = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    };

    const onFilter = useDebouncedCallback((e) => {
        setSearchFilter(e.target.value);
        setLazyParams(p => ({ ...p, first: 0, page: 0 }));
    }, 400);


    const openNew = () => {
        setActive(0);
        setAssistance(emptyAssistance);
        setSubmitted(false);
        setValidationErrors({});
        setStudents(null);
        setAssistencesStudents([]);
        setAssistanceDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setValidationErrors({});
        setActive(0);
        setAssistencesStudents([]);
        setAssistanceDialog(false);
    };

    const hideDeleteAssistanceDialog = () => {
        setDeleteAssistanceDialog(false);
    };

    async function saveAssistance() {
        setSubmitted(true);
        if (!assistance.course || !assistance.date) return;
        try {
            if (assistance.id) {
                const { data: { data } } = await axios.put(`${BASE_URL}/api/assistances/${assistance.id}`, assistance);
                setLazyParams({ ...lazyParams, page: 0 });
                setAssistanceDialog(false);
                setSubmitted(false);
                setValidationErrors({});
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: `Asistencia del ${data.date} actualizada`, life: 3000 });
            } else {
                const { data: { data } } = await axios.post(`${BASE_URL}/api/assistances`, assistance);
                setSubmitted(false);
                setValidationErrors({});
                setAssistance({ ...assistance, id: data.id });
                // Cargar alumnos del curso para el tab 2
                const { data: { data: course } } = await axios.get(`${BASE_URL}/api/courses/${assistance.course}`);
                const list = (course.students?.data || []).map(s => ({ ...s, nombre: s.firstName, apellido: s.lastName }));
                setStudents(list);
                setActive(1);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: `Asistencia del ${data.date} creada. Registrá la asistencia de los alumnos.`, life: 4000 });
            }
        } catch (error) {
            const data = error?.response?.data || {};
            const errors = error?.response?.status === 422 ? data : {};
            setValidationErrors(errors);
            const fieldLabels = { date: 'Fecha', course: 'Curso' };
            const messages = Object.entries(errors)
                .filter(([, msgs]) => Array.isArray(msgs))
                .map(([field, msgs]) => `${fieldLabels[field] || field}: ${msgs[0]}`)
                .join('  |  ');
            const detail = messages || data?.message || 'Hubo un problema al guardar la asistencia';
            toast.current.show({ severity: 'error', summary: 'Error', detail, life: 6000 });
        }
    }

    async function addAssitanceStudent() {
        try {
            const body = { assistancesStudents };
            const { data: { data } } = await axios.post(`${BASE_URL}/api/assistances/${assistance.id}/students`, body);
            setLazyParams({ ...lazyParams, page: 0 });
            setAssistencesStudents([]);
            setAssistanceDialog(false);
            setActive(0);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: `Asistencia del ${data.date} guardada con ${assistancesStudents.length} alumnos`, life: 3000 });
        } catch (error) {
            const msg = error?.response?.data?.message || 'Hubo un problema al guardar la asistencia con alumnos';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
        }
    }

    const editAssistance = (assistance) => {
        setSubmitted(false);
        setValidationErrors({});
        let editAssistance = {
            id: assistance.id,
            course: assistance.course.id,
            date: assistance.date != null ? new Date(assistance.date) : null,
        };
        setAssistencesStudents(() => {
            return assistance.studentsAssisted.map(assistenceStudent => ({
                studentId: assistenceStudent.id,
                typeAssistanceId: assistenceStudent.pivot.id_tipos_asistencia,
            }));
        });
        setAssistance({ ...editAssistance });
        setAssistanceDialog(true);
        axios.get(`${BASE_URL}/api/courses/${assistance.course.id}`).then(({ data: { data: course } }) => {
            const list = (course.students?.data || []).map(s => ({ ...s, nombre: s.firstName, apellido: s.lastName }));
            setStudents(list);
        });
    };

    const confirmDeleteAssistance = (assistance) => {
        setAssistance({ id: assistance.id });
        setDeleteAssistanceDialog(true);
    };

    async function deleteEvaluation() {
        try {
            await axios.delete(`${BASE_URL}/api/assistances/${assistance.id}`).then(() => {
                setLazyParams({ ...lazyParams, page: 0 });
                setDeleteAssistanceDialog(false);
                setAssistance(emptyAssistance);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Dia de asistencia eliminado`, life: 3000 });
            });
        } catch (err) {
            console.error(err);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar la asistencia', life: 3000 });
        }
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _assistance = { ...assistance };
        _assistance[`${name}`] = val;
        setAssistance(_assistance);
    };

    const checkStudent = (studentId) => {
        if (assistancesStudents.length > 0) {
            let result = assistancesStudents.filter(a => a.studentId === studentId);
            return result;
        }
        return false;
    };

    function updateListAssistance(studentId, typeAssistanceId) {
        setAssistencesStudents(assistancesStudents => {
            return assistancesStudents.map(a => {
                if (a.studentId === studentId) a.typeAssistanceId = typeAssistanceId;
                return a;
            });
        });
    }

    const addStudent = (studentId, typeAssistanceId) => {
        if (checkStudent(studentId).length > 0) {
            updateListAssistance(studentId, typeAssistanceId);
        } else {
            setAssistencesStudents(a => a.concat({ studentId, typeAssistanceId }));
        }
    };

    const checkElement = (studentId, typeAssistanceId) => {
        if (assistancesStudents.length > 0) {
            return assistancesStudents.some(a => a.studentId === studentId && a.typeAssistanceId === typeAssistanceId);
        }
        return false;
    };

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={openNew} style={{ borderRadius: 8 }} />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-success" onClick={() => editAssistance(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger" onClick={() => confirmDeleteAssistance(rowData)} />
        </div>
    );


    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de asistencias</span>
            </div>
            {/* Chips de estadística - margen derecho */}
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#e8f5e9', border: '1.5px solid #a5d6a7', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4CAF50', flexShrink: 0, boxShadow: '0 0 0 2px rgba(76,175,80,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2e7d32', lineHeight: 1 }}>{assistanceCounts !== null ? assistanceCounts.with_students : '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#388e3c', fontWeight: 600 }}>Con alumnos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFF3E0', border: '1.5px solid #FFCC80', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF9800', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,152,0,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#E65100', lineHeight: 1 }}>{assistanceCounts !== null ? assistanceCounts.without_students : '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#BF360C', fontWeight: 600 }}>Sin alumnos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ECEFF1', border: '1.5px solid #B0BEC5', borderRadius: 20, padding: '0.25rem 0.8rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#78909C', flexShrink: 0, boxShadow: '0 0 0 2px rgba(120,144,156,0.25)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#37474F', lineHeight: 1 }}>{assistanceCounts !== null ? assistanceCounts.total : totalRecords}</span>
                    <span style={{ fontSize: '0.75rem', color: '#546E7A', fontWeight: 600 }}>Total</span>
                </div>
                <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-secondary" onClick={exportCSV} style={{ borderRadius: 8 }} />
            </div>
        </div>
    );

    const assistanceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveAssistance} />
        </div>
    );

    const assistanceStudentsDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Aceptar" icon="pi pi-check" className="p-button-success" onClick={addAssitanceStudent} />
        </div>
    );

    const deleteAssistanceDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteAssistanceDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteEvaluation} />
        </div>
    );

    if (loading) {
        return <Loading />;
    }

    if (showError) {
        return <Error mensaje={'Hubo un problema al cargar de las asistencias'} />;
    }

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                {/* Encabezado de página */}
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-calendar-plus" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Asistencias</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Registro de asistencias por curso y fecha</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        {leftToolbarTemplate()}
                    </div>

                    {/* Filtros */}
                    <div className="p-fluid p-mb-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown
                                appendTo={document.body}
                                value={schoolYear}
                                onChange={e => {
                                    setSchoolYear(e.target.value ?? null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={[{ id: null, year: 'Todos' }, ...schoolYears]}
                                optionLabel="year"
                                placeholder="-- Año lectivo --"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Nivel</label>
                            <Dropdown
                                appendTo={document.body}
                                value={levelFilter}
                                onChange={e => {
                                    setLevelFilter(e.target.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={levels}
                                optionLabel="name"
                                optionValue="id"
                                placeholder="-- Todos --"
                                showClear
                                filter
                                filterBy="name"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <Dropdown
                                appendTo={document.body}
                                value={courseFilter}
                                onChange={e => {
                                    setCourseFilter(e.target.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={courses}
                                optionLabel="nameId"
                                placeholder="-- Todos --"
                                showClear
                                filter
                                filterBy="nameId"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Fecha</label>
                            <Calendar
                                monthNavigator
                                yearNavigator
                                yearRange="2010:2050"
                                appendTo={document.body}
                                value={dateFilter || undefined}
                                viewDate={new Date()}
                                onChange={e => {
                                    setDateFilter(e.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                locale="es"
                                dateFormat="dd/mm/yy"
                                showButtonBar
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field" style={{ flex: '1 1 0', minWidth: '140px' }}>
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Buscar curso</label>
                            <span className="p-input-icon-left" style={{ width: '100%' }}>
                                <i className="pi pi-search" />
                                <InputText type="search" onInput={onFilter} placeholder="Nombre del curso..." style={{ width: '100%' }} />
                            </span>
                        </div>
                    </div>

                    <DataTable ref={dt} value={assistances} lazy
                        paginator first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        loading={loadingDatatable}
                        className="datatable-responsive datatable-compact" header={header} stripedRows rowHover
                    >
                        <Column field="id" header="Id" sortable />
                        <Column field="course.nombre" header="Curso" sortable />
                        <Column field="date" header="Fecha" sortable />
                        <Column body={actionBodyTemplate} />
                    </DataTable>

                    <Dialog
                        visible={evaluationDialog}
                        style={{ width: '90vw', maxWidth: '860px' }}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3ab54a, #2a8a36)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="pi pi-calendar-plus" style={{ color: '#fff', fontSize: '1rem' }}></i>
                                </div>
                                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1.1rem' }}>
                                    {assistance.id ? 'Editar asistencia' : 'Nueva asistencia'}
                                </span>
                            </div>
                        }
                        modal
                        className="p-fluid"
                        footer={active ? assistanceStudentsDialogFooter : assistanceDialogFooter}
                        onHide={hideDialog}
                    >
                        <TabView activeIndex={active} onTabChange={(e) => setActive(e.index)} className="tabview-custom">

                            {/* Tab 1 — Datos de la clase */}
                            <TabPanel header="Clase" rightIcon="pi pi-list">
                                {/* Sección */}
                                <div className="p-d-flex p-ai-center p-mb-3" style={{ borderBottom: '2px solid #e8f5e9', paddingBottom: '0.5rem', gap: '0.5rem' }}>
                                    <i className="pi pi-calendar" style={{ color: '#3ab54a', fontSize: '0.95rem' }}></i>
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3320', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos de la clase</span>
                                </div>
                                <div className="p-fluid p-grid p-formgrid">
                                    <div className="p-field p-col-12 p-md-7">
                                        <label>Curso</label>
                                        <Dropdown
                                            appendTo={document.body}
                                            value={assistance.course}
                                            onChange={(e) => { onInputChange(e, 'course'); setValidationErrors(p => ({ ...p, course: undefined })); }}
                                            options={courses}
                                            optionValue="id"
                                            optionLabel="nameId"
                                            filter
                                            showClear
                                            filterBy="nameId"
                                            placeholder="-- Seleccione un curso --"
                                            className={classNames({ 'p-invalid': (submitted && !assistance.course) || validationErrors.course })}
                                        />
                                        {submitted && !assistance.course && <small className="p-invalid">Curso es requerido.</small>}
                                        {validationErrors.course && <small className="p-invalid">{validationErrors.course[0]}</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-5">
                                        <label>Fecha de clase</label>
                                        <Calendar
                                            monthNavigator
                                            yearNavigator
                                            yearRange="2010:2050"
                                            appendTo={document.body}
                                            value={assistance.date || undefined}
                                            viewDate={new Date()}
                                            onChange={(e) => { onInputChange(e, 'date'); setValidationErrors(p => ({ ...p, date: undefined })); }}
                                            locale="es"
                                            dateFormat="dd/mm/yy"
                                            showButtonBar
                                            className={classNames({ 'p-invalid': (submitted && !assistance.date) || validationErrors.date })}
                                        />
                                        {submitted && !assistance.date && <small className="p-invalid">Fecha es requerida.</small>}
                                        {validationErrors.date && <small className="p-invalid">{validationErrors.date[0]}</small>}
                                    </div>
                                </div>
                            </TabPanel>

                            {/* Tab 2 — Alumnos */}
                            <TabPanel header="Alumnos" rightIcon="pi pi-users">
                                {/* Sección */}
                                <div className="p-d-flex p-ai-center p-mb-3" style={{ borderBottom: '2px solid #e8f5e9', paddingBottom: '0.5rem', gap: '0.5rem' }}>
                                    <i className="pi pi-users" style={{ color: '#3ab54a', fontSize: '0.95rem' }}></i>
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3320', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registro de asistencia</span>
                                </div>

                                {students && students.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {students.map((student) => {
                                            const hasChecked = typeAssistances && typeAssistances.some(el => checkElement(student.id, el.id));
                                            // Colores por tipo: 1=Presente, 2=Ausente, 3=Demora, 4=Se Retiró
                                            const typeColors = { 1: '#3ab54a', 2: '#e53935', 3: '#FB8C00', 4: '#7B1FA2' };
                                            // API devuelve name (transformer) no nombre
                                            return (
                                                <div key={student.id} style={{ border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                                    {/* Header alumno */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.55rem 1rem', background: 'linear-gradient(135deg, #f0faf2, #e8f5ea)', borderBottom: '1px solid #d4edda' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3ab54a, #2a8a36)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                                                                {(student.apellido || student.nombre || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '0.875rem' }}>
                                                                {student.apellido}, {student.nombre}
                                                            </span>
                                                        </div>
                                                        {/* Botones de tipo de asistencia */}
                                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                            {typeAssistances && typeAssistances.map((tipo) => {
                                                                const isActive = checkElement(student.id, tipo.id) || (!hasChecked && tipo.name === 'Presente');
                                                                const color = typeColors[tipo.id] || '#78909C';
                                                                return (
                                                                    <button
                                                                        key={tipo.id}
                                                                        type="button"
                                                                        onClick={() => addStudent(student.id, tipo.id)}
                                                                        style={{
                                                                            padding: '0.2rem 0.7rem',
                                                                            borderRadius: 20,
                                                                            border: `1.5px solid ${isActive ? color : '#dee2e6'}`,
                                                                            background: isActive ? color : '#fff',
                                                                            color: isActive ? '#fff' : '#6c757d',
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 600,
                                                                            cursor: 'pointer',
                                                                            lineHeight: 1.5,
                                                                            transition: 'all 0.15s',
                                                                        }}
                                                                    >
                                                                        {tipo.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
                                        <i className="pi pi-users" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                        <span style={{ fontSize: '0.875rem' }}>
                                            {assistance.id ? 'No hay alumnos inscriptos en este curso.' : 'Primero guardá la clase en el tab "Clase".'}
                                        </span>
                                    </div>
                                )}
                            </TabPanel>
                        </TabView>
                    </Dialog>

                    <Dialog
                        visible={deleteEvaluationDialog}
                        style={{ width: '420px' }}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #ef5350, #b71c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="pi pi-trash" style={{ color: '#fff', fontSize: '1rem' }}></i>
                                </div>
                                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1.1rem' }}>Eliminar asistencia</span>
                            </div>
                        }
                        modal
                        footer={deleteAssistanceDialogFooter}
                        onHide={hideDeleteAssistanceDialog}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                            <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#e53935' }} />
                            <span style={{ fontSize: '0.95rem', color: '#495057' }}>
                                ¿Confirmás eliminar este registro de asistencia? Esta acción no se puede deshacer.
                            </span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
