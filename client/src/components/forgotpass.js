import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Navigate } from "react-router-dom";
import api_config from '../api_config.json';

export default function ForgotPass() {

    const [checked,getChecked] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleForgotPass = async (e) => {
        e.preventDefault();

        if (!userName.trim() ||  !email.trim() ) {
            setErrorMessage('Please enter require fields.');
            return; 
        }

        try {
            const checkuser = {name: userName, email: email};
            axios.get(api_config.baseURL + "/auth/account", checkuser).then((response) => {
                getChecked('yes');
            });

        } catch (error) {
        // Handle error from the server
        console.error('Error during sign-up:', error);
        setErrorMessage('This email is not in our system.');
        }
    };

    if (checked === ''){
    return(
        <div className="Auth-form-container">
            <form className="Auth-form" onSubmit={handleForgotPass}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title text-center">Type in Your Information to Reset Your Password</h3>
                    <div className="text-center mt-3">
                        Not Signed Up?{" "}
                        <Link to="/signup">Sign Up</Link>
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
                        placeholder="e.g jane.doe@email.com"
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
            {errorMessage && <p className="error-message text-center fw-bold">{errorMessage}</p>}
        </div>
    )    
    } else {
        return <Navigate replace to="/login" />
    }
}