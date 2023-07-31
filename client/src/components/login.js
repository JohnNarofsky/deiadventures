import { useState, useEffect, useContext} from 'react';
//import { useGoogleLogin } from '@react-oauth/google';
import './login.css'
import axios from 'axios';
import { ProfileContext } from '../common/profilecontext';
import { Navigate, Link } from 'react-router-dom';

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [ user, setUser ] = useState(null);
    const [ errorMessage, setErrorMessage ] = useState('');
    const {profile, setProfile, setUsedGoogleLogin} = useContext(ProfileContext);
    const loginFailMessage = 'Login Failed! Please Try Again!';

    // const loginWithGoogle = useGoogleLogin({
    //     onSuccess: (codeResponse) => {
    //         setUser(codeResponse);
    //         setUsedGoogleLogin(true);
    //         // regiester with our server???
    //     },
    //     onError: (error) => {
    //         console.log('Login Failed:', error);
    //         setErrorMessage(loginFailMessage);
    //     }
    // });
    // useEffect(
    //     () => {
    //         if (user) {
    //             axios
    //                 .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
    //                     headers: {
    //                         Authorization: `Bearer ${user.access_token}`,
    //                         Accept: 'application/json'
    //                     }
    //                 })
    //                 .then((res) => {
    //                     console.log(res)
    //                     setProfile(res.data);
    //                     // use this to develope the cookie session with server?
    //                 })
    //                 .catch((err) => console.log(err));
    //         }
    //     },
    //     [ user ]
    // );

    const baseURL="https://testdei.narofsky.org/api";

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setErrorMessage('Please enter your login credential.');
            return; // Prevent login when input fields are empty
        }
        
        try {
            // const response = await fetch('http://localhost:5000/api/login', { //change the url for response
            //     method: 'POST',
            //     headers: {
            //     'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ email, password }),
            // });
        
            // const data = await response.json();

            const login = {"email": email, "password": password};

            axios.post(baseURL + "/auth/login", login).then((response) => {
                localStorage.setItem("user", response.data.id);

                const data = {
                    id: response.data.id
                  };
           
                setProfile(data)
    
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
                            {/* <p className="forgot-password text-center mt-2">
                                Forgot <a href="#">password?</a>
                            </p> */}
                            {/* <h4 className="Auth-form-title text-center">OR</h4> */}
                        </div>
                    </form>
                    {/* <div className="d-grid gap-2 m-4">
                        <button className="btn btn-primary " onClick={() => loginWithGoogle()}>Sign in with Google 🚀 </button>
                    </div> */}
                </div>
                {errorMessage && <h3 className='text-center'>{errorMessage}</h3>}
            </>
        )
    } else {
        return <Navigate replace to="/" />
    }

}