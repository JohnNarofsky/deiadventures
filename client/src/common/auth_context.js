// TODO: determine if AuthProvider is the right name, as opposed to something like DeiProvider, ApiProvider, DeiApiProvider, or something else
import React, { createContext, useState } from 'react';
import axios from 'axios';
import api_config from '../api_config.json';

const deiClient = axios.create({
    baseURL: api_config.baseURL,
});

function set_auth_session(session) {
    if (session !== null) {
        // axios.defaults.headers.common['Authorization'] = `Bearer ${session.token}`;
        deiClient.defaults.headers.common['Authorization'] = `Bearer ${session.token}`;
    } else {
        // delete axios.defaults.headers.common['Authorization'];
        delete deiClient.defaults.headers.common['Authorization'];
    }
}

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const old_session_text = localStorage.getItem("login_session");
    const old_session = old_session_text !== null ? JSON.parse(old_session_text) : null;
    set_auth_session(old_session);
    console.log(deiClient);
    const [session, setSessionInner] = useState(old_session);

    const setSession = (session) => {
        localStorage.setItem("login_session", JSON.stringify(session));
        set_auth_session(session);
        setSessionInner(session);
    };

    return (
        <AuthContext.Provider value={{ session, setSession, deiClient }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
