---
name: make-responsive
description: Hace una página o componente responsive usando PrimeFlex 2.0.0 y PrimeReact 6.1.0. Usar cuando el usuario pide que algo sea responsive, adaptable a mobile, o que se vea bien en distintos tamaños de pantalla.
argument-hint: "[archivo o descripción del componente a hacer responsive]"
---

# Skill: Make Responsive — clans-view

Hace componentes y páginas responsive usando **PrimeFlex 2.0.0** y **PrimeReact 6.1.0**, los que usa este proyecto.

---

## Breakpoints de PrimeFlex 2.0.0

| Prefijo | Breakpoint       | Uso típico        |
|---------|-----------------|-------------------|
| (none)  | Todos los tamaños | Mobile first base |
| `p-sm-` | ≥ 576px         | Móvil grande      |
| `p-md-` | ≥ 768px         | Tablet            |
| `p-lg-` | ≥ 992px         | Desktop           |
| `p-xl-` | ≥ 1200px        | Pantalla grande   |

---

## 1. Sistema de Grid (`p-grid` + `p-col-*`)

El grid divide el espacio en **12 columnas**.

```jsx
<div className="p-grid">
    {/* Siempre 12 cols (full width) */}
    <div className="p-col-12"> ... </div>

    {/* Full en mobile, mitad en tablet+ */}
    <div className="p-col-12 p-md-6"> ... </div>

    {/* Full en mobile, un tercio en desktop */}
    <div className="p-col-12 p-md-6 p-lg-4"> ... </div>

    {/* Full en mobile, cuarto en desktop grande */}
    <div className="p-col-12 p-sm-6 p-md-4 p-lg-3"> ... </div>
</div>
```

### Patrones comunes de grid responsivo

```jsx
{/* Formulario: 1 columna en mobile, 2 en tablet */}
<div className="p-grid p-formgrid">
    <div className="p-field p-col-12 p-md-6">...</div>
    <div className="p-field p-col-12 p-md-6">...</div>
</div>

{/* Cards: 1 col → 2 col → 3 col → 4 col */}
<div className="p-grid">
    <div className="p-col-12 p-sm-6 p-lg-4 p-xl-3"> ... </div>
</div>

{/* Panel centrado (login, formularios simples) */}
<div className="p-d-flex p-jc-center p-ai-center" style={{ minHeight: '100vh' }}>
    <div className="p-col-12 p-sm-8 p-md-6 p-lg-4 p-xl-3">
        ...
    </div>
</div>
```

---

## 2. Flexbox Utilities

### Display y dirección
```jsx
className="p-d-flex"           // display: flex
className="p-d-inline-flex"    // display: inline-flex
className="p-flex-row"         // flex-direction: row
className="p-flex-column"      // flex-direction: column
// Responsive: p-flex-row → p-md-flex-column
className="p-flex-row p-md-flex-column"
```

### Alineación principal (justify-content)
```jsx
className="p-jc-start"    // justify-content: flex-start
className="p-jc-end"      // justify-content: flex-end
className="p-jc-center"   // justify-content: center
className="p-jc-between"  // justify-content: space-between
className="p-jc-around"   // justify-content: space-around
className="p-jc-evenly"   // justify-content: space-evenly
```

### Alineación cruzada (align-items)
```jsx
className="p-ai-start"    // align-items: flex-start
className="p-ai-end"      // align-items: flex-end
className="p-ai-center"   // align-items: center
className="p-ai-stretch"  // align-items: stretch
className="p-ai-baseline" // align-items: baseline
```

### Wrap y grow
```jsx
className="p-flex-wrap"        // flex-wrap: wrap
className="p-flex-nowrap"      // flex-wrap: nowrap
className="p-flex-1"           // flex: 1
className="p-flex-grow-1"      // flex-grow: 1
```

### Centrar perfectamente en pantalla (patrón login/modal)
```jsx
<div className="p-d-flex p-jc-center p-ai-center" style={{ minHeight: '100vh' }}>
    <div className="p-col-12 p-sm-8 p-md-6 p-lg-4">
        {/* contenido centrado */}
    </div>
</div>
```

---

## 3. Spacing Utilities (margin y padding)

### Formato: `p-{propiedad}{lado}-{tamaño}`
- Propiedades: `m` (margin), `p` (padding)
- Lados: `t` top, `b` bottom, `l` left, `r` right, `x` horizontal, `y` vertical, vacío = todos
- Tamaños: `0` a `6`

```jsx
className="p-mt-2"    // margin-top: 0.5rem
className="p-mb-4"    // margin-bottom: 1rem
className="p-px-3"    // padding-left + padding-right: 0.75rem
className="p-py-2"    // padding-top + padding-bottom: 0.5rem
className="p-m-0"     // margin: 0
className="p-p-3"     // padding: 0.75rem
```

