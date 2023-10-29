import { useContext } from "react";
import { ProfileContext } from "../common/profilecontext";
import { Outlet, Navigate } from 'react-router-dom';

export default function ProtectedRoute({ element: Element }) {
    const { profile, setProfile } = useContext(ProfileContext);

    if (!profile){
        setProfile(JSON.parse(localStorage.getItem("profile")));
    }

    const isAuthenticated = !!profile;
    console.log(profile);
    console.log(JSON.parse(localStorage.getItem("profile")));

    return isAuthenticated? <Outlet /> : <Navigate to="/login" />;
}