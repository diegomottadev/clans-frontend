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
import { sortQuery } from '../../helpers/listQuery';
import { addLocale } from 'primereact/api';
import classNames from 'classnames';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Editor } from 'primereact/editor';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import Error from '../../components/Error';

const SectionHeader = ({ icon, title }) => (
    <div className="p-d-flex p-ai-center p-mb-3" style={{
        borderBottom: '2px solid #e8f5e9',
        paddingBottom: '0.5rem',
        gap: '0.5rem'
    }}>
        <i className={`pi ${icon}`} style={{ color: '#3ab54a', fontSize: '0.95rem' }}></i>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3320', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
        </span>
    </div>
);

export default function Student() {

    let emptyStudent = {
        id: '',
        name: '',
        last_name: '',
        date_of_birth: '',
        dni: '',
        address: '',
        telphone: '',
        neighborhood: '',
        observation: '',
        activity: '',
        school: '',
        shift: '',
        horario_hour_physical_education: '',
    };

    const turns = [
        { label: 'Mañana', value: 'Mañana' },
        { label: 'Tarde', value: 'Tarde' },
        { label: 'Noche', value: 'Noche' },
        { label: 'Jornada completa', value: 'Jornada completa' },
    ];

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
    const [activeCount, setActiveCount] = useState(null);
    const [inactiveCount, setInactiveCount] = useState(null);
    const [noCourseCount, setNoCourseCount] = useState(null);
    const [students, setStudents] = useState(null);
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(emptyStudent);
    const [courses, setCourses] = useState(null);
    const [studentDialog, setStudentDialog] = useState(false);
    const [deleteStudentDialog, setDeleteStudentDialog] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [coursesSelected, setCoursesSelected] = useState([]);
    const [coursesToPost, setCoursesToPost] = useState([]);
    const [dateInscriptionToPost, setDateInscriptionToPost] = useState(null);
    const [course, setCourse] = useState(null);
    const [courseChanged, setCourseChanged] = useState(null);
    const [dateInscription, setDateInscription] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);
    const [active, setActive] = useState(0);
    const [loadingDatatable, setLoadingDatatable] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [checked, setChecked] = useState(false);
    const [changeCourse, setChangeCourse] = useState(false); // eslint-disable-line no-unused-vars
    const [selectedRow, setSelectedRow] = useState(null);
    const [schoolYear, setSchoolYear] = useState(null);
    const [schoolYears, setSchoolYears] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [languajes, setLanguajes] = useState(null);
    const [languajeFilter, setLanguajeFilter] = useState(null);
    const [coursesFilter, setCoursesFilter] = useState(null);
    const [courseFilter, setCourseFilter] = useState(null);
    const [chargingCourses, setChargingCourses] = useState(false);

    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
    });

    /**
     * Contadores de Regulares e Inactivos: totalizados por el año lectivo indicado.
     * Sin año seleccionado → ciclo actual. Con año seleccionado → datos de ese año.
     * Usa el endpoint /api/students/counts (no aplica filtros de nombre ni estado).
     */
    async function refreshCounts(selectedYear) {
        try {
            const params = {};
            if (selectedYear && selectedYear.id != null) {
                params.schoolYearId = selectedYear.id;
            }
            const { data } = await axios.get(`${BASE_URL}/api/students/counts`, { params });
            const counts = data?.data ?? {};
            setActiveCount(counts.active ?? 0);
            setInactiveCount(counts.inactive ?? 0);
            setNoCourseCount(counts.noCourse ?? 0);
        } catch (err) {
            console.warn('No se pudieron cargar los contadores de alumnos');
        }
    }

    useEffect(() => {
        setLoading(false);
        async function loadCourses() {
            try {
                const { data: { data: { data: courses } } } = await axios.get(`${BASE_URL}/api/courses?all=1`);
                setCourses(courses);
            } catch (error) {
                console.log(error);
                console.warn('Hubo un problema con la carga de cursos');
            }
        }
        async function loadSchoolYears() {
            try {
                await axios.get(`${BASE_URL}/api/schoolYears?all=1`).then(({ data: { data: { data: years } } }) => {
                    setSchoolYears(years);
                    const vigente = Array.isArray(years) ? years.find(y => y.active === true) : null;
                    setSchoolYear(vigente || null);
                });
            } catch (error) {
                console.warn('Hubo un problema con la carga de los años lectivos');
            }
        }
        async function loadLanguajes() {
            try {
                const { data: { data: { data: langs } } } = await axios.get(`${BASE_URL}/api/languajes?all=1`);
                setLanguajes(langs);
            } catch (error) {
                console.warn('Hubo un problema con la carga de idiomas');
            }
        }
        loadCourses();
        loadSchoolYears();
        loadLanguajes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        refreshCounts(schoolYear);
    }, [schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        async function loadCoursesForLanguaje() {
            if (languajeFilter == null) {
                setCoursesFilter(null);
                setCourseFilter(null);
                return;
            }
            try {
                setChargingCourses(true);
                setCoursesFilter(null);
                setCourseFilter(null);
                const { data: { data: { data: c } } } = await axios.get(`${BASE_URL}/api/languajes/${languajeFilter}/courses?all=1`);
                setCoursesFilter(c);
            } catch (error) {
                console.warn('Hubo un problema con la carga de cursos por idioma');
            } finally {
                setChargingCourses(false);
            }
        }
        loadCoursesForLanguaje();
    }, [languajeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        async function loadLazyData() {
            try {
                setLoadingDatatable(true);
                let url = `${BASE_URL}/api/students/?page=${lazyParams.page + 1}`;
                if (lazyParams.filters !== undefined && lazyParams.filters.completeName !== undefined) {
                    url += `&completeName=${encodeURIComponent(lazyParams.filters.completeName.value)}`;
                }
                if (statusFilter === 'noCourse') {
                    url += `&noCourse=1`;
                } else if (statusFilter !== null && statusFilter !== undefined) {
                    url += `&status=${statusFilter}`;
                }
                if (schoolYear) {
                    url += `&schoolYearId=${schoolYear.id}`;
                }
                if (languajeFilter) {
                    url += `&languageId=${languajeFilter}`;
                }
                if (courseFilter) {
                    url += `&courseId=${courseFilter}`;
                }
                await axios.get(url + sortQuery(lazyParams)).then(({ data: { data: students } }) => {
                    setTotalRecords(students.meta.pagination.total);
                    setStudents(students.data);
                    setLoadingDatatable(false);
                });
            } catch (err) {
                console.log(err);
                console.warn('Hubo un problema con la carga de estudiantes');
                setShowError(true);
                setLoadingDatatable(false);
            }
        }
        loadLazyData();
    }, [lazyParams, statusFilter, schoolYear, languajeFilter, courseFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    };

    const onSort = (event) => {
        console.log(event);
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    };

    const onFilter = (e) => {
        const eventData = { filters: { completeName: { value: e.target.value } } };
        let _lazyParams = { ...lazyParams, ...eventData };
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;
        setLazyParams(_lazyParams);
    };

    const addCourse = () => {
        let date = dateInscription !== null
            ? new Date(dateInscription).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
            : null;
        let courseData = { "course": course, 'date': date };
        setCoursesSelected(coursesSelected => coursesSelected.concat(courseData));
        setCoursesToPost(coursesToPost => coursesToPost.concat(course.id));
        setDateInscriptionToPost(dateInscription);
        setCourse(null);
        setDateInscription(null);
    };

    const openNew = () => {
        setStudent(emptyStudent);
        setSubmitted(false);
        setValidationErrors({});
        setStudentDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setValidationErrors({});
        setStudentDialog(false);
    };

    const hideDeleteStudentDialog = () => {
        setDeleteStudentDialog(false);
    };

    async function saveStudent() {
        try {
            setSubmitted(true);
            setValidationErrors({});
            if (student.id) {
                await axios.put(`${BASE_URL}/api/students/${student.id}`, student).then(function () {
                    setLazyParams({ ...lazyParams, page: 0 });
                    toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Alumno actualizado', life: 3000 });
                    refreshCounts(schoolYear);
                });
            } else {
                if (student.name && student.last_name && student.dni) {
                    await axios.post(`${BASE_URL}/api/students`, student)
                        .then(function ({ data: { data: _student } }) {
                            setLazyParams({ ...lazyParams, page: 0 });
                            setActive(1);
                            setStudent({ ...student, id: _student.id });
                            setSubmitted(false);
                            toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Alumno agregado', life: 3000 });
                            refreshCounts(schoolYear);
                        });
                }
            }
        } catch (error) {
            const data = error?.response?.data || {};
            // Laravel retorna errores de validación directamente en la raíz del JSON (no dentro de .errors)
            const errors = error?.response?.status === 422 ? data : {};
            setValidationErrors(errors);
            const fieldLabels = { dni: 'DNI', name: 'Nombre', last_name: 'Apellido' };
            const messages = Object.entries(errors)
                .filter(([, msgs]) => Array.isArray(msgs))
                .map(([field, msgs]) => `${fieldLabels[field] || field}: ${msgs[0]}`)
                .join('  |  ');
            const detail = messages || data?.message || 'Hubo un problema al guardar el alumno';
            toast.current.show({ severity: 'error', summary: 'Errores de validación', detail, life: 6000 });
        }
    }

    async function saveCourse() {
        try {
            setSubmitted(true);
            let body = { course_ids: coursesToPost, date_inscription: dateInscriptionToPost };
            await axios.post(`${BASE_URL}/api/students/${student.id}/courses`, body).then(function () {
                setLazyParams({ ...lazyParams, page: 0 });
                setStudentDialog(false);
                setLoading(false);
                setSubmitted(false);
                setCoursesSelected([]);
                setCoursesToPost([]);
                setDateInscriptionToPost(null);
                setCourse(null);
                setDateInscription(null);
                setActive(0);
                toast.current.show({ severity: 'success', summary: 'Exito', detail: `Curso agregado al alumno ${student.name} ${student.last_name}`, life: 3000 });
            });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al agregar curso', life: 3000 });
        }
    }

    const editStudent = (_student) => {
        let editStudent = {
            id: _student.id,
            name: _student.firstName,
            last_name: _student.lastName,
            date_of_birth: _student.dateOfBirth != null ? new Date(_student.dateOfBirth) : null,
            dni: _student.dni,
            address: _student.address,
            telphone: _student.telphone,
            neighborhood: _student.neighborhood,
            observation: _student.observations,
            activity: _student.activity,
            school: _student.school,
            shift: _student.schoolShift,
            horario_hour_physical_education: _student.physicalEducationSchedule != null ? new Date(_student.physicalEducationSchedule) : null,
            courses: _student.courses,
            status: _student.status,
        };
        setChangeCourse(false);
        setChecked(_student.status);
        setStudent({ ...editStudent });
        setCoursesToPost(() => _student.courses.map(course => course.id));
        setCoursesSelected(() => _student.courses.map(course => {
            let date = new Date(course.pivot.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
            setDateInscription(date);
            return { "course": course, 'date': date };
        }));
        setStudentDialog(true);
    };

    const confirmDeleteStudent = (_student) => {
        setStudent({ id: _student.id, completeName: _student.name_complete });
        setDeleteStudentDialog(true);
    };

    async function deleteStudent() {
        await axios.delete(`${BASE_URL}/api/students/${student.id}`).then(() => {
            setLazyParams({ ...lazyParams, page: 0 });
            setDeleteStudentDialog(false);
            setStudent(emptyStudent);
            toast.current.show({ severity: 'success', summary: 'Exito', detail: `Estudiante ${student.completeName} eliminado`, life: 3000 });
            refreshCounts(schoolYear);
        });
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _student = { ...student };
        _student[`${name}`] = val;
        console.log(name, e);
        if (name === 'status') {
            const val = (e.target && e.checked) || '';
            _student[`${name}`] = val;
        }
        setStudent(_student);
    };

    const onInputChangeBox = (e, name) => {
        let _student = { ...student };
        _student[`${name}`] = e.checked;
        setStudent(_student);
    };

    const onInputHtml = (val) => {
        let _student = { ...student };
        _student['observation'] = val;
        setStudent(_student);
    };

    async function confirmDeleteCourse(_course, index) {
        const cSelecteds = coursesSelected.filter(course => course !== _course);
        setCoursesSelected(cSelecteds);
        setCoursesToPost(() => cSelecteds.map(course => course.course.id));
        let body = { course_ids: _course.id };
        try {
            await axios.delete(`${BASE_URL}/api/students/${student.id}/courses/${_course.course.id}`, body).then(function () {
                setLazyParams({ ...lazyParams, page: 0 });
                toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Curso inscripto eliminado', life: 3000 });
            });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se puedo borrar curso porque tiene facturas asociadas. Puede solo cambiar el curso.', life: 3000 });
            setStudentDialog(false);
            setLoading(false);
            setSubmitted(false);
            setCoursesSelected([]);
            setCoursesToPost([]);
            setDateInscriptionToPost(null);
            setCourse(null);
            setDateInscription(null);
            setSelectedRow(null);
            setActive(0);
        }
    }

    const confirmChangeCourse = async (_course) => {
        let body = { course_id: courseChanged.id };
        await axios.put(`${BASE_URL}/api/students/${student.id}/courses/${_course.course.id}`, body).then(function ({ data }) {
            setCoursesSelected(() => data.data.courses.map(course => {
                let date = new Date(course.pivot.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
                setDateInscription(date);
                return { "course": course, 'date': date };
            }));
            setLazyParams({ ...lazyParams, page: 0 });
            setStudentDialog(false);
            setLoading(false);
            setSubmitted(false);
            setCoursesSelected([]);
            setCoursesToPost([]);
            setDateInscriptionToPost(null);
            setCourse(null);
            setDateInscription(null);
            setSelectedRow(null);
            setActive(0);
            toast.current.show({ severity: 'success', summary: 'Exito', detail: 'Curso cambiado', life: 3000 });
        });
    };

    function showChangeCourse(courseId, index) {
        setSelectedRow(index === selectedRow ? null : index);
    }

    // ── Templates ──────────────────────────────────────────────

    const avatarBodyTemplate = (rowData) => {
        const name = rowData.name_complete || '';
        const parts = name.trim().split(' ').filter(Boolean);
        const initials = parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
        const palettes = [
            'linear-gradient(135deg, #3ab54a, #2a8a36)',
            'linear-gradient(135deg, #2a8a36, #1a5c25)',
            'linear-gradient(135deg, #66bb6a, #43a047)',
            'linear-gradient(135deg, #4caf50, #388e3c)',
        ];
        const bg = palettes[(rowData.id || 0) % palettes.length];
        return (
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: bg, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.82rem',
                boxShadow: '0 2px 6px rgba(58,181,74,0.3)',
                flexShrink: 0,
            }}>
                {initials}
            </div>
        );
    };

    const coursesBodyTemplate = (rowData) => {
        const list = rowData.courses || [];
        if (list.length === 0) {
            return <Tag severity="danger" value="Sin curso" />;
        }
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {list.map((c, i) => (
                    <span key={i} style={{
                        background: '#e8f5e9', border: '1px solid #a5d6a7',
                        color: '#2e7d32', borderRadius: 10,
                        padding: '0.1rem 0.55rem',
                        fontSize: '0.72rem', fontWeight: 700,
                        whiteSpace: 'nowrap',
                    }}>
                        {c.nombre || c.name}
                    </span>
                ))}
            </div>
        );
    };

    const statusBodyTemplate = (rowData) => {
        if (rowData.status) {
            return <Tag severity="success" value="Regular" icon="pi pi-check-circle" />;
        }
        return <Tag severity="warning" value="Inactivo" icon="pi pi-minus-circle" />;
    };

    const actionBodyTemplate = (rowData) => (
        <div className="p-d-flex" style={{ gap: '0.4rem' }}>
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-outlined p-button-success"
                onClick={() => editStudent(rowData)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-outlined p-button-danger"
                onClick={() => confirmDeleteStudent(rowData)}
            />
        </div>
    );

    const NameCourse = (props) => {
        if (props.rowData.course?.name !== undefined) return <span>{props.rowData.course.name}</span>;
        return <span>{props.rowData.course?.nombre}</span>;
    };

    const header = (
        <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>

            {/* Título */}
            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de alumnos</span>
            </div>

            {/* Chips de conteo */}
            <div className="p-d-flex p-ai-center" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    background: '#e8f5e9', border: '1.5px solid #a5d6a7',
                    borderRadius: 20, padding: '0.3rem 0.85rem',
                }}>
                    <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#4CAF50', flexShrink: 0,
                        boxShadow: '0 0 0 2px rgba(76,175,80,0.25)',
                    }} />
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2e7d32', lineHeight: 1 }}>
                        {activeCount !== null ? activeCount : '—'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#388e3c', fontWeight: 600 }}>Regulares</span>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    background: '#ECEFF1', border: '1.5px solid #B0BEC5',
                    borderRadius: 20, padding: '0.3rem 0.85rem',
                }}>
                    <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#78909C', flexShrink: 0,
                        boxShadow: '0 0 0 2px rgba(120,144,156,0.25)',
                    }} />
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#37474F', lineHeight: 1 }}>
                        {inactiveCount !== null ? inactiveCount : '—'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#546E7A', fontWeight: 600 }}>Inactivos</span>
                </div>

                {noCourseCount > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.45rem',
                        background: '#FFF3E0', border: '1.5px solid #FFCC80',
                        borderRadius: 20, padding: '0.3rem 0.85rem',
                    }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: '#FF9800', flexShrink: 0,
                            boxShadow: '0 0 0 2px rgba(255,152,0,0.25)',
                        }} />
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#E65100', lineHeight: 1 }}>
                            {noCourseCount}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#BF360C', fontWeight: 600 }}>Sin curso</span>
                    </div>
                )}
                <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-secondary" onClick={exportCSV} style={{ borderRadius: 8 }} />
            </div>

        </div>
    );

    const studentDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveStudent} />
        </div>
    );

    const courseDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
            <Button label="Guardar cursos" icon="pi pi-check" className="p-button-success" onClick={saveCourse} />
        </div>
    );

    const deleteStudentDialogFooter = (
        <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteStudentDialog} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteStudent} />
        </div>
    );

    // ── Guards ─────────────────────────────────────────────────

    if (loading) return <Loading />;

    if (showError) return <Error mensaje={'Hubo un problema al cargar los registros de estudiantes'} />;

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">

                {/* Page header */}
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #3ab54a, #1a5c25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(58,181,74,0.35)',
                    }}>
                        <i className="pi pi-users" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>Alumnos</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>Gestión y registro de alumnos</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />

                    {/* Toolbar */}
                    <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Button
                            label="Nuevo alumno"
                            icon="pi pi-plus"
                            className="p-button-success"
                            onClick={openNew}
                            style={{ borderRadius: 8 }}
                        />
                    </div>

                    {/* Filters */}
                    <div className="p-fluid p-formgrid p-grid p-mb-3">
                        <div className="p-field p-col-12 p-md-2">
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Año lectivo</label>
                            <Dropdown
                                appendTo={document.body}
                                value={schoolYear}
                                onChange={e => {
                                    setSchoolYear(e.target.value || null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={schoolYears}
                                optionLabel="year"
                                placeholder="-- Todos --"
                                showClear
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Estado</label>
                            <Dropdown
                                appendTo={document.body}
                                value={statusFilter}
                                onChange={e => {
                                    const val = e.target.value !== undefined ? e.target.value : null;
                                    setStatusFilter(val);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={[
                                    { label: 'Regulares', value: 1 },
                                    { label: 'Inactivos', value: 0 },
                                    { label: 'Sin cursos', value: 'noCourse' },
                                ]}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="-- Todos --"
                                showClear
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Idioma</label>
                            <Dropdown
                                appendTo={document.body}
                                value={languajeFilter}
                                onChange={e => {
                                    setLanguajeFilter(e.target.value !== undefined ? e.target.value : null);
                                    setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                }}
                                options={languajes}
                                optionLabel="name"
                                optionValue="id"
                                filter showClear filterBy="name"
                                placeholder="-- Todos --"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-md-2">
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Curso</label>
                            <div style={{ position: 'relative' }}>
                                <Dropdown
                                    appendTo={document.body}
                                    value={courseFilter}
                                    onChange={e => {
                                        setCourseFilter(e.target.value !== undefined ? e.target.value : null);
                                        setLazyParams(p => ({ ...p, first: 0, page: 0 }));
                                    }}
                                    options={coursesFilter}
                                    optionLabel="nameId"
                                    optionValue="id"
                                    filter showClear filterBy="nameId"
                                    disabled={chargingCourses || !languajeFilter}
                                    placeholder={chargingCourses ? '' : '-- Todos --'}
                                    style={{ width: '100%' }}
                                />
                                {chargingCourses && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500 }}>Cargando...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-field p-col">
                            <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Buscar alumno</label>
                            <span className="p-input-icon-left" style={{ width: '100%' }}>
                                <i className="pi pi-search" />
                                <InputText type="search" onInput={(e) => onFilter(e)} placeholder="Nombre o apellido..." style={{ width: '100%' }} />
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <DataTable
                        ref={dt}
                        value={students}
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
                        header={header}
                        stripedRows
                        rowHover
                    >
                        <Column body={avatarBodyTemplate} style={{ width: '56px', paddingLeft: '1rem' }} />
                        <Column field="id" header="ID" sortable style={{ width: '70px' }} />
                        <Column field="apellido_nombre_completo" header="Apellido y Nombre" sortable style={{ minWidth: '160px' }} />
                        <Column field="telphone" header="Teléfono" style={{ width: '130px' }}
                            body={(row) => row.telphone
                                ? <span>{row.telphone}</span>
                                : <span style={{ color: '#bdbdbd', fontSize: '0.8rem' }}>—</span>}
                        />
                        <Column header="Cursos" body={coursesBodyTemplate} style={{ minWidth: '180px' }} />
                        <Column field="status" header="Estado" body={statusBodyTemplate} sortable style={{ width: '120px' }} />
                        <Column body={actionBodyTemplate} style={{ width: '110px' }} />
                    </DataTable>

                    {/* Student Dialog */}
                    <Dialog
                        visible={studentDialog}
                        style={{ width: '90vw', maxWidth: '900px' }}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: 'linear-gradient(135deg, #3ab54a, #2a8a36)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className="pi pi-user" style={{ color: '#fff', fontSize: '1rem' }}></i>
                                </div>
                                <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1.1rem' }}>
                                    {student.id ? 'Editar alumno' : 'Nuevo alumno'}
                                </span>
                            </div>
                        }
                        modal
                        className="p-fluid"
                        footer={active ? courseDialogFooter : studentDialogFooter}
                        onHide={hideDialog}
                    >
                        <TabView activeIndex={active} onTabChange={(e) => setActive(e.index)} className="tabview-custom">

                            {/* Tab: Datos del alumno */}
                            <TabPanel header="Alumno" rightIcon="pi pi-user">

                                {/* Datos personales */}
                                <SectionHeader icon="pi-id-card" title="Datos personales" />
                                <div className="p-fluid p-grid p-formgrid p-mb-4">
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="name">Nombre</label>
                                        <InputText id="name" value={student.name || ''} onChange={(e) => { onInputChange(e, 'name'); setValidationErrors(p => ({ ...p, name: undefined })); }} required autoFocus className={classNames({ 'p-invalid': (submitted && !student.name) || validationErrors.name })} />
                                        {submitted && !student.name && <small className="p-invalid">Nombre es requerido.</small>}
                                        {validationErrors.name && <small className="p-invalid">{validationErrors.name[0]}</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="last_name">Apellido</label>
                                        <InputText id="last_name" value={student.last_name || ''} onChange={(e) => { onInputChange(e, 'last_name'); setValidationErrors(p => ({ ...p, last_name: undefined })); }} required className={classNames({ 'p-invalid': (submitted && !student.last_name) || validationErrors.last_name })} />
                                        {submitted && !student.last_name && <small className="p-invalid">Apellido es requerido.</small>}
                                        {validationErrors.last_name && <small className="p-invalid">{validationErrors.last_name[0]}</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="dni">Nº Documento</label>
                                        <InputText id="dni" value={student.dni || ''} onChange={(e) => { onInputChange(e, 'dni'); setValidationErrors(p => ({ ...p, dni: undefined })); }} required className={classNames({ 'p-invalid': (submitted && !student.dni) || validationErrors.dni })} />
                                        {submitted && !student.dni && <small className="p-invalid">Nº Documento es requerido.</small>}
                                        {validationErrors.dni && <small className="p-invalid">{validationErrors.dni[0]}</small>}
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="date_of_birth">Fecha de nacimiento</label>
                                        <Calendar monthNavigator yearNavigator yearRange="1930:2150" appendTo={document.body} id="date_of_birth" value={student.date_of_birth || ''} viewDate={new Date()} onChange={(e) => onInputChange(e, 'date_of_birth')} locale="es" dateFormat="dd/mm/yy" />
                                    </div>
                                </div>

                                {/* Contacto */}
                                <SectionHeader icon="pi-phone" title="Contacto y domicilio" />
                                <div className="p-fluid p-grid p-formgrid p-mb-4">
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="telphone">Teléfono</label>
                                        <InputText id="telphone" value={student.telphone || ''} onChange={(e) => onInputChange(e, 'telphone')} />
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="address">Domicilio</label>
                                        <InputText id="address" value={student.address || ''} onChange={(e) => onInputChange(e, 'address')} />
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="neighborhood">Barrio</label>
                                        <InputText id="neighborhood" value={student.neighborhood || ''} onChange={(e) => onInputChange(e, 'neighborhood')} />
                                    </div>
                                </div>

                                {/* Escuela */}
                                <SectionHeader icon="pi-home" title="Escuela" />
                                <div className="p-fluid p-grid p-formgrid p-mb-4">
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="school">Escuela</label>
                                        <InputText id="school" value={student.school || ''} onChange={(e) => onInputChange(e, 'school')} />
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="shift">Turno</label>
                                        <Dropdown appendTo={document.body} value={student.shift || ''} options={turns} onChange={(e) => onInputChange(e, 'shift')} optionValue="value" optionLabel="label" placeholder="-- Seleccionar turno --" />
                                    </div>
                                    <div className="p-field p-col-12 p-md-6">
                                        <label htmlFor="horario_hour_physical_education">Hora de educación física</label>
                                        <Calendar appendTo={document.body} id="horario_hour_physical_education" value={student.horario_hour_physical_education} onChange={(e) => onInputChange(e, 'horario_hour_physical_education')} timeOnly hourFormat="24" />
                                    </div>
                                    {student.id > 0 && (
                                        <div className="p-field-checkbox p-col-12 p-md-6 p-d-flex p-ai-center" style={{ gap: '0.5rem', paddingTop: '1.75rem' }}>
                                            <Checkbox inputId="status" checked={checked} onChange={(e) => { onInputChangeBox(e, 'status'); setChecked(e.checked); }} />
                                            <label htmlFor="status" style={{ marginBottom: 0, cursor: 'pointer' }}>Alumno activo</label>
                                        </div>
                                    )}
                                </div>

                                {/* Actividad */}
                                <SectionHeader icon="pi-briefcase" title="Actividad" />
                                <div className="p-fluid p-grid p-formgrid p-mb-4">
                                    <div className="p-field p-col-12">
                                        <label htmlFor="activity">Actividad</label>
                                        <InputText id="activity" value={student.activity || ''} onChange={(e) => onInputChange(e, 'activity')} maxLength={300} />
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <SectionHeader icon="pi-comment" title="Observaciones" />
                                <div className="p-field">
                                    <Editor style={{ height: '120px' }} value={student.observation || ''} onTextChange={(e) => onInputHtml(e.htmlValue, 'observation')} />
                                </div>
                            </TabPanel>

                            {/* Tab: Cursos */}
                            <TabPanel header="Cursos" rightIcon="pi pi-th-large">

                                {/* Formulario de inscripción */}
                                <SectionHeader icon="pi-plus-circle" title="Inscribir curso" />
                                <div style={{
                                    background: '#f8fdf8',
                                    border: '1.5px solid #e8f5e9',
                                    borderRadius: 10,
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1.5rem',
                                }}>
                                    <div className="p-fluid p-grid p-formgrid">
                                        <div className="p-field p-col-12 p-md-5">
                                            <label htmlFor="course" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#495057' }}>Curso</label>
                                            <Dropdown appendTo={document.body} value={course} onChange={e => setCourse(e.target.value)} options={(courses || []).filter(c => !coursesSelected.some(s => s.course?.id === c.id))} optionLabel="nameId" filter showClear filterBy="nameId" placeholder="-- Seleccione un curso --" className={classNames({ 'p-invalid': submitted && !course })} />
                                            {submitted && !course && <small className="p-invalid">Curso es requerido.</small>}
                                        </div>
                                        <div className="p-field p-col-12 p-md-5">
                                            <label htmlFor="dateInscription" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#495057' }}>Fecha de inscripción</label>
                                            <Calendar monthNavigator yearNavigator yearRange="2010:2050" appendTo={document.body} id="dateInscription" value={dateInscription} viewDate={new Date()} onChange={(e) => setDateInscription(e.target.value)} locale="es" dateFormat="dd/mm/yy" className={classNames({ 'p-invalid': submitted && !dateInscription })} />
                                            {submitted && !dateInscription && <small className="p-invalid">Fecha de inscripción es requerida.</small>}
                                        </div>
                                        <div className="p-field p-col-12 p-md-2 p-d-flex p-ai-end">
                                            <Button
                                                label="Agregar"
                                                icon="pi pi-plus"
                                                onClick={addCourse}
                                                className="p-button-success"
                                                style={{ width: '100%', borderRadius: 8 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de cursos inscriptos */}
                                <div className="p-d-flex p-ai-center p-mb-3" style={{
                                    borderBottom: '2px solid #e8f5e9',
                                    paddingBottom: '0.5rem',
                                    gap: '0.5rem',
                                }}>
                                    <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '0.95rem' }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3320', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
                                        Cursos inscriptos
                                    </span>
                                    {coursesSelected.length > 0 && (
                                        <span style={{
                                            background: 'linear-gradient(135deg, #3ab54a, #2a8a36)',
                                            color: '#fff',
                                            borderRadius: 20,
                                            padding: '0.15rem 0.65rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                        }}>
                                            {coursesSelected.length}
                                        </span>
                                    )}
                                </div>

                                {coursesSelected.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2.5rem 1rem',
                                        border: '1.5px dashed #c8e6c9',
                                        borderRadius: 10,
                                        background: '#fafffe',
                                    }}>
                                        <i className="pi pi-th-large" style={{ fontSize: '2.2rem', color: '#c8e6c9', display: 'block', marginBottom: '0.6rem' }} />
                                        <p style={{ margin: 0, color: '#9e9e9e', fontSize: '0.875rem' }}>
                                            Todavía no hay cursos inscriptos
                                        </p>
                                        <p style={{ margin: '0.25rem 0 0', color: '#bdbdbd', fontSize: '0.78rem' }}>
                                            Seleccioná un curso y una fecha para agregar
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                        {coursesSelected.map((item, i) => (
                                            <div key={i} style={{
                                                background: '#fff',
                                                border: '1.5px solid #e8f5e9',
                                                borderRadius: 10,
                                                padding: '0.7rem 1rem',
                                                boxShadow: '0 1px 4px rgba(58,181,74,0.07)',
                                            }}>
                                                <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>

                                                    {/* Número */}
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                        background: 'linear-gradient(135deg, #3ab54a, #2a8a36)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                                                        boxShadow: '0 2px 6px rgba(58,181,74,0.3)',
                                                    }}>
                                                        {i + 1}
                                                    </div>

                                                    {/* Info del curso */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a3320' }}>
                                                            <NameCourse rowData={item} />
                                                        </div>
                                                        {item.date && (
                                                            <div style={{ fontSize: '0.75rem', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                                                                <i className="pi pi-calendar" style={{ fontSize: '0.68rem' }} />
                                                                {item.date}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Acciones */}
                                                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                                        <Button
                                                            icon="pi pi-replay"
                                                            className="p-button-rounded p-button-outlined p-button-warning p-button-sm"
                                                            onClick={() => showChangeCourse(item.course.id, i)}
                                                            tooltip="Cambiar curso"
                                                            tooltipOptions={{ position: 'top' }}
                                                        />
                                                        <Button
                                                            icon="pi pi-trash"
                                                            className="p-button-rounded p-button-outlined p-button-danger p-button-sm"
                                                            onClick={() => confirmDeleteCourse(item, i)}
                                                            tooltip="Eliminar"
                                                            tooltipOptions={{ position: 'top' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Panel inline de cambio de curso */}
                                                {selectedRow === i && (
                                                    <div style={{
                                                        marginTop: '0.75rem',
                                                        paddingTop: '0.75rem',
                                                        borderTop: '1px solid #e8f5e9',
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    }}>
                                                        <i className="pi pi-arrow-right-arrow-left" style={{ color: '#3ab54a', fontSize: '0.85rem', flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.8rem', color: '#495057', fontWeight: 600, flexShrink: 0 }}>Cambiar a:</span>
                                                        <Dropdown
                                                            appendTo={document.body}
                                                            value={courseChanged}
                                                            onChange={e => setCourseChanged(e.target.value)}
                                                            options={(courses || []).filter(c => !coursesSelected.some(s => s.course?.id === c.id))}
                                                            optionLabel="nameId"
                                                            filter
                                                            showClear
                                                            filterBy="nameId"
                                                            placeholder="Seleccionar nuevo curso..."
                                                            style={{ flex: 1, minWidth: 0 }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                                            <Button
                                                                icon="pi pi-check"
                                                                label="Confirmar"
                                                                className="p-button-success p-button-sm"
                                                                style={{ borderRadius: 8 }}
                                                                onClick={() => confirmChangeCourse(item)}
                                                            />
                                                            <Button
                                                                icon="pi pi-times"
                                                                label="Cancelar"
                                                                className="p-button-outlined p-button-secondary p-button-sm"
                                                                style={{ borderRadius: 8 }}
                                                                onClick={() => setSelectedRow(null)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabPanel>
                        </TabView>
                    </Dialog>

                    {/* Delete Dialog */}
                    <Dialog
                        visible={deleteStudentDialog}
                        style={{ width: '420px' }}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.6rem' }}>
                                <i className="pi pi-exclamation-triangle" style={{ color: '#e53935', fontSize: '1.2rem' }}></i>
                                <span style={{ fontWeight: 700, color: '#1a3320' }}>Confirmar eliminación</span>
                            </div>
                        }
                        modal
                        footer={deleteStudentDialogFooter}
                        onHide={hideDeleteStudentDialog}
                    >
                        <div className="p-d-flex p-ai-center" style={{ gap: '1rem', padding: '0.5rem 0' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                                background: '#ffebee',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="pi pi-trash" style={{ color: '#e53935', fontSize: '1.3rem' }}></i>
                            </div>
                            <div>
                                <p className="p-m-0" style={{ fontWeight: 600, color: '#212529' }}>
                                    ¿Eliminar a <span style={{ color: '#e53935' }}>{student.completeName}</span>?
                                </p>
                                <p className="p-mt-1 p-mb-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    </Dialog>

                </div>
            </div>
        </div>
    );
}
