/**
 * Parámetros de orden para tablas lazy (paginadas en el servidor).
 * PrimeReact guarda sortField / sortOrder (1 asc, -1 desc) en lazyParams;
 * el backend los recibe como sort_by / sort_order.
 */
export function sortQuery(lazyParams) {
    if (!lazyParams || !lazyParams.sortField) {
        return '';
    }
    const order = lazyParams.sortOrder === -1 ? 'desc' : 'asc';
    return `&sort_by=${encodeURIComponent(lazyParams.sortField)}&sort_order=${order}`;
}

/** Igual que sortQuery pero sobre un URLSearchParams. */
export function appendSortParams(params, lazyParams) {
    if (lazyParams && lazyParams.sortField) {
        params.set('sort_by', lazyParams.sortField);
        params.set('sort_order', lazyParams.sortOrder === -1 ? 'desc' : 'asc');
    }
    return params;
}
