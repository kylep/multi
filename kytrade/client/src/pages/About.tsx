import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';


export default function About() {
    const [version, setVersion] = useState('unknown')
    const httpGetVersion = () => {
        axios.get('/api/version')
        .then((response) => {
            setVersion(response.data.version)
        })
    }
    useEffect(() => {httpGetVersion()}, [])
    return (
        <Container>
            <h2>About</h2>
            <Divider />
            <strong>Version: {version}</strong>
        </Container>
    )
}