### Con breakpoint
```jsx
className="p-mb-2 p-md-mb-4"   // mb pequeño en mobile, grande en tablet+
className="p-p-2 p-lg-p-4"     // padding según pantalla
```

---

## 4. Display por breakpoint (mostrar/ocultar)

```jsx
// Ocultar en mobile, mostrar en desktop
className="p-d-none p-md-d-block"

// Mostrar solo en mobile
className="p-d-block p-md-d-none"

// Flex solo en tablet+
className="p-d-none p-md-d-flex"
```

---

## 5. Text Utilities

```jsx
className="p-text-center"   // text-align: center
className="p-text-left"     // text-align: left
className="p-text-right"    // text-align: right
className="p-text-bold"     // font-weight: bold
className="p-text-italic"   // font-style: italic

// Con breakpoint
className="p-text-left p-md-text-center"
```

---

## 6. Width/Height

```jsx
className="p-w-full"   // width: 100%
className="p-h-full"   // height: 100%
```

---

## 7. Componentes PrimeReact con props responsive

### Dialog — breakpoints para width
```jsx
// Ancho responsivo con breakpoints
<Dialog
    style={{ width: '50vw' }}
    breakpoints={{ '960px': '75vw', '640px': '100vw' }}
    ...
>
```

### DataTable — responsive stacking en mobile
El proyecto ya tiene definidos estilos en App.scss para `.datatable-responsive`.
Aplicar `className="datatable-responsive"` en el DataTable para que las filas se apilen en mobile.

```jsx
<DataTable className="datatable-responsive" ...>
    <Column field="nombre" header="Nombre" body={(rowData) => (
        <>
            <span className="p-column-title">Nombre</span>
            {rowData.nombre}
        </>
    )} />
</DataTable>
```

### Toolbar — wrap automático en mobile
```jsx
// En App.scss ya hay: .p-toolbar { flex-wrap: wrap }
// Usar className="p-mb-4" en el Toolbar para espaciado
<Toolbar className="p-mb-4" left={leftTemplate} right={rightTemplate} />
```

---

## 8. Patrones de páginas frecuentes

### Página de autenticación / login centrado
```jsx
return (
    <div className="p-d-flex p-jc-center p-ai-center" style={{ minHeight: '100vh' }}>
        <div className="p-col-12 p-sm-8 p-md-6 p-lg-4 p-xl-3">
            <Panel header="Título">
                <div className="p-fluid">
                    <div className="p-field">...</div>
                    <Button label="Acción" className="p-mt-2" />
                </div>
            </Panel>
        </div>
    </div>
);
```

### Formulario en dos columnas (desktop), una columna (mobile)
```jsx
<div className="p-fluid p-grid p-formgrid">
    <div className="p-field p-col-12 p-md-6">
        <label>Campo 1</label>
        <InputText />
    </div>
    <div className="p-field p-col-12 p-md-6">
        <label>Campo 2</label>
        <InputText />
    </div>
    {/* Campo que siempre ocupa todo el ancho */}
    <div className="p-field p-col-12">
        <label>Observaciones</label>
        <InputTextarea />
    </div>
</div>
```

### Header de tabla responsivo (título + buscador)
```jsx
// En App.scss ya está definido .crud-demo .table-header con flex-direction: row en ≥768px
const header = (
    <div className="table-header">
        <h5 className="p-m-0">Título</h5>
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" placeholder="Buscar..." />
        </span>
    </div>
);
```

### Dashboard con cards responsivos
```jsx
<div className="p-grid">
    <div className="p-col-12 p-md-6 p-lg-3">
        <div className="card">Stat 1</div>
    </div>
    <div className="p-col-12 p-md-6 p-lg-3">
        <div className="card">Stat 2</div>
    </div>
</div>
```

---

## 9. Anti-patrones a evitar

| Evitar | Usar en su lugar |
|--------|-----------------|
| `style={{ width: '25vw' }}` fijo | `p-col-12 p-md-6 p-lg-4` |
| `position: fixed` para centrar | `p-d-flex p-jc-center p-ai-center` |
| Clases sin prefijo `p-` (flex, grid, col) | Siempre con prefijo `p-` en PrimeFlex 2 |
| `p-mr-*` en el último elemento de una fila | Solo aplicar margin-right a elementos intermedios |
| Ancho fijo en `vw` en Dialogs en mobile | Usar `breakpoints` prop del Dialog |

---

## Proceso para hacer responsive un componente

1. **Leer el archivo actual** para entender su estructura
2. **Identificar los problemas** de responsividad:
   - Anchos fijos en `px` o `vw` sin breakpoints
   - Centrado con `position: fixed` en lugar de flexbox
   - Grids sin clases responsivas (`p-col-12` sin `p-md-*`)
   - Dialogs sin `breakpoints` prop
3. **Aplicar la solución** usando los patrones de PrimeFlex 2.0.0 de arriba
4. **Verificar** que el código resultante usa solo clases con prefijo `p-`
