import React, { useState, useEffect, useRef } from 'react';
import { FullCalendar } from 'primereact/fullcalendar';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Calendar as PRCalendar } from 'primereact/calendar';
import { addLocale } from 'primereact/api';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import Error from '../../components/Error';

export default function CalendarDashboardPage() {

    addLocale('es', {
        firstDayOfWeek: 1,
        dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
        dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Hoy', clear: 'Limpiar'
    });

    const toast = useRef(null);
    const calendarRef = useRef(null);
    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

    const [events, setEvents] = useState([]);
    const [todayClasses, setTodayClasses] = useState([]);
    const [counters, setCounters] = useState({ classesToday: 0, activeTeachers: 0, classroomsInUse: 0, activeCourses: 0 });
    const [languageColors, setLanguageColors] = useState({});
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // Filtros
    const [languajes, setLanguajes] = useState(null);
    const [courses, setCourses] = useState(null);
    const [teachers, setTeachers] = useState(null);
    const [classrooms, setClassrooms] = useState(null);

    const [languajeFilter, setLanguajeFilter] = useState(null);
    const [courseFilter, setCourseFilter] = useState(null);
    const [teacherFilter, setTeacherFilter] = useState(null);
    const [classroomFilter, setClassroomFilter] = useState(null);
    const [startDateFilter, setStartDateFilter] = useState(() => {
        const now = new Date();
        const day = now.getDay(); // 0=dom, 1=lun, ...
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [endDateFilter, setEndDateFilter] = useState(() => {
        const now = new Date();
        const day = now.getDay();
        const diffToSunday = day === 0 ? 0 : 7 - day;
        const sunday = new Date(now);
        sunday.setDate(now.getDate() + diffToSunday);
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    });

    // Rango de fechas del calendario
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: formatDate(start), end: formatDate(end) };
    });

    // Ref para evitar loop infinito en datesRender
    const dateRangeRef = useRef(dateRange);

    // Navegar el calendario cuando cambia el filtro de fecha inicio
    useEffect(() => {
        if (startDateFilter && calendarRef.current && calendarRef.current.calendar) {
            calendarRef.current.calendar.gotoDate(new Date(startDateFilter));
        }
    }, [startDateFilter]);

    // Modal detalle
    const [detailDialog, setDetailDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    function formatDate(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // Cargar dropdowns
    useEffect(() => {
        async function loadDropdowns() {
            try {
                const [lRes, cRes, tRes, rRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/languajes?all=1`),
                    axios.get(`${BASE_URL}/api/courses?all=1`),
                    axios.get(`${BASE_URL}/api/teachers?all=1`),
                    axios.get(`${BASE_URL}/api/classrooms?all=1`),
                ]);
                setLanguajes(lRes.data.data.data);
                setCourses(cRes.data.data.data);
                setTeachers(tRes.data.data.data);
                setClassrooms(rRes.data.data.data);
            } catch (err) {
                console.error(err);
            }
        }
        loadDropdowns();
    }, []);

    // Cargar datos del calendario
    useEffect(() => {
        let cancelled = false;
        async function loadCalendar() {
            try {
                setLoading(true);
                const start = startDateFilter ? formatDate(new Date(startDateFilter)) : dateRange.start;
                const end = endDateFilter ? formatDate(new Date(endDateFilter)) : (startDateFilter ? '2099-12-31' : dateRange.end);
                let url = `${BASE_URL}/api/calendar?start_date=${start}&end_date=${end}`;
                if (languajeFilter) url += `&language_id=${languajeFilter}`;
                if (courseFilter) url += `&course_id=${courseFilter}`;
                if (teacherFilter) url += `&teacher_id=${teacherFilter}`;
                if (classroomFilter) url += `&classroom_id=${classroomFilter}`;

                const { data } = await axios.get(url);
                if (!cancelled) {
                    setEvents(data.events || []);
                    setTodayClasses(data.todayClasses || []);
                    setCounters(data.counters || {});
                    setLanguageColors(data.languageColors || {});
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) setShowError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadCalendar();
        return () => { cancelled = true; };
    }, [dateRange, languajeFilter, courseFilter, teacherFilter, classroomFilter, startDateFilter, endDateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    // FullCalendar options
    const calendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        defaultView: 'timeGridWeek',
        defaultDate: new Date().toISOString().split('T')[0],
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'es',
        firstDay: 1,
        slotMinTime: '07:00:00',
        slotMaxTime: '22:00:00',
        allDaySlot: false,
        height: 'auto',
        eventClick: (info) => {
            const props = info.event.extendedProps;
            setSelectedEvent({
                id: props.classId,
                title: info.event.title,
                ...props,
            });
            setDetailDialog(true);
        },
        datesRender: (info) => {
            const newStart = formatDate(info.view.activeStart);
            const newEnd = formatDate(info.view.activeEnd);
            if (newStart !== dateRangeRef.current.start || newEnd !== dateRangeRef.current.end) {
                const newRange = { start: newStart, end: newEnd };
                dateRangeRef.current = newRange;
                setDateRange(newRange);
            }
        },
        eventRender: (info) => {
            const props = info.event.extendedProps;
            info.el.title = `${info.event.title}\n${props.teacherName}\n${props.classroomName}\n${props.startTime} - ${props.endTime}`;
        },
    };

    const counterCards = [
        { label: 'Clases', value: counters.classesToday, icon: 'pi-calendar', color: '#1976D2', bg: '#e3f2fd' },
        { label: 'Docentes', value: counters.activeTeachers, icon: 'pi-users', color: '#388E3C', bg: '#e8f5e9' },
        { label: 'Aulas', value: counters.classroomsInUse, icon: 'pi-building', color: '#E64A19', bg: '#fbe9e7' },
        { label: 'Cursos', value: counters.activeCourses, icon: 'pi-book', color: '#7B1FA2', bg: '#f3e5f5' },
    ];

    const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: '#495057', marginBottom: 4, ...font };

    if (showError) return <Error mensaje="Hubo un problema al cargar el calendario" />;

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                <Toast ref={toast} />
                <Tooltip target=".today-class-item" position="right" />

                {/* Header */}
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3ab54a, #1a5c25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(58,181,74,0.35)' }}>
                        <i className="pi pi-calendar" style={{ color: '#fff', fontSize: '1.4rem' }} />
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>Calendario de Clases</h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>Vista general de clases programadas</p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>

                {/* Filters */}
                <div className="p-fluid p-formgrid p-grid p-mb-3">
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Fecha inicio</label>
                                <PRCalendar appendTo={document.body} value={startDateFilter}
                                    onChange={e => setStartDateFilter(e.target.value || null)}
                                    locale="es" dateFormat="dd/mm/yy" showClear
                                    placeholder="Desde..."
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Fecha fin</label>
                                <PRCalendar appendTo={document.body} value={endDateFilter}
                                    onChange={e => setEndDateFilter(e.target.value || null)}
                                    locale="es" dateFormat="dd/mm/yy" showClear
                                    minDate={startDateFilter || undefined}
                                    placeholder="Hasta..."
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Idioma</label>
                                <Dropdown appendTo={document.body} value={languajeFilter}
                                    onChange={e => setLanguajeFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={languajes} optionLabel="name" optionValue="id"
                                    filter showClear filterBy="name" placeholder="-- Todos --"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Curso</label>
                                <Dropdown appendTo={document.body} value={courseFilter}
                                    onChange={e => setCourseFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={courses} optionLabel="nameYear" optionValue="id"
                                    filter showClear filterBy="nameYear" placeholder="-- Todos --"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Docente</label>
                                <Dropdown appendTo={document.body} value={teacherFilter}
                                    onChange={e => setTeacherFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={teachers} optionLabel="apellido_nombre_completo" optionValue="id"
                                    filter showClear filterBy="apellido_nombre_completo" placeholder="-- Todos --"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                            <div className="p-field p-col-12 p-md-2">
                                <label style={labelStyle}>Aula</label>
                                <Dropdown appendTo={document.body} value={classroomFilter}
                                    onChange={e => setClassroomFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={classrooms} optionLabel="name" optionValue="id"
                                    filter showClear filterBy="name" placeholder="-- Todas --"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }} />
                            </div>
                </div>

                {/* Counter Cards */}
                <div className="p-grid p-mb-3">
                    {counterCards.map((c, i) => (
                        <div key={i} className="p-col-6 p-md-3">
                            <div style={{
                                background: '#fff', borderRadius: 12, padding: '1rem 1.2rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0',
                                display: 'flex', alignItems: 'center', gap: '0.8rem'
                            }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 10, background: c.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <i className={`pi ${c.icon}`} style={{ color: c.color, fontSize: '1.15rem' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a3320', lineHeight: 1, ...font }}>{c.value}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 500, ...font }}>{c.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main content: Today panel + Calendar */}
                <div className="p-grid">
                    {/* Clases */}
                    <div className={showCalendar ? "p-col-12 p-md-4" : "p-col-12"}>
                        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '1rem', height: '100%' }}>
                            <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '0.5rem', justifyContent: 'space-between' }}>
                                <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-list" style={{ color: '#1976D2', fontSize: '1.1rem' }} />
                                    <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem', ...font }}>Clases</span>
                                    <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 12, padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #a5d6a7', ...font }}>
                                        {todayClasses.length}
                                    </span>
                                </div>
                                <Button
                                    label={showCalendar ? 'Ocultar calendario' : 'Calendario'}
                                    icon={showCalendar ? 'pi pi-eye-slash' : 'pi pi-calendar'}
                                    className="p-button-outlined p-button-sm"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    style={{ borderRadius: 8, fontSize: '0.8rem', padding: '0.3rem 0.7rem', ...font }}
                                />
                            </div>

                            {todayClasses.length === 0 && !loading && (
                                <div className="p-d-flex p-ai-center p-jc-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '2rem 0', color: '#9e9e9e' }}>
                                    <i className="pi pi-calendar-times" style={{ fontSize: '2rem' }} />
                                    <span style={{ fontSize: '0.88rem', ...font }}>No hay clases en este rango</span>
                                </div>
                            )}

                            <div style={{ maxHeight: showCalendar ? 520 : 600, overflowY: 'auto' }}>
                                {todayClasses.map((ev, i) => {
                                    const p = ev.extendedProps;
                                    const color = languageColors[p.languageId] || '#607D8B';
                                    const expanded = !showCalendar;
                                    return (
                                        <div key={i}
                                            className="today-class-item"
                                            data-pr-tooltip={`${p.courseName} - ${p.teacherName} - ${p.classroomName}`}
                                            onClick={() => { setSelectedEvent({ id: p.classId, title: ev.title, ...p }); setDetailDialog(true); }}
                                            style={{
                                                display: 'flex', gap: expanded ? '1rem' : '0.7rem', padding: expanded ? '0.8rem 1rem' : '0.7rem 0.8rem',
                                                marginBottom: '0.5rem', borderRadius: 8, cursor: 'pointer',
                                                borderLeft: `4px solid ${color}`,
                                                background: '#fafafa', transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                                        >
                                            <div style={{ minWidth: expanded ? 70 : 58, textAlign: 'center' }}>
                                                <div style={{ fontSize: expanded ? '0.82rem' : '0.7rem', color: '#1976D2', fontWeight: 700, ...font }}>{p.date ? p.date.split('-').reverse().join('/') : ''}</div>
                                                <div style={{ fontSize: expanded ? '1.1rem' : '0.95rem', fontWeight: 800, color: '#1a3320', ...font }}>{p.startTime}</div>
                                                <div style={{ fontSize: expanded ? '0.82rem' : '0.7rem', color: '#9e9e9e', ...font }}>{p.endTime}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: expanded ? '1rem' : '0.88rem', color: '#1a3320', ...font }}>{p.courseName}</div>
                                                <div style={{ fontSize: expanded ? '0.88rem' : '0.78rem', color: '#616161', ...font }}>
                                                    <i className="pi pi-user" style={{ fontSize: expanded ? '0.78rem' : '0.7rem', marginRight: 4 }} />{p.teacherName}
                                                </div>
                                                <div style={{ fontSize: expanded ? '0.88rem' : '0.78rem', color: '#616161', ...font }}>
                                                    <i className="pi pi-th-large" style={{ fontSize: expanded ? '0.78rem' : '0.7rem', marginRight: 4 }} />{p.classroomName}
                                                </div>
                                            </div>
                                            <div style={{
                                                background: color + '22', color: color, borderRadius: 6,
                                                padding: expanded ? '4px 14px' : '2px 8px', fontSize: expanded ? '1rem' : '0.7rem', fontWeight: 700, alignSelf: 'flex-start', ...font
                                            }}>
                                                {p.languageName}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    {showCalendar && (
                        <div className="p-col-12 p-md-8">
                            <div>
                                {loading && (
                                    <div className="p-d-flex p-ai-center p-jc-center p-py-3">
                                        <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.3rem', marginRight: 8 }} />
                                        <span style={{ color: '#6c757d', fontSize: '0.88rem', ...font }}>Cargando...</span>
                                    </div>
                                )}
                                <FullCalendar ref={calendarRef} events={events} options={calendarOptions} />
                            </div>
                        </div>
                    )}
                </div>

                </div>

                {/* Detail Dialog */}
                <Dialog visible={detailDialog} style={{ width: '480px' }} header="Detalle de Clase" modal onHide={() => setDetailDialog(false)}
                    footer={
                        <div className="p-d-flex p-jc-end">
                            <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setDetailDialog(false)} />
                        </div>
                    }
                >
                    {selectedEvent && (
                        <div style={{ ...font }}>
                            <div style={{
                                background: (languageColors[selectedEvent.languageId] || '#607D8B') + '15',
                                borderLeft: `4px solid ${languageColors[selectedEvent.languageId] || '#607D8B'}`,
                                borderRadius: 8, padding: '1rem', marginBottom: '1rem'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a3320' }}>{selectedEvent.courseName}</div>
                                <div style={{
                                    display: 'inline-block', marginTop: 4,
                                    background: (languageColors[selectedEvent.languageId] || '#607D8B') + '22',
                                    color: languageColors[selectedEvent.languageId] || '#607D8B',
                                    borderRadius: 6, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700
                                }}>
                                    {selectedEvent.languageName}
                                </div>
                            </div>
                            <div className="p-grid" style={{ fontSize: '0.92rem' }}>
                                <div className="p-col-6 p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-user" style={{ color: '#3ab54a' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#9e9e9e', fontWeight: 600 }}>Docente</div>
                                        <div style={{ fontWeight: 600, color: '#1a3320' }}>{selectedEvent.teacherName}</div>
                                    </div>
                                </div>
                                <div className="p-col-6 p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-th-large" style={{ color: '#E64A19' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#9e9e9e', fontWeight: 600 }}>Aula</div>
                                        <div style={{ fontWeight: 600, color: '#1a3320' }}>{selectedEvent.classroomName}</div>
                                    </div>
                                </div>
                                <div className="p-col-6 p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-calendar" style={{ color: '#1976D2' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#9e9e9e', fontWeight: 600 }}>Fecha</div>
                                        <div style={{ fontWeight: 600, color: '#1a3320' }}>
                                            {selectedEvent.date ? selectedEvent.date.split('-').reverse().join('/') : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-col-6 p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                    <i className="pi pi-clock" style={{ color: '#7B1FA2' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#9e9e9e', fontWeight: 600 }}>Horario</div>
                                        <div style={{ fontWeight: 600, color: '#1a3320' }}>{selectedEvent.startTime} - {selectedEvent.endTime}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Dialog>
            </div>
        </div>
    );
}
