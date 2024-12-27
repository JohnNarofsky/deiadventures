import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api_config from '../api_config.json';
import { ProfileContext } from '../common/profilecontext';

export default function ChangeUserName() {

    const { profile } = useContext(ProfileContext);
    const [userName, setUserName] = useState('');

        //initializing UseEffect
    useEffect(()=>{
        axios.get(api_config.baseURL + "/user/" + profile.id).then((response) => {
            setUserName(response.data.name);
        });
    }, []);

    const navigate = useNavigate();

    const handleChangeUserName = async (e) => {
        e.preventDefault();

        const data = {name: userName};
        axios.put(api_config.baseURL + "/user/" + profile.id + "/set-name", data).then((response) => {
            navigate("/MyAdventures");
        });
    };

    return(
        <div className="Auth-form-container">
            <form className="Auth-form" onSubmit={handleChangeUserName}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title text-center">Change your User Name Here</h3>
                    <div className="form-group m-4">
                        <label>Name</label>
                        <input
                        type="text"
                        className="form-control mt-1"
                        placeholder="e.g Jane"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
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
    );
}