import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Navigate } from "react-router-dom";
import api_config from '../api_config.json';

export default function ForgotPassword() {

    const [reset,setReset] = useState(false);
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();

        if (!email.trim() ) {
            setErrorMessage('Please enter require fields.');
            return; // Prevent login when input fields are empty
        }

        const resetData = {email: email};
        axios.post(api_config.baseURL + "/auth/account/forgot-password", resetData)
        .then(() => {
            setReset(true);
        })
        .catch((error) => {
            setErrorMessage("Server Unreachable");
        })
        ;
    };

    if (!reset){
    return(
        <div className="Auth-form-container">
            <form className="Auth-form" onSubmit={handleReset}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title text-center">Send a Reset Password</h3>
                    <p className="text-center mt-3">If the email address exists in the system you will be receiving an email with a new password in the email.</p>
                    <p className="text-center mt-3">This email should arrive within the next hour.</p>
                    <div className="text-center mt-3">
                        Already registered?{" "}
                        <Link to="/login">Login</Link>
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
                    <div className="d-grid gap-2 m-4">
                        <button type="submit" className="btn btn-primary">
                        Submit
                        </button>
                    </div>
                </div>
            </form>
            {errorMessage && <h3 className='text-center'>{errorMessage}</h3>}

        </div>
    )    
    } else {
        return <Navigate replace to="/login" />
    }
}