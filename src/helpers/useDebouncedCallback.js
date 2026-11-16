import { useEffect, useMemo, useRef } from 'react';

/**
 * Devuelve una función que ejecuta `fn` recién cuando pasan `delay` ms sin
 * nuevas llamadas. Siempre usa la versión más reciente de `fn` (estado actual),
 * así se evita una petición por tecla y que llegue un resultado viejo al final.
 */
export function useDebouncedCallback(fn, delay = 400) {
    const fnRef = useRef(fn);
    const timerRef = useRef(null);
    fnRef.current = fn;

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return useMemo(() => (...args) => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    }, [delay]);
}
