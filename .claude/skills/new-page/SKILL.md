---
name: new-page
description: Genera una nueva página CRUD completa para este proyecto usando PrimeReact 6.1.0, PrimeFlex 2.0.0 y los patrones exactos del proyecto. Usar cuando el usuario pide crear una nueva página, módulo o ABM (alta, baja, modificación).
argument-hint: "[NombreEntidad] [ruta/api] [campo1:tipo campo2:tipo ...]"
disable-model-invocation: false
---

# Generador de página CRUD — clans-view

Genera una nueva página CRUD completa siguiendo **exactamente** el patrón de diseño de `studentPage.js` (la página de referencia del proyecto).

## Stack fijo del proyecto
- **PrimeReact 6.1.0** — imports individuales por componente
- **PrimeFlex 2.0.0** — clases con prefijo `p-` (p-grid, p-col-12, p-field, p-md-6, etc.)
- **PrimeIcons 4.1.0**
- **React 17** con hooks funcionales
- **axios** para llamadas HTTP
- **classnames** para validación visual

## Argumentos: $ARGUMENTS
- Primer token: nombre entidad PascalCase (ej: `Course`, `Payment`)
- Segundo token: ruta API sin barra (ej: `api/courses`)
- Tokens restantes: campos con tipo (ej: `name:text`, `date:calendar`, `amount:number`, `status:dropdown`)

---

## PALETA DE COLORES (usar siempre estos exactos)

```
verde principal:     #3ab54a
verde oscuro:        #1a3320
verde oscuro medio:  #2a8a36
verde hover:         #1a5c25
verde activo:        #4CAF50
verde tag bg:        #e8f5e9   border: #a5d6a7   text: #2e7d32
verde badge txt:     #388e3c
verde section line:  #e8f5e9 (border-bottom del SectionHeader)

gris inactivo:       #78909C
gris bg:             #ECEFF1   border: #B0BEC5   text: #37474F

naranja sin-curso:   #FF9800
naranja bg:          #FFF3E0   border: #FFCC80   text: #E65100

rojo eliminar:       #e53935
rojo bg:             #ffebee

subtítulo:           #6c757d
texto principal:     #495057
texto label:         #212529
```

---

## COMPONENTE SectionHeader (siempre incluirlo fuera del componente principal)

```jsx
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
```

---

## IMPORTS requeridos

```js
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Loading from '../../components/Loading';
import Error from '../../components/Error';
import axios from 'axios';
import { BASE_URL } from '../../helpers/BaseUrl';
import classNames from 'classnames';
import { addLocale } from 'primereact/api';
// Agregar solo los que se usen:
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Editor } from 'primereact/editor';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
```

---

## ESTADO (useState hooks)

```js
const [showError, setShowError] = useState(false);
const [xxxs, setXxxs] = useState(null);            // lista paginada
const [xxx, setXxx] = useState(emptyXxx);           // item en edición
const [xxxDialog, setXxxDialog] = useState(false);  // modal crear/editar
const [deleteXxxDialog, setDeleteXxxDialog] = useState(false); // modal eliminar
const [submitted, setSubmitted] = useState(false);
const [loading, setLoading] = useState(true);
const [loadingDatatable, setLoadingDatatable] = useState(false);
const [totalRecords, setTotalRecords] = useState(0);
const toast = useRef(null);
const dt = useRef(null);

// Filtros de la tabla
const [schoolYear, setSchoolYear] = useState(null);
const [schoolYears, setSchoolYears] = useState(null);
// Agregar otros filtros según la entidad

const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });
```

---

## addLocale (siempre en español, dentro del componente)

```js
addLocale('es', {
    firstDayOfWeek: 1,
    dayNames: ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],
    dayNamesShort: ['dom','lun','mar','mié','jue','vie','sáb'],
    dayNamesMin: ['D','L','M','X','J','V','S'],
    monthNames: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
    monthNamesShort: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],
    today: 'Hoy',
    clear: 'Claro'
});
```

---

## useEffects de carga

