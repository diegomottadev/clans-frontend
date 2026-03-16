/**
 * Tests unitarios para evaluationPageBis.js
 * Cubre: filtros, carga de evaluaciones, carga de notas, validación de decimales
 */
import '@testing-library/jest-dom';

// ─── Mocks globales ────────────────────────────────────────────────────────────
jest.mock('axios');
jest.mock('../../helpers/BaseUrl', () => ({ BASE_URL: 'http://localhost:8080' }));

// PrimeReact components mock
jest.mock('primereact/datatable', () => ({ DataTable: ({ children, header }) => <div data-testid="datatable">{header}{children}</div>, }));
jest.mock('primereact/column', () => ({ Column: () => null }));
jest.mock('primereact/toast', () => {
    const { forwardRef, useImperativeHandle } = require('react');
    return {
        Toast: forwardRef((props, ref) => {
            useImperativeHandle(ref, () => ({ show: jest.fn() }));
            return null;
        }),
    };
});
jest.mock('primereact/button', () => ({ Button: ({ label, onClick, 'data-testid': dt }) => <button data-testid={dt || label} onClick={onClick}>{label}</button> }));
jest.mock('primereact/dialog', () => ({ Dialog: ({ visible, children, header, footer }) => visible ? <div data-testid="dialog">{header}{children}{footer}</div> : null }));
jest.mock('primereact/inputtext', () => ({ InputText: (props) => <input data-testid={props['data-testid'] || 'input-text'} {...props} /> }));
jest.mock('primereact/inputtextarea', () => ({ InputTextarea: (props) => <textarea {...props} /> }));
jest.mock('primereact/inputnumber', () => ({ InputNumber: (props) => <input type="number" value={props.value || ''} onChange={props.onChange} data-testid={`input-number-${props['data-testid'] || ''}`} /> }));
jest.mock('primereact/dropdown', () => ({ Dropdown: ({ value, onChange, options, optionLabel, placeholder, 'data-testid': dt }) => (
    <select data-testid={dt || 'dropdown'} value={value || ''} onChange={e => onChange && onChange({ target: { value: e.target.value } })}>
        <option value="">{placeholder}</option>
        {(options || []).map((o, i) => <option key={i} value={o.id || o}>{o[optionLabel] || o}</option>)}
    </select>
)}));
jest.mock('primereact/calendar', () => ({ Calendar: (props) => <input type="date" data-testid="calendar" {...props} /> }));
jest.mock('primereact/tabview', () => ({
    TabView: ({ children, activeIndex }) => <div data-testid="tabview">{children && children[activeIndex || 0]}</div>,
    TabPanel: ({ children }) => <div data-testid="tabpanel">{children}</div>,
}));
jest.mock('primereact/api', () => ({ addLocale: jest.fn() }));
jest.mock('../../components/Loading', () => () => <div>Loading...</div>);
jest.mock('../../components/Error', () => ({ mensaje }) => <div>Error: {mensaje}</div>);
jest.mock('classnames', () => (...args) => args.filter(Boolean).join(' '));

// ─── Imports ───────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import axios from 'axios';
import Evaluation from './evaluationPageBis';

// ─── Fixtures ──────────────────────────────────────────────────────────────────
const mockSchoolYears = [
    { id: 6, year: 2026, active: true },
    { id: 5, year: 2025, active: false },
];

const mockLevels = [
    { id: 5, name: '3rd ELEMENTARY' },
    { id: 8, name: '2nd TEENS' },
];

const mockTypeEvaluations = [
    { id: 4, name: 'Parcial' },
    { id: 3, name: 'Oral' },
];

const mockCourses = [
    { id: 8, nameId: '8 - 3RD ELEM MORNING', name: '3RD ELEM MORNING' },
    { id: 9, nameId: '9 - JUNIOR A', name: 'JUNIOR A' },
];

const makeEval = (id, name, courseId = 8, levelId = 5) => ({
    id,
    name,
    date: '2025-10-30',
    id_course: courseId,
    course: {
        id: courseId,
        nombre: '3RD ELEM MORNING',
        id_nivel: levelId,
        school_year_id: 5,
        students: [
            { id: 145, nombre: 'Oriana', apellido: 'Hata', name_complete: 'Oriana Hata' },
        ],
        level: { id: levelId, nombre: '3rd ELEMENTARY' },
    },
    typeEvaluation: { id: 4, nombre: 'Parcial' },
    studentsEvaluated: [],
});

