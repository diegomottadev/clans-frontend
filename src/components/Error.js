import React, {  useEffect, useRef } from 'react';
import { Messages } from 'primereact/messages';
export default function Error({mensaje}){

    const msgs1 = useRef(null);

    useEffect(() => {
        if(mensaje){
        msgs1.current.show([
            { severity: 'error', summary:  mensaje, sticky:true,closable:false }
        ]);
        }
    }, [mensaje]); //
    
    if(!mensaje){
        return null;
    }
    return (

        
        <div>
            <Messages ref={msgs1} /> 
        </div>
    )

}