### Carga inicial (schoolYears + datos propios)
```js
useEffect(() => {
    setLoading(false);
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
    // cargar otros datos de apoyo (dropdowns) aquí
    loadSchoolYears();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

### Carga paginada (lazy)
```js
useEffect(() => {
    async function loadLazyData() {
        try {
            setLoadingDatatable(true);
            let url = `${BASE_URL}/api/xxx?page=${lazyParams.page + 1}`;
            if (schoolYear) url += `&schoolYearId=${schoolYear.id}`;
            // agregar otros filtros al URL
            await axios.get(url).then(({ data: { data: result } }) => {
                setTotalRecords(result.meta.pagination.total);
                setXxxs(result.data);
                setLoadingDatatable(false);
            });
        } catch (err) {
            console.warn('Hubo un problema con la carga de registros');
            setShowError(true);
            setLoadingDatatable(false);
        }
    }
    loadLazyData();
}, [lazyParams, schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps
```

---

## Handlers

```js
const onPage  = (event) => setLazyParams({ ...lazyParams, ...event });
const onSort  = (event) => setLazyParams({ ...lazyParams, ...event });
const onFilter = (e) => {
    const eventData = { filters: { search: { value: e.target.value } } };
    setLazyParams({ ...lazyParams, ...eventData, first: 0, page: 0 });
};

const openNew           = () => { setXxx(emptyXxx); setSubmitted(false); setXxxDialog(true); };
const hideDialog        = () => { setSubmitted(false); setXxxDialog(false); };
const hideDeleteDialog  = () => setDeleteXxxDialog(false);
const editXxx           = (_xxx) => { setXxx({ ..._xxx }); setXxxDialog(true); };
const confirmDeleteXxx  = (_xxx) => { setXxx({ id: _xxx.id, name: _xxx.nombre || _xxx.name }); setDeleteXxxDialog(true); };
const exportCSV         = () => dt.current.exportCSV();

const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setXxx(prev => ({ ...prev, [name]: val }));
};

async function saveXxx() {
    try {
        setSubmitted(true);
        if (!xxx.campoRequerido) return;
        if (xxx.id) {
            await axios.put(`${BASE_URL}/api/xxx/${xxx.id}`, xxx);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado', life: 3000 });
        } else {
            await axios.post(`${BASE_URL}/api/xxx`, xxx);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro agregado', life: 3000 });
        }
        setLazyParams({ ...lazyParams, page: 0 });
        setXxxDialog(false);
        setXxx(emptyXxx);
    } catch (error) {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al guardar el registro', life: 3000 });
    }
}

async function deleteXxx() {
    try {
        await axios.delete(`${BASE_URL}/api/xxx/${xxx.id}`);
        setLazyParams({ ...lazyParams, page: 0 });
        setDeleteXxxDialog(false);
        setXxx(emptyXxx);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado', life: 3000 });
    } catch (error) {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al eliminar el registro', life: 3000 });
    }
}
```

---

## TEMPLATES DE TABLA

### Avatar con iniciales (si la entidad tiene nombre)
```jsx
const avatarBodyTemplate = (rowData) => {
    const name = rowData.name_complete || rowData.nombre || rowData.name || '';
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
            boxShadow: '0 2px 6px rgba(58,181,74,0.3)', flexShrink: 0,
        }}>
            {initials}
        </div>
    );
};
```

### Status Tag
```jsx
const statusBodyTemplate = (rowData) => {
    if (rowData.status || rowData.active) {
        return <Tag severity="success" value="Activo" icon="pi pi-check-circle" />;
    }
    return <Tag severity="warning" value="Inactivo" icon="pi pi-minus-circle" />;
};
```

### Botones de acciones por fila
```jsx
const actionBodyTemplate = (rowData) => (
    <div className="p-d-flex" style={{ gap: '0.4rem' }}>
        <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-outlined p-button-success"
            onClick={() => editXxx(rowData)}
        />
        <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-outlined p-button-danger"
            onClick={() => confirmDeleteXxx(rowData)}
        />
    </div>
);
```

### Header de la DataTable (con título + buscador)
```jsx
const tableHeader = (
    <div className="p-d-flex p-ai-center" style={{ flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div className="p-d-flex p-ai-center" style={{ gap: '0.5rem' }}>
            <i className="pi pi-list" style={{ color: '#3ab54a', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1rem' }}>Lista de [entidades]</span>
        </div>
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" onInput={onFilter} placeholder="Buscar..." />
        </span>
    </div>
);
```

---

## FOOTERS DE DIÁLOGOS

```jsx
// Modal edición
const xxxDialogFooter = (
    <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
        <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDialog} />
        <Button label="Guardar" icon="pi pi-check" className="p-button-success" onClick={saveXxx} />
    </div>
);

// Modal eliminar
const deleteXxxDialogFooter = (
    <div className="p-d-flex p-jc-end" style={{ gap: '0.5rem' }}>
        <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={hideDeleteDialog} />
        <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteXxx} />
    </div>
);
```

---

## GUARDS (antes del return)

```jsx
if (loading) return <Loading />;
if (showError) return <Error mensaje={'Hubo un problema al cargar los registros'} />;
```

---

## ESTRUCTURA JSX COMPLETA

```jsx
return (
    <div className="p-grid crud-demo">
        <div className="p-col-12">

            {/* ── Page Header (FUERA del card) ─────────────────────── */}
            <div className="p-d-flex p-ai-center p-mb-3" style={{ gap: '1rem' }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, #3ab54a, #1a5c25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(58,181,74,0.35)',
                }}>
                    <i className="pi pi-[ICONO]" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                </div>
                <div>
                    <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2 }}>
                        [Título de la página]
                    </h2>
                    <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                        [Subtítulo descriptivo]
                    </p>
                </div>
            </div>

            {/* ── Card principal ───────────────────────────────────── */}
            <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                <Toast ref={toast} />

                {/* Toolbar: botón Nuevo + Exportar */}
                <div className="p-d-flex p-jc-between p-ai-center p-mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <Button
                        label="Nuevo [entidad]"
                        icon="pi pi-plus"
                        className="p-button-success"
                        onClick={openNew}
                        style={{ borderRadius: 8 }}
                    />
                    <Button
                        label="Exportar CSV"
                        icon="pi pi-download"
                        className="p-button-outlined p-button-secondary"
                        onClick={exportCSV}
                        style={{ borderRadius: 8 }}
                    />
                </div>

                {/* Filtros */}
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
                    {/* Agregar más filtros según la entidad */}
                    <div className="p-field p-col-12 p-md-3">
                        <label className="p-d-block" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}>Buscar</label>
                        <span className="p-input-icon-left" style={{ width: '100%' }}>
                            <i className="pi pi-search" />
                            <InputText type="search" onInput={onFilter} placeholder="Buscar..." style={{ width: '100%' }} />
                        </span>
                    </div>
                </div>

                {/* DataTable */}
                <DataTable
                    ref={dt}
                    value={xxxs}
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
                    header={tableHeader}
                    stripedRows
                    rowHover
                >
                    <Column body={avatarBodyTemplate} style={{ width: '56px', paddingLeft: '1rem' }} />
                    <Column field="id" header="ID" sortable style={{ width: '70px' }} />
                    {/* Columnas según la entidad */}
                    <Column body={statusBodyTemplate} header="Estado" style={{ width: '120px' }} />
                    <Column body={actionBodyTemplate} style={{ width: '110px' }} />
                </DataTable>

                {/* ── Modal crear/editar ───────────────────────────── */}
                <Dialog
                    visible={xxxDialog}
                    style={{ width: '90vw', maxWidth: '800px' }}
                    header={
                        <div className="p-d-flex p-ai-center" style={{ gap: '0.75rem' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: 'linear-gradient(135deg, #3ab54a, #2a8a36)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="pi pi-[ICONO]" style={{ color: '#fff', fontSize: '1rem' }}></i>
                            </div>
                            <span style={{ fontWeight: 700, color: '#1a3320', fontSize: '1.1rem' }}>
                                {xxx.id ? 'Editar [entidad]' : 'Nuevo [entidad]'}
                            </span>
                        </div>
                    }
                    modal
                    className="p-fluid"
                    footer={xxxDialogFooter}
                    onHide={hideDialog}
                >
                    {/* Sección de campos */}
                    <SectionHeader icon="pi-[ICONO]" title="[Título de sección]" />
                    <div className="p-fluid p-grid p-formgrid p-mb-4">
                        <div className="p-field p-col-12 p-md-6">
                            <label htmlFor="campo">Etiqueta</label>
                            <InputText
                                id="campo"
                                value={xxx.campo || ''}
                                onChange={(e) => onInputChange(e, 'campo')}
                                required
                                autoFocus
                                className={classNames({ 'p-invalid': submitted && !xxx.campo })}
                            />
                            {submitted && !xxx.campo && <small className="p-invalid">Etiqueta es requerida.</small>}
                        </div>
                    </div>
                </Dialog>

                {/* ── Modal eliminar ───────────────────────────────── */}
                <Dialog
                    visible={deleteXxxDialog}
                    style={{ width: '420px' }}
                    header={
                        <div className="p-d-flex p-ai-center" style={{ gap: '0.6rem' }}>
                            <i className="pi pi-exclamation-triangle" style={{ color: '#e53935', fontSize: '1.2rem' }}></i>
                            <span style={{ fontWeight: 700, color: '#1a3320' }}>Confirmar eliminación</span>
                        </div>
                    }
                    modal
                    footer={deleteXxxDialogFooter}
                    onHide={hideDeleteDialog}
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
                                ¿Eliminar <span style={{ color: '#e53935' }}>{xxx.name || xxx.nombre}</span>?
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
```

---

## CHIPS DE CONTEO (opcional, si la entidad tiene contadores útiles)

Colocar dentro del `header` de la DataTable, junto al título:

```jsx
{/* Chip activos */}
<div style={{
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    background: '#e8f5e9', border: '1.5px solid #a5d6a7',
    borderRadius: 20, padding: '0.3rem 0.85rem',
}}>
    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }} />
    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2e7d32' }}>{activeCount ?? '—'}</span>
    <span style={{ fontSize: '0.78rem', color: '#388e3c', fontWeight: 600 }}>Activos</span>
