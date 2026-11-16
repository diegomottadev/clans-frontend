import React, { useState, useEffect, useRef } from 'react';

import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom';

import clansLogo from './clans_logo.jpg';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import 'primereact/resources/themes/saga-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'prismjs/themes/prism-coy.css';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import './layout/flags/flags.css';
import './layout/layout.scss';
import './App.scss';
import Level from './pages/levels/LevelPage';
import TypeCourse from './pages/typeCourses/typeCoursePage';
import Languaje from './pages/languajes/LanguajePage';
import TypeAssistance from './pages/typeAssistances/typeAssistancePage';
import TypeEvaluation from './pages/typeEvaluations/typeEvaluationPage';
import TypeExpense from './pages/typeExpenses/typeExpensePage';
import Teacher from './pages/teachers/teacherPage';
import Course from './pages/courses/coursePage';
import Student from './pages/students/studentPage';
import Evaluation from './pages/evaluations/evaluationPageBis';
import FixedCost from './pages/payments/fixedCosts/fixedCostPage';
import PaymentTeacher from './pages/payments/paymentsTeachers/paymentTeacher';
import Invoice from './pages/payments/chargingFees/invoicePage';
import Assistance from './pages/assistances/assistancePage';
import { setToken, initAxiosInterceptors, getToken } from './helpers/auth-helpers';
import Axios from 'axios';
import Login from './pages/login/Login';
import Error from './components/Error';
import { BASE_URL } from './helpers/BaseUrl';
import Loading from './components/Loading';
import ReportAssistanceByCourse from './pages/reports/reportAssistancesByCourse';
import ReportAssistanceByStudent from './pages/reports/reportAssistancesByStudent';
import ReportPaymentsByTeacher from './pages/reports/reportPaymentsByTeacher';
import ReportInvoicesByLanguajeCourse from './pages/reports/reportInvoicesByLanguajeCourse';
import ReportCompleteByStudent from './pages/reports/reportCompleteByStudent';
import ReportAnalyticByStudent from './pages/reports/reportAnalyticByStudent';
import ChangeYear from './pages/changeNewYear/changeNewYearPage';
import YearAcademic from './components/YearAcademic';
import Debtor from './pages/debtors/debtorPage';
import InterestRate from './pages/payments/interestRate/interestRatePage';
import UserPage from './pages/users/userPage';
import ReportLanguajeLevelCourse from './pages/reports/reportLanguajeLevelCourse';
import CleanupPage from './pages/cleanup/cleanupPage';
import FixStudentNamesPage from './pages/settings/fixStudentNamesPage';
import ClassroomPage from './pages/classrooms/classroomPage';
import ClassSchedulePage from './pages/classSchedules/classSchedulePage';
import CalendarDashboardPage from './pages/calendar/calendarDashboardPage';
import MyAccountPage from './pages/account/myAccountPage';
import UserMenu from './components/UserMenu';
import { logoutSession, AFTER_LOGOUT_PATH } from './helpers/logout';

/* npm uninstall node-sass
npm install sass */

initAxiosInterceptors() // lo usa en el useEffect para preguntar si ese token lo tiene el usuario


