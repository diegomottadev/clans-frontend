import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import Error from '../../components/Error';

const monthNames = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Debtor() {
    const toast = useRef(null);

    const [loading, setLoading] = useState(true);
    const [showError, setShowError] = useState(false);
    const [debtors, setDebtors] = useState([]);
    const [summary, setSummary] = useState({});
    const [languajes, setLanguajes] = useState([]);
    const [languageFilter, setLanguageFilter] = useState(null);
    const [courseFilter, setCourseFilter] = useState(null);
    const [courses, setCourses] = useState([]);
    const [chargingCourse, setChargingCourse] = useState(false);
    const [monthFilter, setMonthFilter] = useState(null);
    const [prevYearDialog, setPrevYearDialog] = useState(false);
    const [prevYearData, setPrevYearData] = useState(null);
    const [studentFilter, setStudentFilter] = useState('');

    // Ciclo lectivo: marzo a diciembre
    const monthOptions = [
        { label: 'Marzo', value: 3 }, { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 },
        { label: 'Septiembre', value: 9 }, { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
    ];

    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };
    const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: '#495057', marginBottom: 4, ...font };

    // Load languages on mount
    useEffect(() => {
        axios.get(`${BASE_URL}/api/languajes?all=1`)
            .then(({ data: { data: { data: langs } } }) => setLanguajes(langs || []))
            .catch(() => {});
    }, []);

    // Load courses when language changes
    useEffect(() => {
        if (languageFilter) {
            setChargingCourse(true);
            setCourses([]);
            setCourseFilter(null);
            axios.get(`${BASE_URL}/api/languajes/${languageFilter}/courses?all=1`)
                .then(({ data: { data: { data: c } } }) => {
                    setCourses(c || []);
                    setChargingCourse(false);
                })
                .catch(() => setChargingCourse(false));
        } else {
            setCourses([]);
            setCourseFilter(null);
        }
    }, [languageFilter]);

    // Load debtors (auto endpoint)
    useEffect(() => {
        loadDebtors();
    }, [languageFilter, courseFilter, monthFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadDebtors = () => {
        setLoading(true);
        let url = `${BASE_URL}/api/debtors/auto?`;
        if (languageFilter) url += `language_id=${languageFilter}&`;
        if (courseFilter) url += `course_id=${courseFilter}&`;
        if (monthFilter) url += `month=${monthFilter}&`;

        axios.get(url)
            .then(({ data }) => {
                // data = { data: [...], currentMonth, deadline, ... }
                const res = Array.isArray(data.data) ? data : (data.data || data);
                setDebtors(res.data || []);
                setSummary({
                    deadline: res.deadline,
                    currentMonth: res.currentMonth,
                    maxMonthDue: res.maxMonthDue,
                    totalOwed: res.totalOwed,
                    totalMora: res.totalMora,
                    totalStudents: res.totalStudents,
                    interestRate: res.interestRate,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                if (err.response && err.response.status === 401) {
                    toast.current && toast.current.show({ severity: 'warn', summary: 'Sesión expirada', detail: 'Inicie sesión nuevamente', life: 5000 });
                } else {
                    setShowError(true);
                }
            });
    };

    // Filter by student name then group by language > course
    const filteredDebtors = studentFilter
        ? debtors.filter(d => (d.student || '').toLowerCase().includes(studentFilter.toLowerCase()))
        : debtors;

    const grouped = {};
    filteredDebtors.forEach(d => {
        const langKey = d.languageName || 'Sin idioma';
        const courseKey = d.courseName || 'Sin curso';
        if (!grouped[langKey]) grouped[langKey] = {};
        if (!grouped[langKey][courseKey]) grouped[langKey][courseKey] = [];
        grouped[langKey][courseKey].push(d);
    });

    const openPrevYearDialog = (rowData) => {
        setPrevYearData(rowData);
        setPrevYearDialog(true);
    };

    const studentBody = (rowData) => (
        <span style={{ fontWeight: 600, color: '#1a3320', ...font }}>{rowData.student}</span>
    );

    const previousYearDebtBody = (rowData) => {
        if (!rowData.previousYearDebt) return null;
        return (
            <Button
                icon="pi pi-exclamation-triangle"
                className="p-button-rounded p-button-outlined p-button-warning"
                onClick={() => openPrevYearDialog(rowData)}
                tooltip={`Deuda del ${rowData.previousYear}`}
                tooltipOptions={{ position: 'top' }}
            />
        );
    };

    const amountOwedBody = (rowData) => (
        <span style={{
            background: '#ffebee', color: '#c62828', borderRadius: 6,
            padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem', ...font
        }}>
            $ {rowData.amountOwed.toLocaleString()}
        </span>
    );

    const moraBody = (rowData) => (
        <span style={{
            background: rowData.totalMora > 0 ? '#fff3e0' : '#e8f5e9',
            color: rowData.totalMora > 0 ? '#e65100' : '#2e7d32',
            borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem', ...font
        }}>
            $ {(rowData.totalMora || 0).toLocaleString()}
        </span>
    );

    const monthFeeBody = (rowData) => (
        <span style={{ color: '#495057', fontWeight: 500, ...font }}>$ {rowData.monthlyFee.toLocaleString()}</span>
    );

    const monthsOwedBody = (rowData) => {
        const total = (rowData.monthsOwed || 0) + (rowData.previousYearMonthsOwed || 0);
        return (
            <span style={{
                background: total >= 3 ? '#ffebee' : '#fff3e0',
                color: total >= 3 ? '#c62828' : '#e65100',
                borderRadius: 12, padding: '2px 10px', fontWeight: 700, fontSize: '0.8rem', ...font
            }}>
                {total}
            </span>
        );
    };

    const owedMonthsBody = (rowData) => (
        <div style={{ fontSize: '0.82rem', ...font }}>
            {rowData.previousYearDebt && rowData.previousYearOwedMonths && rowData.previousYearOwedMonths.length > 0 && (
                <div style={{ color: '#c62828', fontWeight: 600, marginBottom: 2 }}>
                    {rowData.previousYear}: {rowData.previousYearOwedMonths.map(m => monthNames[m]).join(', ')}
                </div>
            )}
            {rowData.owedMonths.length > 0 && (
                <span style={{ color: '#495057' }}>
                    {rowData.owedMonths.map(m => monthNames[m]).join(', ')}
                </span>
            )}
        </div>
    );

    const lastPaymentBody = (rowData) => {
        if (!rowData.lastPaymentDate) return <span style={{ color: '#9e9e9e', ...font }}>—</span>;
        return <span style={{ color: '#495057', ...font }}>{rowData.lastPaymentDate}</span>;
    };

    const panelHeaderTemplate = (options, title, count) => (
        <div
            className="p-d-flex p-ai-center"
            style={{
                gap: '0.6rem', cursor: 'pointer', padding: '0.6rem 1rem',
                background: 'linear-gradient(135deg, #f8fdf8 0%, #e8f5e9 100%)',
                borderRadius: '8px 8px 0 0',
            }}
            onClick={options.onTogglerClick}
        >
            <i className={options.collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'}
                style={{ color: '#3ab54a', fontSize: '0.85rem', transition: 'transform 0.2s' }} />
            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '0.95rem', ...font }}>{title}</span>
            {count !== undefined && (
                <span style={{
                    background: '#e8f5e9', color: '#2e7d32', borderRadius: 12,
                    padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700,
                    border: '1px solid #a5d6a7', ...font
                }}>
                    {count}
                </span>
            )}
        </div>
    );

    if (showError) {
        return <Error mensaje={'Hubo un problema al cargar los registros de deudores'} />;
    }

    return (
        <div className="p-grid crud-demo">
            <div className="p-col-12">
                {/* Header */}
                <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #3ab54a, #1a5c25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(58,181,74,0.35)'
                    }}>
                        <i className="pi pi-money-bill" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>
                            Deudores
                        </h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>
                            Detección automática de cuotas impagas
                        </p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />

                    {/* Summary cards */}
                    {!loading && debtors.length > 0 && (
                        <div className="p-grid p-mb-3" style={{ gap: 0 }}>
                            <div className="p-col-12 p-md-3">
                                <div style={{
                                    background: '#ffebee', borderRadius: 10, padding: '0.8rem 1rem',
                                    border: '1px solid #ef9a9a', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#c62828', fontWeight: 600, ...font }}>Total adeudado</div>
                                    <div style={{ fontSize: '1.4rem', color: '#c62828', fontWeight: 800, ...font }}>
                                        $ {(summary.totalOwed || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="p-col-12 p-md-3">
                                <div style={{
                                    background: '#fff3e0', borderRadius: 10, padding: '0.8rem 1rem',
                                    border: '1px solid #ffe082', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#e65100', fontWeight: 600, ...font }}>Alumnos deudores</div>
                                    <div style={{ fontSize: '1.4rem', color: '#e65100', fontWeight: 800, ...font }}>
                                        {summary.totalStudents || 0}
                                    </div>
                                </div>
                            </div>
                            <div className="p-col-12 p-md-3">
                                <div style={{
                                    background: '#e8f5e9', borderRadius: 10, padding: '0.8rem 1rem',
                                    border: '1px solid #a5d6a7', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600, ...font }}>Vencimiento</div>
                                    <div style={{ fontSize: '1.4rem', color: '#2e7d32', fontWeight: 800, ...font }}>
                                        {summary.deadline || '—'}
                                    </div>
                                </div>
                            </div>
                            <div className="p-col-12 p-md-3">
                                <div style={{
                                    background: '#e3f2fd', borderRadius: 10, padding: '0.8rem 1rem',
                                    border: '1px solid #90caf9', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 600, ...font }}>Meses adeudables</div>
                                    <div style={{ fontSize: '1.4rem', color: '#1565c0', fontWeight: 800, ...font }}>
                                        Hasta {monthNames[summary.maxMonthDue] || '—'}
                                    </div>
                                </div>
                            </div>
                            {summary.interestRate > 0 && (
                                <>
                                    <div className="p-col-12 p-md-3">
                                        <div style={{
                                            background: '#fce4ec', borderRadius: 10, padding: '0.8rem 1rem',
                                            border: '1px solid #f48fb1', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: '#880e4f', fontWeight: 600, ...font }}>Interés por mes</div>
                                            <div style={{ fontSize: '1.4rem', color: '#880e4f', fontWeight: 800, ...font }}>
                                                $ {(summary.interestRate || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-col-12 p-md-3">
                                        <div style={{
                                            background: '#fff3e0', borderRadius: 10, padding: '0.8rem 1rem',
                                            border: '1px solid #ffcc80', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: '#e65100', fontWeight: 600, ...font }}>Total mora</div>
                                            <div style={{ fontSize: '1.4rem', color: '#e65100', fontWeight: 800, ...font }}>
                                                $ {(summary.totalMora || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Filters */}
                    <div style={{
                        background: '#f8fdf8', borderRadius: 10, padding: '1rem 1.2rem',
                        border: '1px solid #e0e0e0', marginBottom: '1.2rem'
                    }}>
                        <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '0.5rem' }}>
                            <i className="pi pi-filter" style={{ color: '#3ab54a', fontSize: '0.9rem' }} />
                            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '0.9rem', ...font }}>Filtros</span>
                        </div>
                        <div className="p-fluid p-formgrid p-grid">
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="studentSearch" style={labelStyle}>Alumno</label>
                                <span className="p-input-icon-left" style={{ width: '100%' }}>
                                    <i className="pi pi-search" />
                                    <InputText
                                        id="studentSearch"
                                        value={studentFilter}
                                        onChange={e => setStudentFilter(e.target.value)}
                                        placeholder="Buscar por nombre..."
                                        style={{ borderRadius: 8, ...font, fontSize: '0.88rem', width: '100%' }}
                                    />
                                </span>
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="month" style={labelStyle}>Mes</label>
                                <Dropdown
                                    appendTo={document.body} id="month" value={monthFilter}
                                    onChange={e => setMonthFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={monthOptions} optionLabel="label" optionValue="value"
                                    showClear placeholder="Todos los meses"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }}
                                />
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="languaje" style={labelStyle}>Idioma</label>
                                <Dropdown
                                    appendTo={document.body} id="languaje" value={languageFilter}
                                    onChange={e => setLanguageFilter(e.target.value !== undefined ? e.target.value : null)}
                                    options={languajes} optionLabel="name" optionValue="id"
                                    filter showClear filterBy="name" placeholder="Todos los idiomas"
                                    style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }}
                                />
                            </div>
                            <div className="p-field p-col-12 p-md-3">
                                <label htmlFor="course" style={labelStyle}>Curso</label>
                                <div style={{ position: 'relative' }}>
                                    <Dropdown
                                        appendTo={document.body} id="course" value={courseFilter}
                                        onChange={e => setCourseFilter(e.target.value !== undefined ? e.target.value : null)}
                                        options={courses} optionLabel="nameId" optionValue="id"
                                        filter showClear filterBy="nameId"
                                        disabled={!languageFilter || chargingCourse}
                                        placeholder={chargingCourse ? '' : (!languageFilter ? 'Seleccione idioma primero' : '-- Seleccione curso --')}
                                        style={{ borderRadius: 8, ...font, fontSize: '0.88rem' }}
                                    />
                                    {chargingCourse && (
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                                        }}>
                                            <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.1rem', marginRight: 6 }} />
                                            <span style={{ color: '#6c757d', fontSize: '0.82rem', fontWeight: 500, ...font }}>Cargando cursos...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="p-d-flex p-ai-center p-jc-center p-py-4">
                            <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.5rem', marginRight: 8 }} />
                            <span style={{ color: '#6c757d', fontSize: '0.9rem', fontWeight: 500, ...font }}>Detectando deudores...</span>
                        </div>
                    )}

                    {/* Results grouped by language > course */}
                    {!loading && Object.keys(grouped).map(langName => (
                        <Panel
                            key={langName}
                            headerTemplate={(opts) => panelHeaderTemplate(opts, langName)}
                            toggleable
                            style={{ marginBottom: '0.75rem', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}
                        >
                            {Object.keys(grouped[langName]).map(courseName => {
                                const students = grouped[langName][courseName];
                                const courseTotal = students.reduce((sum, s) => sum + s.amountOwed, 0);
                                return (
                                    <Panel
                                        key={courseName}
                                        headerTemplate={(opts) => panelHeaderTemplate(opts, courseName, `${students.length} alumno(s)`)}
                                        toggleable
                                        style={{ marginBottom: '0.5rem', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}
                                    >
                                        <DataTable
                                            value={students}
                                            className="datatable-responsive datatable-compact"
                                            rowHover stripedRows
                                            style={{ ...font, fontSize: '0.88rem' }}
                                        >
                                            <Column field="student" header="Alumno" body={studentBody} sortable />
                                            <Column field="dni" header="DNI" style={{ width: '8rem' }} />
                                            <Column field="owedMonths" header="Meses adeudados" body={owedMonthsBody} />
                                            <Column field="monthsOwed" header="Cant." body={monthsOwedBody} style={{ textAlign: 'center', width: '5rem' }} />
                                            <Column field="monthlyFee" header="Cuota" body={monthFeeBody} style={{ width: '7rem' }} />
                                            <Column field="totalMora" header="Mora" body={moraBody} style={{ width: '7rem' }} />
                                            <Column field="amountOwed" header="Total adeudado" body={amountOwedBody} style={{ width: '9rem' }} />
                                            <Column field="lastPaymentDate" header="Último pago" body={lastPaymentBody} style={{ width: '8rem' }} />
                                            <Column body={previousYearDebtBody} style={{ textAlign: 'center', width: '4rem' }} />
                                        </DataTable>
                                        <div className="p-d-flex p-ai-center p-jc-end" style={{
                                            padding: '0.75rem 1rem', marginTop: '0.5rem',
                                            background: 'linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)',
                                            borderRadius: 8, border: '1px solid #ffe082'
                                        }}>
                                            <span style={{ fontWeight: 600, color: '#5d4037', fontSize: '0.9rem', marginRight: 8, ...font }}>
                                                Total adeudado:
                                            </span>
                                            <span style={{
                                                fontWeight: 800, color: '#c62828', fontSize: '1.1rem',
                                                background: '#ffebee', borderRadius: 8, padding: '4px 14px',
                                                border: '1px solid #ef9a9a', ...font
                                            }}>
                                                $ {courseTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </Panel>
                                );
                            })}
                        </Panel>
                    ))}

                    {/* Modal deuda año anterior */}
                    <Dialog
                        visible={prevYearDialog}
                        onHide={() => setPrevYearDialog(false)}
                        header={
                            <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
                                <i className="pi pi-exclamation-triangle" style={{ color: '#c62828', fontSize: '1.2rem' }} />
                                <span style={{ ...font }}>Deuda del ciclo {prevYearData?.previousYear}</span>
                            </div>
                        }
                        style={{ width: '500px' }}
                        breakpoints={{ '640px': '95vw' }}
                        modal
                        footer={
                            <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setPrevYearDialog(false)} />
                        }
                    >
                        {prevYearData && (
                            <div>
                                <div style={{
                                    background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 1rem',
                                    marginBottom: '1rem', ...font, fontSize: '0.88rem'
                                }}>
                                    <strong>{prevYearData.student}</strong>
                                    <span style={{ color: '#6c757d', marginLeft: 8 }}>DNI: {prevYearData.dni || '—'}</span>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', ...font, fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: '#ffebee' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#c62828', fontWeight: 700, borderBottom: '2px solid #ef9a9a' }}>Mes</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', color: '#c62828', fontWeight: 700, borderBottom: '2px solid #ef9a9a' }}>Cuota</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', color: '#c62828', fontWeight: 700, borderBottom: '2px solid #ef9a9a' }}>Mora</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', color: '#c62828', fontWeight: 700, borderBottom: '2px solid #ef9a9a' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(prevYearData.previousYearOwedMonths || []).map((m, i) => (
                                            <tr key={m} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
                                                    {monthNames[m]} {prevYearData.previousYear}
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                                                    $ {(prevYearData.previousYearFee || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee', color: '#e65100' }}>
                                                    $ {(prevYearData.moraPerMonth || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700 }}>
                                                    $ {((prevYearData.previousYearFee || 0) + (prevYearData.moraPerMonth || 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: '#ffebee' }}>
                                            <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: '#c62828', borderTop: '2px solid #ef9a9a' }}>
                                                Total deuda {prevYearData.previousYear} ({prevYearData.previousYearMonthsOwed} meses)
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#c62828', fontSize: '1rem', borderTop: '2px solid #ef9a9a' }}>
                                                $ {(prevYearData.previousYearAmount + (prevYearData.previousYearMonthsOwed || 0) * (prevYearData.moraPerMonth || 0)).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Dialog>

                    {/* Empty state */}
                    {!loading && debtors.length === 0 && (
                        <div className="p-d-flex p-ai-center p-jc-center p-py-5" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                            <i className="pi pi-check-circle" style={{ color: '#a5d6a7', fontSize: '2.5rem' }} />
                            <span style={{ color: '#6c757d', fontSize: '0.95rem', fontWeight: 500, ...font }}>
                                No se encontraron deudores. Todos los alumnos están al día.
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
