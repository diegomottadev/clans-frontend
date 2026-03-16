import React from 'react';
// import '../layout/sass/_splash.scss'; // or `.scss` if you chose scss
import { ProgressBar } from 'primereact/progressbar';

export default function Loading(){
    return (
        <div style={{position: 'absolute', left: '50%', top: '50%',transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3ab54a', marginBottom: '0.75rem', display: 'block' }}></i>
            <h3 style={{display: 'flex', justifyContent: 'center', margin: '0 0 0.5rem 0'}}><strong>Cargando</strong></h3>
            <ProgressBar mode="indeterminate" style={{ height: '4px', width: '200px' }}></ProgressBar>
        </div>

        //<div className="Loading">
        //    <div className="Loading__dot-1"></div>      
        //    <div className="Loading__dot-2"></div>      
        //    <div className="Loading__dot-3"></div>      
        //</div> 
        // <div class="splash-screen">
        //     <div class="splash-container">
        //         <div class="splash-double-bounce1"></div>
        //         <div class="splash-double-bounce2"></div>
        //     </div>
        // </div>
    );
}