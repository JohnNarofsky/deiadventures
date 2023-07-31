import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";

const Login = () => {

    //state
    const [userEmail, setUserEmail] = useState("");
    const [userPassword, setUserPassword] = useState("");

    const navigate = useNavigate();

    const login = (login) => {
        console.log(login);
        axios.post(baseURL + "/auth/login", login).then((response) => {
            localStorage.setItem("userId", response.id);
            navigate("/");
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
                        <h1 className="section-top">LOGIN PAGE</h1>
                        <p className="section-top"><strong>Log into your account below!</strong></p>
                    </div>
                    <br/>
                    <div>
                        <div className="action-table-container quest-examples">
                            <table className="action-table"><tbody>
                                <tr>
                                    <td className="action-table-td left-col">
                                        email: <input onChange={(event) => setUserEmail(event.target.value)} />
                                    </td>
                                    <td className="action-table-td left-col">
                                        password: <input onChange={(event) => setUserPassword(event.target.value)} type="password" />
                                    </td>
                                    <td className="action-table-td left-col"></td>
                                    <td className="action-table-td right-col">
                                        <Button variant="dark" onClick={()=>login({email: userEmail, password: userPassword})}>Login</Button>
                                    </td>
                                </tr>
                            </tbody></table>
                        </div>
                        <br/><br/><br/><br/>
                    </div> 
                </div>  
            </div>
        </div>
    </div>
    )};
  
export default Login;