export default function App() {

    const [layoutColorMode] = useState('dark') // eslint-disable-line no-unused-vars
    const [mobileMenuActive] = useState(false);


    const [usuario, setUsuario] = useState(null); // no sabemos si hay un usuario autenticado
    const [cargandoUsuario, setCargandoUsuario] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        if (mobileMenuActive) {
            addClass(document.body, 'body-overflow-hidden');
        }
        else {
            removeClass(document.body, 'body-overflow-hidden');
        }
    }, [mobileMenuActive]);


    useEffect(() => {
        async function cargandoUsuario() {
            if (!getToken()) {
                setCargandoUsuario(false);
                return;
            }
            try {
                const { data: usuario } = await Axios.get(`${BASE_URL}/api/auth/me`);
                //console.log(usuario);
                // Filtrar la contraseña por seguridad
                const { password, ...usuarioSinPassword } = usuario;
                setUsuario(usuarioSinPassword);
                setCargandoUsuario(false)
            } catch (error) {
                console.log(error);
                setCargandoUsuario(false)

            }
        }

        cargandoUsuario();
    }, [])

    async function login(email, password) {
        try {
            const response = await Axios.post(`${BASE_URL}/api/auth/login`, {
                email,
                password
            });
            setUsuario(response.data.user);
            setToken(response.data.access_token);
        } catch (error) {
            console.error('Error en login:', error);
            throw error; // Re-lanzar el error para que Login.js pueda manejarlo
        }
    }


    async function logout() {
        await logoutSession();
        setUsuario(null);
        window.location.href = AFTER_LOGOUT_PATH;
    }

    // "Mi cuenta" guardó cambios: refrescar nombre y foto del topbar
    function actualizarPerfil(datos) {
        setUsuario(prev => ({
            ...prev,
            name: datos.name,
            has_avatar: datos.has_avatar,
            avatar_version: datos.avatar_version,
        }));
    }

    function mostrarError(mensaje) {
        //alert();
        setError(mensaje);
    }


    const addClass = (element, className) => {
        if (element.classList)
            element.classList.add(className);
        else
            element.className += ' ' + className;
    }

    const removeClass = (element, className) => {
        if (element.classList)
            element.classList.remove(className);
        else
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }



    // console.log(usuario);
    if(cargandoUsuario){
        return(
          <div>
              <Loading/>
          </div>
        );
    }

    if(usuario == null){
        return   (<LogoutRoute login={login} mostrarError={mostrarError} />)
    }

    return (
        <Router>
            {/* <Nav usuario={usuario}/> */}
            <Error mensaje={error}  />
            { usuario !== null && usuario.role === 'admin' &&  (<LoginRoute mostrarError={mostrarError} usuario={usuario} logout={logout} actualizarPerfil={actualizarPerfil} />) }
            { usuario !== null && usuario.role === 'user' &&  (<LoginRouteUser mostrarError={mostrarError} usuario={usuario} logout={logout} actualizarPerfil={actualizarPerfil} />) }
        </Router>
    );

}

const EvalIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <line x1="8" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="12" x2="13" y2="12"/>
        <polyline points="8,16.5 10,18.5 16,14.5"/>
    </svg>
);

