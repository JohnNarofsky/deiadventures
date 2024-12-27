import { useState, useEffect, useContext} from 'react';
//import { useGoogleLogin } from '@react-oauth/google';
import './login.css'
import axios from 'axios';
import { ProfileContext } from '../common/profilecontext';
import { Navigate, Link } from 'react-router-dom';
import api_config from '../api_config.json';

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [ user, setUser ] = useState(null);
    const [ errorMessage, setErrorMessage ] = useState('');
    const {profile, setProfile } = useContext(ProfileContext);
    const loginFailMessage = 'Login Failed! Please Try Again!';

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setErrorMessage('Please enter your login credential.');
            return; // Prevent login when input fields are empty
        }
        
        try {
            const login = {"email": email, "password": password};

            axios.post(api_config.baseURL + "/auth/login", login).then((response) => {
                axios.get(api_config.baseURL + "/user/"+response.data.id).then((response) => {
                    const data = {
                        id: response.data.id,
                        permissions: response.data.permissions
                    };
                    setProfile(data);
                    localStorage.setItem("profile", JSON.stringify(data));
                    });
            });
        } catch (error) {
            // if unsuccessful login, redirect to "login page" again.
            console.error('Error during login:', error);
            setErrorMessage(loginFailMessage);
        }
    };
    
    if(!profile){
        return (
            <>
                <div className="Auth-form-container">
                    <form className="Auth-form" onSubmit={handleLogin}>
                        <div className="Auth-form-content">
                            <h3 className="text-center Auth-form-title">Login Into Your DEI Journey Here</h3>
                            <div className="text-center m-4">
                                Haven't registered?{" "}
                                <Link to="/signup">Sign Up</Link>
                            </div>
                            <div className="text-center m-4">
                                Forgot password?{" "}
                                <Link to="/forgotpassword">Yes, Please let me reset it</Link>
                            </div>
                            <div className="form-group m-4">
                                <label>Email address</label>
                                <input
                                type="email"
                                className="form-control mt-1"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group m-4">
                                <label>Password</label>
                                <input
                                type="password"
                                className="form-control mt-1"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="d-grid gap-2 m-4">
                                <button type="submit" className="btn btn-primary">
                                Submit
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                {errorMessage && <h3 className='text-center'>{errorMessage}</h3>}
            </>
        )
    } else {
        return <Navigate replace to="/MyAdventures" />
    }

}