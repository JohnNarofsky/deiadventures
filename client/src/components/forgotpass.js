import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Navigate } from "react-router-dom";
import api_config from '../api_config.json';

export default function ForgotPass() {

    const [checked,setChecked] = useState('no');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleForgotPass = async (e) => {
        e.preventDefault();

        if (!email.trim() ) {
            setErrorMessage('Please enter require fields.');
            return; 
        }
        try {

        const login = {"email": email};

        axios.post(api_config.baseURL + "/auth/login", login).then((response) => {
            localStorage.setItem("user", response.data.id);
            axios.get(api_config.baseURL + "/user/"+response.data.id).then((response) => {
                    setChecked('yes')
                });
            // need to figure out next steps for after check it complete 
            });
        } catch (error) {
        setErrorMessage('This email is not in our system.');
        }
    };

    if (checked === 'no'){
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