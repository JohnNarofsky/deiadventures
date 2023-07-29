import { useState, useEffect, useContext} from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import './login.css'
import axios from 'axios';
import { ProfileContext } from '../common/profilecontext';
import { Navigate } from 'react-router-dom';

export default function Login() {

    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [ user, setUser ] = useState([]);
    const {profile, setProfile} = useContext(ProfileContext)

    const loginWithGoogle = useGoogleLogin({
        onSuccess: (codeResponse) => setUser(codeResponse),
        // onSuccess: (codeResponse) => console.log(codeResponse),
        onError: (error) => console.log('Login Failed:', error)
    });
    
    useEffect(
        () => {
            if (user) {
                axios
                    .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: 'application/json'
                        }
                    })
                    .then((res) => {
                        setProfile(res.data);
                    })
                    .catch((err) => console.log(err));
            }
        },
        [ user ]
    );

    const handleLogin = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/login', { //change the url for response
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
    
          const data = await response.json();
          console.log(data); // Response from the server
    
          // If login was successful, Redirect to "Home Page".


        } catch (error) {
          // if unsuccessful login, redirect to "login page" again.
          console.error('Error during login:', error);
        }
      };

        // log out function to log the user out of google and set the profile array to null
    const logOut = () => {
            googleLogout();
            setProfile(null);
    };
    
    if(!profile){
        return (
            <>
                <div className="Auth-form-container">
                    <form className="Auth-form">
                        <div className="Auth-form-content">
                            <h3 className="Auth-form-title">Sign In</h3>
                            <div className="form-group mt-3">
                                <label>Email address</label>
                                <input
                                type="email"
                                className="form-control mt-1"
                                placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label>Password</label>
                                <input
                                type="password"
                                className="form-control mt-1"
                                placeholder="Enter password"
                                />
                            </div>
                            <div className="d-grid gap-2 mt-3">
                                <button type="submit" className="btn btn-primary">
                                Submit
                                </button>
                            </div>
                            <p className="forgot-password text-right mt-2">
                                Forgot <a href="#">password?</a>
                            </p>
                            <h4 className="Auth-form-title">OR</h4>
                            <div className="d-grid gap-3 mt-1">
                            </div>
                        </div>
                    </form>
                    <button className="btn btn-primary" onClick={() => loginWithGoogle()}>Sign in with Google 🚀 </button>
                </div>
            </>
        )
    } else {
        return <Navigate replace to="/" />
    }

}