</div>

{/* Chip inactivos */}
<div style={{
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    background: '#ECEFF1', border: '1.5px solid #B0BEC5',
    borderRadius: 20, padding: '0.3rem 0.85rem',
}}>
    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#78909C', flexShrink: 0 }} />
    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#37474F' }}>{inactiveCount ?? '—'}</span>
    <span style={{ fontSize: '0.78rem', color: '#546E7A', fontWeight: 600 }}>Inactivos</span>
</div>
```

---

## PATRÓN Calendar con viewDate (para filtros con año lectivo)

Cuando la página tiene inputs de fecha tipo rango + schoolYear, usar:

```js
const [calViewDate, setCalViewDate] = useState(null);

useEffect(() => {
    if (schoolYear?.year) {
        setCalViewDate(new Date(Number(schoolYear.year), 0, 1));
    }
}, [schoolYear]); // eslint-disable-line react-hooks/exhaustive-deps
```

```jsx
<Calendar
    monthNavigator yearNavigator yearRange="2010:2050"
    appendTo={document.body}
    id="dateInit"
    value={dateInit || ''}
    viewDate={calViewDate || undefined}
    onViewDateChange={(e) => setCalViewDate(e.value)}
    onChange={(e) => setDateInit(e.target.value)}
    locale="es"
    dateFormat="dd/mm/yy"