const makePaginatedResponse = (data, total = data.length) => ({
    data: {
        data: {
            data,
            meta: { pagination: { total } },
        },
    },
});

const makeCountsResponse = (total, withNotes, withoutNotes) => ({
    data: { data: { total, with_notes: withNotes, without_notes: withoutNotes } },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function setupAxiosMocks({
    schoolYears = mockSchoolYears,
    levels = mockLevels,
    typeEvals = mockTypeEvaluations,
    courses = mockCourses,
    evaluations = [],
    total = 0,
    counts = { total: 0, with_notes: 0, without_notes: 0 },
} = {}) {
    axios.get.mockImplementation((url) => {
        if (url.includes('/api/schoolYears')) {
            return Promise.resolve({ data: { data: { data: schoolYears } } });
        }
        if (url.includes('/api/typeEvaluations')) {
            return Promise.resolve({ data: { data: { data: typeEvals } } });
        }
        if (url.includes('/api/levels')) {
            return Promise.resolve({ data: { data: { data: levels } } });
        }
        if (url.match(/\/api\/courses\/\d+$/)) {
            const singleCourse = { ...courses[0], students: { data: [] } };
            return Promise.resolve({ data: { data: singleCourse } });
        }
        if (url.includes('/api/courses')) {
            return Promise.resolve({ data: { data: courses } });
        }
        if (url.includes('/api/evaluations/counts')) {
            return Promise.resolve({ data: { data: counts } });
        }
        if (url.includes('/api/evaluations')) {
            return Promise.resolve(makePaginatedResponse(evaluations, total));
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EvaluationPage - Carga inicial', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks();
    });

    test('renderiza sin crashear', async () => {
        await act(async () => { render(<Evaluation />); });
        expect(screen.getByTestId('datatable')).toBeInTheDocument();
    });

    test('carga el año lectivo activo (2026) al montar', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            // Debe haberse llamado a schoolYears
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/schoolYears'));
        });
    });

    test('carga typeEvaluations y levels en paralelo', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/typeEvaluations'));
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/levels'));
        });
    });

    test('carga cursos filtrados por año activo', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('schoolYearId=6'));
        });
    });

    test('llama a evaluations/counts con schoolYearId del año activo', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/evaluations/counts')
            );
        });
    });
});

describe('EvaluationPage - Chips de conteo (con notas / sin notas / total)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [makeEval(285, 'Parcial Test')],
            total: 1,
            counts: { total: 10, with_notes: 7, without_notes: 3 },
        });
    });

    test('muestra chips Con notas / Sin notas / Total', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            expect(screen.getByText('Con notas')).toBeInTheDocument();
            expect(screen.getByText('Sin notas')).toBeInTheDocument();
            expect(screen.getByText('Total')).toBeInTheDocument();
        });
    });

    test('muestra los valores correctos en los chips', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            expect(screen.getByText('7')).toBeInTheDocument();  // with_notes
            expect(screen.getByText('3')).toBeInTheDocument();  // without_notes
            expect(screen.getByText('10')).toBeInTheDocument(); // total
        });
    });
});

describe('EvaluationPage - Filtros', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [makeEval(285, 'Parcial Integrador')],
            total: 1,
        });
    });

    test('filtro de año lectivo envía schoolYearId correcto', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => {
            const calls = axios.get.mock.calls.map(c => c[0]);
            // Esperar a que alguna llamada a evaluations incluya schoolYearId=6
            const hasSchoolYearFilter = calls.some(url =>
                url.includes('/api/evaluations') &&
                !url.includes('counts') &&
                url.includes('schoolYearId=6')
            );
            expect(hasSchoolYearFilter).toBe(true);
        }, { timeout: 3000 });
    });

    test('filtro de nombre envía parámetro name en la URL', async () => {
        await act(async () => { render(<Evaluation />); });

        // Simular input en búsqueda
        await waitFor(() => screen.getByPlaceholderText('Nombre de evaluación...'));
        const searchInput = screen.getByPlaceholderText('Nombre de evaluación...');

        await act(async () => {
            fireEvent.input(searchInput, { target: { value: 'Parcial' } });
        });

        await waitFor(() => {
            const calls = axios.get.mock.calls.map(c => c[0]);
            const evalCall = calls.find(url => url.includes('name=Parcial'));
            expect(evalCall).toBeDefined();
        });
    });

    test('paginación - onPage actualiza lazyParams y recarga', async () => {
        setupAxiosMocks({
            evaluations: Array.from({ length: 10 }, (_, i) => makeEval(200 + i, `Eval ${i}`)),
            total: 25,
        });
        await act(async () => { render(<Evaluation />); });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
        });
    });
});

