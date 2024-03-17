import React, { createContext, useState } from 'react';
import axios from 'axios';


function set_auth_session(session) {
    if (session !== null) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const old_session_text = localStorage.getItem("login_session");
    const old_session = old_session_text !== null ? JSON.parse(old_session_text) : null;
    set_auth_session(old_session);
    const [session, setSessionInner] = useState(old_session);

    const setSession = (session) => {
        localStorage.setItem("login_session", JSON.stringify(session));
        set_auth_session(session);
        setSessionInner(session);
    };

    return (
        <AuthContext.Provider value={{ session, setSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
