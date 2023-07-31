import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import { redirect } from "react-router-dom";

const Signup = () => {

    //state
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userPassword, setUserPassword] = useState("");

    const signup = (signup) => {
       axios.post(baseURL + "/auth/account", signup).then((response) => {
           redirect("/login");
       });
    }

  
    const baseURL="https://testdei.narofsky.org/api";
  
    //initializing UseEffect
    useEffect(()=>{

    }, []);

    return (
    <div className="container">
        <div className="parallax">
            <Decorations/>
            <div className="parallax__cover">
                <div className="cover-div">
                    <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
                </div>
                <div className="cover-content cbttm">
                    <div className="section quests">
                        <h1 className="section-top">SIGN-UP PAGE</h1>
                        <p className="section-top">
                            <strong>Create your account below!</strong>
                        </p>
                        <p>
                            name: <input onChange={(event) => setUserName(event.target.value)} /> <br/>
                            email: <input onChange={(event) => setUserEmail(event.target.value)} /> <br/>
                            password: <input onChange={(event) => setUserPassword(event.target.value)} type="password" /> <br/>
                            <Button variant="dark" onClick={()=>signup({name: userName, email: userEmail, password: userPassword})}>Create</Button>
                        </p>
                    </div>
                </div>  
            </div>
        </div>
    </div>
    )};
  
export default Signup;