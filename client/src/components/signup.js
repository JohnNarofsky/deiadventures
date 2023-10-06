import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Navigate } from "react-router-dom";
import api_config from '../api_config.json';

export default function SignUp() {

    const [created,setCreated] = useState('no');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!userName.trim() || !password.trim()  || !email.trim() ) {
            setErrorMessage('Please enter require fields.');
            return; // Prevent login when input fields are empty
        }

        try {
            const signup = {name: userName, email: email, password: password};
            axios.post(api_config.baseURL + "/auth/account", signup).then((response) => {
                setCreated('yes');
            });

        } catch (error) {
        // Handle error from the server
        console.error('Error during sign-up:', error);
        setErrorMessage('An error occurred during sign-up. Please try again later.');
        }
    };

    if (created === 'no'){
    return(
        <div className="Auth-form-container">
            <form className="Auth-form" onSubmit={handleSignUp}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title text-center">Sign Up Your DEI Journey Here</h3>
                    <div className="text-center mt-3">
                        Already registered?{" "}
                        <Link to="/login">Login</Link>
                    </div>
                    <div className="form-group m-4">
                        <label>Name</label>
                        <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g Jane"
                        onChange={(e) => setUserName(e.target.value)}
                        />
                    </div>
                    <div className="form-group m-4">
                        <label>Email address</label>
                        <input
                        type="email"
                        className="form-control mt-1"
                        placeholder="Email Address"
                        onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group m-4">
                        <label>Password</label>
                        <input
                        type="password"
                        className="form-control mt-1"
                        placeholder="Password"
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
            {errorMessage && <p className="error-message text-center fw-bold">{errorMessage}</p>}
        </div>
    )    
    } else {
        return <Navigate replace to="/login" />
    }
}