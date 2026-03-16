import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import axios from 'axios';
import { BASE_URL } from '../../../helpers/BaseUrl';
import Error from '../../../components/Error';

export default function InterestRate() {
    const toast = useRef(null);
    const [interestRate, setInterestRate] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showError, setShowError] = useState(false);

    const font = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    useEffect(() => {
        loadInterestRate();
    }, []);

    const loadInterestRate = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${BASE_URL}/api/settings/interest-rate`);
            setInterestRate(data.interest_rate ?? 0);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setShowError(true);
            setLoading(false);
        }
    };

    const saveInterestRate = async () => {
        try {
            setSaving(true);
            await axios.put(`${BASE_URL}/api/settings/interest-rate`, {
                interest_rate: interestRate,
            });
            toast.current.show({
                severity: 'success',
                summary: 'Guardado',
                detail: `Tope de interés actualizado a ${formatCurrency(interestRate)}`,
                life: 3000,
            });
            setSaving(false);
        } catch (err) {
            console.error(err);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Hubo un problema al guardar el tope de interés',
                life: 3000,
            });
            setSaving(false);
        }
    };

    if (showError) {
        return <Error mensaje={'Hubo un problema al cargar la configuración de interés'} />;
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
                        <i className="pi pi-percentage" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h2 className="p-m-0" style={{ color: '#1a3320', fontWeight: 800, fontSize: '1.45rem', lineHeight: 1.2, ...font }}>
                            Tope de interés
                        </h2>
                        <p className="p-m-0" style={{ color: '#6c757d', fontSize: '0.875rem', ...font }}>
                            Monto fijo de mora que se suma por cada cuota vencida
                        </p>
                    </div>
                </div>

                <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: 'none' }}>
                    <Toast ref={toast} />

                    {loading && (
                        <div className="p-d-flex p-ai-center p-jc-center p-py-4">
                            <i className="pi pi-spin pi-spinner" style={{ color: '#3ab54a', fontSize: '1.5rem', marginRight: 8 }} />
                            <span style={{ color: '#6c757d', fontSize: '0.9rem', fontWeight: 500, ...font }}>Cargando configuración...</span>
                        </div>
                    )}

                    {!loading && (
                        <div style={{ maxWidth: 500 }}>
                            {/* Info box */}
                            <div style={{
                                background: '#e3f2fd', borderRadius: 10, padding: '1rem 1.2rem',
                                border: '1px solid #90caf9', marginBottom: '1.5rem'
                            }}>
                                <div className="p-d-flex p-ai-start" style={{ gap: '0.6rem' }}>
                                    <i className="pi pi-info-circle" style={{ color: '#1565c0', fontSize: '1rem', marginTop: 2 }} />
                                    <div style={{ fontSize: '0.85rem', color: '#1565c0', lineHeight: 1.5, ...font }}>
                                        Este monto se aplica como <strong>mora fija</strong> por cada mes vencido.
                                        Si un alumno adeuda varios meses, se suma este monto por cada uno.
                                        Al modificar este valor, se actualiza automáticamente para todos los deudores.
                                    </div>
                                </div>
                            </div>

                            {/* Input */}
                            <div className="p-field" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="interestRate" style={{
                                    display: 'block', fontSize: '0.9rem', fontWeight: 700,
                                    color: '#1a3320', marginBottom: 8, ...font
                                }}>
                                    Monto de interés por mora
                                </label>
                                <InputNumber
                                    id="interestRate"
                                    value={interestRate}
                                    onValueChange={(e) => setInterestRate(e.value)}
                                    mode="currency"
                                    currency="ARS"
                                    locale="es-AR"
                                    minFractionDigits={0}
                                    maxFractionDigits={2}
                                    min={0}
                                    style={{ width: '100%' }}
                                />
                                <small style={{ color: '#6c757d', fontSize: '0.8rem', ...font }}>
                                    Este monto se suma a cada cuota mensual vencida.
                                </small>
                            </div>

                            {/* Preview */}
                            {interestRate > 0 && (
                                <div style={{
                                    background: '#fff3e0', borderRadius: 10, padding: '0.8rem 1rem',
                                    border: '1px solid #ffe082', marginBottom: '1.5rem'
                                }}>
                                    <div style={{ fontSize: '0.82rem', color: '#e65100', fontWeight: 600, marginBottom: 4, ...font }}>
                                        Ejemplo de cálculo
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#5d4037', ...font }}>
                                        Si un alumno debe <strong>2 meses</strong> con cuota de <strong>{formatCurrency(10000)}</strong>:
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#5d4037', marginTop: 4, ...font }}>
                                        Mora por mes: <strong>{formatCurrency(interestRate)}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#5d4037', marginTop: 2, ...font }}>
                                        Mora total (2 meses): <strong>{formatCurrency(2 * interestRate)}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#c62828', fontWeight: 700, marginTop: 4, ...font }}>
                                        Total a pagar: {formatCurrency(2 * 10000 + 2 * interestRate)}
                                    </div>
                                </div>
                            )}

                            {/* Save button */}
                            <Button
                                label={saving ? 'Guardando...' : 'Guardar'}
                                icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                                className="p-button-success"
                                onClick={saveInterestRate}
                                disabled={saving}
                                style={{ borderRadius: 8 }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
