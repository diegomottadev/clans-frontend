import React, { Component } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

export class Spinner extends Component {

    render() {
        return (
            <div>
                <ProgressSpinner style={{width: '15px', height: '15px', justifyContent: 'center' }} strokeWidth="8"  animationDuration=".5s"/>    
            </div>
        );
    }
}