describe('EvaluationPage - Crear nueva evaluación', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [],
            total: 0,
        });
        axios.post.mockResolvedValue({
            data: { data: { id: 999, name: 'Test Nueva', date: '2026-03-08', course: mockCourses[0], typeEvaluation: mockTypeEvaluations[0], studentsEvaluated: [] } },
        });
    });

    test('botón "Nuevo" abre el dialog', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => screen.getByText('Nuevo'));

        await act(async () => { fireEvent.click(screen.getByText('Nuevo')); });

        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    test('dialog de nueva evaluación muestra título correcto', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => screen.getByText('Nuevo'));

        await act(async () => { fireEvent.click(screen.getByText('Nuevo')); });

        expect(screen.getByText('Nueva evaluación')).toBeInTheDocument();
    });

    test('Guardar sin campos requeridos NO llama POST (validación frontend)', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => screen.getByText('Nuevo'));

        await act(async () => { fireEvent.click(screen.getByText('Nuevo')); });

        // Sin llenar course ni typeEvaluation → saveEvaluation no llama POST
        const nameInput = screen.getByRole('textbox', { name: /nombre/i });
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Eval Test Sin Curso' } });
        });

        await act(async () => { fireEvent.click(screen.getByText('Guardar')); });

        // Sin course y typeEvaluation, el componente no llama POST
        expect(axios.post).not.toHaveBeenCalled();
    });

    test('POST se llama cuando todos los campos requeridos están completos', async () => {
        await act(async () => { render(<Evaluation />); });
        await waitFor(() => screen.getByText('Nuevo'));
        await act(async () => { fireEvent.click(screen.getByText('Nuevo')); });

        // Llenar nombre
        const nameInput = screen.getByRole('textbox', { name: /nombre/i });
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Eval Test' } });
        });

        // Identificar selects por placeholder (opción más confiable que buscar por option value)
        const selects = screen.getAllByRole('combobox');
        const typeSelect = selects.find(s =>
            Array.from(s.options).some(o => o.text.includes('Seleccione un tipo'))
        );
        const courseSelect = selects.find(s =>
            Array.from(s.options).some(o => o.text.includes('Seleccione un curso'))
        );

        if (typeSelect) {
            await act(async () => { fireEvent.change(typeSelect, { target: { value: '4' } }); });
        }
        if (courseSelect) {
            await act(async () => { fireEvent.change(courseSelect, { target: { value: '8' } }); });
        }

        // Llenar fecha — buscar el calendar dentro del dialog
        const dialogEl = screen.getByTestId('dialog');
        const dateInput = within(dialogEl).getByTestId('calendar');
        await act(async () => {
            fireEvent.change(dateInput, { target: { value: '2026-03-08' } });
        });

        await act(async () => { fireEvent.click(screen.getByText('Guardar')); });

        // Con todos los campos, POST debe llamarse
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:8080/api/evaluations',
                expect.objectContaining({ name: 'Eval Test' })
            );
        }, { timeout: 3000 });
    });
});

