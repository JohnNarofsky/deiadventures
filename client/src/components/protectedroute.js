import { useContext } from "react";
import { ProfileContext } from "../common/profilecontext";
import { Outlet, Navigate } from 'react-router-dom';

export default function ProtectedRoute({ element: Element }) {
    const { profile } = useContext(ProfileContext);

    const isAuthenticated = !!profile;

    return isAuthenticated? <Outlet /> : <Navigate to="/login" />;
}