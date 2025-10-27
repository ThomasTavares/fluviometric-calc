import { JSX } from 'react';

import Typography from '@mui/material/Typography';

import { MainScreenProps } from '../../interfaces/MainInterface';

function HomeScreen(props: MainScreenProps): JSX.Element {
    let stationName: string | null = null;
    if (props.stationData) stationName = props.stationData.stationName;
    
    return (
        <>
            <Typography variant='h4'>Bem-vindo ao Sistema!</Typography>
            <Typography variant='body1'>
                Estação Selecionada: {(stationName) ? stationName : props.stationData?.stationCode}
            </Typography>
        </>
    );
}

export default HomeScreen;