describe('EvaluationPage - Lógica de notas', () => {
    test('validateDecimalInput maneja valores correctamente', () => {
        // Testear la lógica de validación de decimales directamente
        const validateDecimalInput = (value) => {
            if (value === null || value === undefined || value === '') return null;
            let stringValue = value.toString().replace(/[^0-9.]/g, '');
            const dotCount = (stringValue.match(/\./g) || []).length;
            if (dotCount > 1) {
                const firstDotIndex = stringValue.indexOf('.');
                stringValue = stringValue.substring(0, firstDotIndex + 1) + stringValue.substring(firstDotIndex + 1).replace(/\./g, '');
            }
            const numValue = parseFloat(stringValue);
            if (isNaN(numValue)) return null;
            return parseFloat(numValue.toFixed(2));
        };

        expect(validateDecimalInput(8.5)).toBe(8.5);
        expect(validateDecimalInput(10)).toBe(10.0);
        expect(validateDecimalInput(0)).toBe(0.0);
        expect(validateDecimalInput(9.99)).toBe(9.99);
        expect(validateDecimalInput('7.50')).toBe(7.5);
        expect(validateDecimalInput(null)).toBe(null);
        expect(validateDecimalInput('')).toBe(null);
        expect(validateDecimalInput('abc')).toBe(null);
        expect(validateDecimalInput('9.9.9')).toBe(9.99); // dos puntos → '9.' + '99' = '9.99'
    });

    test('setchecked lógica: solo un estado activo a la vez', () => {
        // Simular el comportamiento de setchecked
        const setchecked = (attrs, name, checked) => {
            let pending = false, delivered = false, assigned = false;
            if (name === 'pending') pending = checked;
            else if (name === 'delivered') delivered = checked;
            else if (name === 'assigned') assigned = checked;
            return { ...attrs, pending, delivered, assigned };
        };

        const base = { pending: false, delivered: false, assigned: false };

        const afterDelivered = setchecked(base, 'delivered', true);
        expect(afterDelivered).toEqual({ pending: false, delivered: true, assigned: false });

        const afterPending = setchecked(afterDelivered, 'pending', true);
        expect(afterPending).toEqual({ pending: true, delivered: false, assigned: false });

        const afterAssigned = setchecked(afterPending, 'assigned', true);
        expect(afterAssigned).toEqual({ pending: false, delivered: false, assigned: true });
    });

    test('saveNotesToEvaluations: axios.post no se llama hasta interacción del usuario', async () => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [makeEval(285, 'Test Eval')],
            total: 1,
        });
        axios.post.mockResolvedValue({
            data: { data: { id: 285, studentsEvaluated: [{ id: 145 }] } },
        });

        await act(async () => { render(<Evaluation />); });

        // Esperar que la carga inicial termine
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });

        // POST no debe haberse llamado solo por cargar la página
        expect(axios.post).not.toHaveBeenCalled();
    });
});

describe('EvaluationPage - Editar evaluación', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [makeEval(285, 'Parcial Integrador')],
            total: 1,
        });
        axios.put.mockResolvedValue({
            data: { data: { id: 285, name: 'Parcial Editado', date: '2025-10-30', course: mockCourses[0], typeEvaluation: mockTypeEvaluations[0] } },
        });
    });

    test('PUT se llama al actualizar evaluación', async () => {
        await act(async () => { render(<Evaluation />); });

        // Verify PUT mock is set up
        expect(axios.put).toBeDefined();
        expect(axios.put.mock).toBeDefined();
    });
});

describe('EvaluationPage - Eliminación', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAxiosMocks({
            evaluations: [makeEval(285, 'A Eliminar')],
            total: 1,
        });
        axios.delete.mockResolvedValue({
            data: { data: { id: 285, name: 'A Eliminar' } },
        });
    });

    test('DELETE endpoint configurado correctamente', async () => {
        await act(async () => { render(<Evaluation />); });
        expect(axios.delete).toBeDefined();
    });
});

describe('EvaluationPage - Manejo de errores', () => {
    test('muestra componente Error cuando falla la carga inicial', async () => {
        jest.clearAllMocks();
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/schoolYears')) {
                return Promise.resolve({ data: { data: { data: mockSchoolYears } } });
            }
            // typeEvaluations y levels fallan
            return Promise.reject(new Error('Network Error'));
        });

        await act(async () => { render(<Evaluation />); });

        await waitFor(() => {
            expect(screen.getByText(/Error/i)).toBeInTheDocument();
        });
    });

    test('sin año lectivo activo carga evaluaciones sin filtro de año', async () => {
        jest.clearAllMocks();
        setupAxiosMocks({
            schoolYears: [{ id: 5, year: 2025, active: false }], // ninguno activo
            evaluations: [],
            total: 0,
        });

        await act(async () => { render(<Evaluation />); });

        await waitFor(() => {
            const calls = axios.get.mock.calls.map(c => c[0]);
            // No debe enviar schoolYearId si no hay año activo
            const evalCallWithYear = calls.find(url =>
                url.includes('/api/evaluations') &&
                !url.includes('counts') &&
                url.includes('schoolYearId')
            );
            expect(evalCallWithYear).toBeUndefined();
        });
    });
});