function SidebarMenu({ items, onNavigate, collapsed }) {
    const [expanded, setExpanded] = useState({});
    const [hoveredItem, setHoveredItem] = useState(null);
    const hoverTimeout = useRef(null);

    const toggle = (label) => {
        setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const renderIcon = (item) => item.iconSvg ? item.iconSvg : <i className={item.icon} />;

    const handleMouseEnter = (label) => {
        if (!collapsed) return;
        clearTimeout(hoverTimeout.current);
        setHoveredItem(label);
    };

    const handleMouseLeave = () => {
        if (!collapsed) return;
        hoverTimeout.current = setTimeout(() => setHoveredItem(null), 150);
    };

    return (
        <ul className="sidebar-nav">
            {items.map((item) => {
                if (item.items) {
                    const isExpanded = !collapsed && !!expanded[item.label];
                    const isHovered = collapsed && hoveredItem === item.label;
                    return (
                        <li key={item.label} className="sidebar-nav-item sidebar-nav-item-has-sub"
                            onMouseEnter={() => handleMouseEnter(item.label)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button
                                className={`sidebar-nav-link sidebar-nav-group${isExpanded ? ' is-expanded' : ''}`}
                                onClick={() => collapsed ? null : toggle(item.label)}
                                title={collapsed ? item.label : undefined}
                            >
                                {renderIcon(item)}
                                {!collapsed && <span>{item.label}</span>}
                                {!collapsed && <i className={`pi ${isExpanded ? 'pi-angle-up' : 'pi-angle-down'} nav-chevron`} />}
                            </button>
                            {isExpanded && (
                                <ul className="sidebar-subnav">
                                    {item.items.map(sub => (
                                        <li key={sub.label}>
                                            <button
                                                className="sidebar-nav-link sidebar-subnav-link"
                                                onClick={() => { sub.command && sub.command(); onNavigate(); }}
                                            >
                                                {renderIcon(sub)}
                                                <span>{sub.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {isHovered && (
                                <div className="sidebar-popover"
                                    onMouseEnter={() => handleMouseEnter(item.label)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="sidebar-popover-title">{item.label}</div>
                                    {item.items.map(sub => (
                                        <button key={sub.label} className="sidebar-popover-item"
                                            onClick={() => { sub.command && sub.command(); onNavigate(); }}
                                        >
                                            {renderIcon(sub)}
                                            <span>{sub.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </li>
                    );
                }
                return (
                    <li key={item.label} className="sidebar-nav-item"
                        onMouseEnter={() => handleMouseEnter(item.label)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            className="sidebar-nav-link"
                            onClick={() => { item.command && item.command(); onNavigate(); }}
                            title={collapsed ? item.label : undefined}
                        >
                            {renderIcon(item)}
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                        {collapsed && hoveredItem === item.label && (
                            <div className="sidebar-popover sidebar-popover-single"
                                onMouseEnter={() => handleMouseEnter(item.label)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button className="sidebar-popover-item"
                                    onClick={() => { item.command && item.command(); onNavigate(); }}
                                >
                                    <span>{item.label}</span>
                                </button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function AppLayout({ menuItems, usuario, onAccount, onLogout, children }) {
    // Desktop: 'expanded' | 'collapsed'. Mobile: overlay toggle.
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const isMobile = () => window.innerWidth <= 768;

    const toggleSidebar = () => {
        if (isMobile()) {
            setMobileSidebarOpen(v => !v);
        } else {
            setSidebarExpanded(v => !v);
        }
    };

    const closeSidebar = () => {
        if (isMobile()) setMobileSidebarOpen(false);
    };

    const collapsed = !isMobile() && !sidebarExpanded;

    const wrapperClass = [
        'app-wrapper',
        !isMobile() ? 'sidebar-visible' : '',
        collapsed ? 'sidebar-collapsed' : '',
        !collapsed && !isMobile() ? 'sidebar-open' : '',
        mobileSidebarOpen ? 'sidebar-open mobile-sidebar-open' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClass}>
            {mobileSidebarOpen && <div className="layout-mask" onClick={() => setMobileSidebarOpen(false)} />}

            <aside className="app-sidebar">
                <div className="sidebar-header">
                    <img src={clansLogo} alt="Clan's" className="sidebar-logo" />
                </div>
                <div className="sidebar-body">
                    <SidebarMenu items={menuItems} onNavigate={closeSidebar} collapsed={collapsed} />
                </div>
            </aside>

            <div className="app-main">
                <header className="app-topbar">
                    <button className="p-link app-hamburger" onClick={toggleSidebar}>
                        <i className="pi pi-bars" />
                    </button>
                    <YearAcademic />
                    <div className="app-topbar-right">
                        <UserMenu usuario={usuario} onAccount={onAccount} onLogout={onLogout} />
                    </div>
                </header>
                <div className="app-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

function LoginRoute({ mostrarError, usuario, logout, actualizarPerfil }) {
    const history = useHistory();
    const nav = (path) => history.push(path);

    const nestedMenuitems = [
        { label: 'Calendario', icon: 'pi pi-fw pi-calendar', command: () => nav('/calendar-dashboard') },
        {
            label: 'Alumnos', icon: 'pi pi-fw pi-users',
            items: [{ label: 'Alumnos', icon: 'pi pi-fw pi-user', command: () => nav('/students') }]
        },
        {
            label: 'Evaluaciones', iconSvg: <EvalIcon size={16} />,
            items: [{ label: 'Evaluaciones', iconSvg: <EvalIcon size={14} />, command: () => nav('/evaluations') }]
        },
        {
            label: 'Asistencias', icon: 'pi pi-fw pi-check-square',
            items: [{ label: 'Asistencias', icon: 'pi pi-fw pi-check-circle', command: () => nav('/assistances') }]
        },
        {
            label: 'Cobros y Pagos', icon: 'pi pi-fw pi-dollar',
            items: [
                { label: 'Costos fijos',     icon: 'pi pi-fw pi-wallet',            command: () => nav('/fidexCosts') },
                { label: 'Pago a docentes',  icon: 'pi pi-fw pi-credit-card',       command: () => nav('/paymentsTeachers') },
                { label: 'Facturas',         icon: 'pi pi-fw pi-file',              command: () => nav('/invoices') },
                { label: 'Deudores',         icon: 'pi pi-fw pi-exclamation-circle', command: () => nav('/deudores') },
                { label: 'Tope de interés', icon: 'pi pi-fw pi-percentage',        command: () => nav('/interest-rate') },
            ]
        },
        {
            label: 'Reportes', icon: 'pi pi-fw pi-chart-bar',
            items: [
                { label: 'Asistencias por curso',                     icon: 'pi pi-fw pi-chart-bar',    command: () => nav('/reports/reportAssistanceByCourse') },
                { label: 'Asistencias por alumno',                    icon: 'pi pi-fw pi-chart-line',   command: () => nav('/reports/reportAssistanceByStudent') },
                { label: 'Alumnos por idioma, nivel y curso',         icon: 'pi pi-fw pi-list',         command: () => nav('/reports/reportLanguajeLevelCourse') },
                { label: 'Pago de docentes',                          icon: 'pi pi-fw pi-credit-card',  command: () => nav('/reports/reportPaymentsByTeacher') },
                { label: 'Cobros por idioma y cursos',                icon: 'pi pi-fw pi-dollar',       command: () => nav('/reports/reportInvoicesByLanguajeCourse') },
                { label: 'Informe completo por alumno',               icon: 'pi pi-fw pi-file',         command: () => nav('/reports/reportCompleteByStudent') },
                { label: 'Analítico por alumno',                      icon: 'pi pi-fw pi-id-card',      command: () => nav('/reports/reportAnalyticByStudent') },
            ]
        },
        {
            label: 'Herramientas', icon: 'pi pi-fw pi-sliders-v',
            items: [
                { label: 'Corregir nombres', icon: 'pi pi-fw pi-refresh',  command: () => nav('/fix-student-names') },
                { label: 'Limpieza',         icon: 'pi pi-fw pi-trash',   command: () => nav('/cleanup') },
            ]
        },
        {
            label: 'Configuraciones', icon: 'pi pi-fw pi-cog',
            items: [
                { label: 'Aulas',               icon: 'pi pi-fw pi-th-large',      command: () => nav('/classrooms') },
                { label: 'Ciclo lectivo',       icon: 'pi pi-fw pi-replay',        command: () => nav('/academicYear') },
                { label: 'Clases',              icon: 'pi pi-fw pi-clock',         command: () => nav('/class-schedules') },
                { label: 'Conceptos',           icon: 'pi pi-fw pi-tag',           command: () => nav('/types-expenses') },
                { label: 'Cursos',              icon: 'pi pi-fw pi-book',          command: () => nav('/courses') },
                { label: 'Docentes',            icon: 'pi pi-fw pi-briefcase',     command: () => nav('/teachers') },
                { label: 'Idiomas',             icon: 'pi pi-fw pi-globe',         command: () => nav('/languajes') },
                { label: 'Niveles',             icon: 'pi pi-fw pi-sliders-h',     command: () => nav('/levels') },
                { label: 'Tipo de asistencias', icon: 'pi pi-fw pi-check-circle',  command: () => nav('/types-asistances') },
                { label: 'Tipo de cursos',      icon: 'pi pi-fw pi-tags',          command: () => nav('/types-courses') },
                { label: 'Tipo de evaluaciones', icon: 'pi pi-fw pi-pencil',       command: () => nav('/types-evaluations') },
            ]
        },
        { label: 'Usuarios', icon: 'pi pi-fw pi-user-edit', command: () => nav('/users') },
        { label: 'Salir',    icon: 'pi pi-fw pi-sign-out',  command: () => logout() },
    ];

    return (
        <AppLayout menuItems={nestedMenuitems} usuario={usuario} onAccount={() => nav('/mi-cuenta')} onLogout={logout}>
            <Switch>
                <Route path="/mi-cuenta" render={props => <MyAccountPage {...props} onProfileChange={actualizarPerfil} />}></Route>
                <Route path="/levels"><Level/></Route>
                <Route path="/languajes" render={props => <Languaje {...props} usuario={usuario} />}></Route>
                <Route path="/types-courses" render={props => <TypeCourse {...props} usuario={usuario} />}></Route>
                <Route path="/types-asistances" render={props => <TypeAssistance {...props} usuario={usuario} />}></Route>
                <Route path="/types-evaluations" render={props => <TypeEvaluation {...props} usuario={usuario} />}></Route>
                <Route path="/types-expenses" render={props => <TypeExpense {...props} usuario={usuario} />}></Route>
                <Route path="/teachers" render={props => <Teacher {...props} usuario={usuario} />}></Route>
                <Route path="/courses" render={props => <Course {...props} usuario={usuario} />}></Route>
                <Route path="/students" render={props => <Student {...props} usuario={usuario} />}></Route>
                <Route path="/evaluations" render={props => <Evaluation {...props} usuario={usuario} />}></Route>
                <Route path="/fidexCosts" render={props => <FixedCost {...props} usuario={usuario} />}></Route>
                <Route path="/paymentsTeachers" render={props => <PaymentTeacher {...props} usuario={usuario} />}></Route>
                <Route path="/invoices" render={props => <Invoice {...props} usuario={usuario} />}></Route>
                <Route path="/deudores" render={props => <Debtor {...props} usuario={usuario} />}></Route>
                <Route path="/interest-rate" render={props => <InterestRate {...props} usuario={usuario} />}></Route>
                <Route path="/assistances" render={props => <Assistance {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportAssistanceByCourse" render={props => <ReportAssistanceByCourse {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportAssistanceByStudent" render={props => <ReportAssistanceByStudent {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportPaymentsByTeacher" render={props => <ReportPaymentsByTeacher {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportInvoicesByLanguajeCourse" render={props => <ReportInvoicesByLanguajeCourse {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportCompleteByStudent" render={props => <ReportCompleteByStudent {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportAnalyticByStudent" render={props => <ReportAnalyticByStudent {...props} usuario={usuario} />}></Route>
                <Route path="/reports/reportLanguajeLevelCourse" render={props => <ReportLanguajeLevelCourse {...props} usuario={usuario} />}></Route>
                <Route path="/academicYear" render={props => <ChangeYear {...props} usuario={usuario} />}></Route>
                <Route path="/users" render={props => <UserPage {...props} usuario={usuario} />}></Route>
                <Route path="/cleanup" render={props => <CleanupPage {...props} usuario={usuario} />}></Route>
                <Route path="/fix-student-names" render={props => <FixStudentNamesPage {...props} usuario={usuario} />}></Route>
                <Route path="/classrooms" render={props => <ClassroomPage {...props} usuario={usuario} />}></Route>
                <Route path="/class-schedules" render={props => <ClassSchedulePage {...props} usuario={usuario} />}></Route>
                <Route path="/calendar-dashboard" render={props => <CalendarDashboardPage {...props} usuario={usuario} />}></Route>
                <Route exact path="/" render={props => <CalendarDashboardPage {...props} usuario={usuario} />}></Route>
            </Switch>
        </AppLayout>
    );
}

function LoginRouteUser({ mostrarError, usuario, logout, actualizarPerfil }) {
    const history = useHistory();
    const nav = (path) => history.push(path);

    const nestedMenuitemsUser = [
        { label: 'Calendario', icon: 'pi pi-fw pi-calendar', command: () => nav('/calendar-dashboard') },
        {
            label: 'Cursos', icon: 'pi pi-fw pi-book',
            items: [{ label: 'Cursos', icon: 'pi pi-fw pi-book', command: () => nav('/courses') }]
        },
        {
            label: 'Evaluaciones', iconSvg: <EvalIcon size={16} />,
            items: [{ label: 'Evaluaciones', iconSvg: <EvalIcon size={14} />, command: () => nav('/evaluations') }]
        },
        {
            label: 'Asistencias', icon: 'pi pi-fw pi-calendar',
            items: [{ label: 'Asistencias', icon: 'pi pi-fw pi-check-circle', command: () => nav('/assistances') }]
        },
        { label: 'Salir', icon: 'pi pi-fw pi-sign-out', command: () => logout() },
    ];

    return (
        <AppLayout menuItems={nestedMenuitemsUser} usuario={usuario} onAccount={() => nav('/mi-cuenta')} onLogout={logout}>
            <Switch>
                <Route path="/mi-cuenta" render={props => <MyAccountPage {...props} onProfileChange={actualizarPerfil} />}></Route>
                <Route path="/courses" render={props => <Course {...props} usuario={usuario} />}></Route>
                <Route path="/evaluations" render={props => <Evaluation {...props} usuario={usuario} />}></Route>
                <Route path="/assistances" render={props => <Assistance {...props} usuario={usuario} />}></Route>
                <Route path="/calendar-dashboard" render={props => <CalendarDashboardPage {...props} usuario={usuario} />}></Route>
                <Route exact path="/" render={props => <CalendarDashboardPage {...props} usuario={usuario} />}></Route>
            </Switch>
        </AppLayout>
    );
}

function LogoutRoute({ login, mostrarError }) {
    return (
        <Switch>
            <Route render={props => <Login {...props} login={login} mostrarError={mostrarError} />} />
        </Switch>
    );
}