/>
```

---

## REGLAS CRÍTICAS

1. **Page header SIEMPRE fuera del `<div className="card">`** — icono 48×48 gradiente verde + h2 + p subtítulo
2. **Card** siempre con `style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}`
3. **DataTable** siempre con `className="datatable-responsive datatable-compact"`, `stripedRows`, `rowHover`
4. **Botones de acción** de fila: `p-button-rounded p-button-outlined p-button-success` (editar) y `p-button-rounded p-button-outlined p-button-danger` (eliminar)
5. **Botones de toolbar**: `p-button-success` (Nuevo) y `p-button-outlined p-button-secondary` (Exportar), ambos con `style={{ borderRadius: 8 }}`
6. **Footer de modales**: siempre `p-button-outlined p-button-secondary` (Cancelar) y `p-button-success` (Guardar) / `p-button-danger` (Eliminar)
7. **Modal editar**: header con div 36×36 gradiente verde + texto `{xxx.id ? 'Editar...' : 'Nuevo...'}`
8. **Modal eliminar**: ancho 420px, header con `pi-exclamation-triangle` rojo, body con círculo 48×48 rojo `#ffebee` + `pi-trash` + texto confirmación
9. **SectionHeader** para separar secciones dentro del modal (nunca `<h5>` ni `<hr>`)
10. **Filtros** en `p-fluid p-formgrid p-grid p-mb-3` fuera de la tabla, dentro del card
11. **schoolYear** por defecto = ciclo activo (encontrar con `years.find(y => y.active === true)`)
12. **schoolYearId** siempre en la URL del `loadLazyData` y en el dependency array del `useEffect`
13. **Nunca** usar `Toolbar` de PrimeReact — usar `div` con `p-d-flex p-jc-between`
14. **Nunca** `p-button-text` en footers — usar `p-button-outlined p-button-secondary`
15. **Labels de filtros** con `style={{ fontSize: '0.82rem', fontWeight: 600, color: '#495057' }}`
16. **Archivo**: `src/pages/[modulo]/[entidad]Page.js`
17. Usar español en todos los labels, mensajes y placeholders
18. Separar `loading` (pantalla completa) de `loadingDatatable` (spinner de tabla)
19. `appendTo={document.body}` siempre en `Dropdown` y `Calendar` dentro de modales
