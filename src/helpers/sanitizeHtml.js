// SecDevOps (OWASP A03 - XSS): sanea HTML del editor (observaciones) antes de
// renderizarlo con dangerouslySetInnerHTML. Lista blanca de etiquetas de formato
// y sin atributos (se descartan on*, style, href, src...). Sin dependencias.
const ALLOWED_TAGS = new Set([
    'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI',
    'SPAN', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE',
]);
// Etiquetas cuyo contenido se descarta por completo
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

function cleanNode(node, doc) {
    const out = doc.createDocumentFragment();
    node.childNodes.forEach((child) => {
        if (child.nodeType === 3) { // texto
            out.appendChild(doc.createTextNode(child.textContent));
        } else if (child.nodeType === 1) { // elemento
            const tag = child.tagName.toUpperCase();
            if (DROP_WITH_CONTENT.has(tag)) return;
            const inner = cleanNode(child, doc);
            if (ALLOWED_TAGS.has(tag)) {
                const el = doc.createElement(tag.toLowerCase());
                el.appendChild(inner);
                out.appendChild(el);
            } else {
                out.appendChild(inner); // se conserva el texto, se quita la etiqueta
            }
        }
    });
    return out;
}

export function sanitizeHtml(html) {
    if (html === null || html === undefined || html === '') return '';
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return String(html).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    // DOMParser con text/html no ejecuta scripts ni carga recursos
    const parsed = new window.DOMParser().parseFromString(String(html), 'text/html');
    const container = document.createElement('div');
    container.appendChild(cleanNode(parsed.body, document));
    return container.innerHTML;
}

export default sanitizeHtml;
