import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function SignUp() {

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim() || !company.trim() ||
            !password.trim()  || !email.trim() ) {
            setErrorMessage('Please enter require fields.');
            return; // Prevent login when input fields are empty
        }

        try {
        const response = await axios.post('http://example.com/api/signup', {
            firstName,
            lastName,
            company,
            email,
            password,
        });

        // Assuming the server returns a success message
        console.log(response.data);
        
        // Reset the form fields and error message
        setFirstName('');
        setLastName('');
        setCompany('');
        setEmail('');
        setPassword('');
        setErrorMessage('');
        } catch (error) {
        // Handle error from the server
        console.error('Error during sign-up:', error);
        setErrorMessage('An error occurred during sign-up. Please try again later.');
        }
    };

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
                        <label>First Name</label>
                        <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g Jane"
                        onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="form-group m-4">
                        <label>Last Name</label>
                        <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g Doe"
                        onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <div className="form-group m-4">
                        <label>Company</label>
                        <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="Company Name"
                        onChange={(e) => setCompany(e.target.value)}
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
}