import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../helpers/BaseUrl';

const CACHE_KEY = 'school_year_current';
const CACHE_TTL = 60 * 60 * 1000;

export default function YearAcademic() {
    const [year, setYear] = useState(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.value;
            }
        } catch (_) {}
        return null;
    });

    useEffect(() => {
        if (year !== null) return;
        async function load() {
            try {
                const { data: result } = await axios.get(`${BASE_URL}/api/schoolYears/current`);
                const value = result.data.year;
                setYear(value);
                localStorage.setItem(CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() }));
            } catch (error) {
                console.warn('Hubo un problema con la carga del año lectivo');
            }
        }
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!year) return null;

    return (
        <div className="topbar-year">
            <i className="pi pi-calendar" />
            <span>{year}</span>
        </div>
    );
}
