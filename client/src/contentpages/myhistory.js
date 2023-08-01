import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const MyHistory = () => {

    const [completedQuestActions, setCompletedQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
  
    const baseURL="https://testdei.narofsky.org/api";
  
    //initializing UseEffect
    useEffect(()=>{
        axios.get(baseURL + "/guild").then((response) => {
            setGuilds(response.data);
          });

        //TODO: GET USER_ID FROM CONTEXT THAT IS UPDATED UPON LOGIN
          let user_id = 1;

          axios.get(baseURL + "/user/" + user_id + "/completed-quest-actions").then((response) => {
            setCompletedQuestActions(response.data);
          });
    }, []);

    const FinishedQuestAction = ({questAction}) => {
        return (
            <tr>
                <td className="action-table-td left-col">{questAction.description}</td>
                <td className="action-table-td right-col">{questAction.xp} xp</td>
            </tr>
        );
      };

    const Guild = ({guild}) => {
        return (
            <div>
                <div className="action-table-header">
                    <h2>{guild.name} Actions</h2>
                </div>
                <div className="action-table-container quest-examples">
                    <table className="action-table"><tbody>
                        {
                        completedQuestActions.filter((v)=>v.guild_id===guild.id).map((questAction)=>{
                            return <FinishedQuestAction key={questAction.quest_id} questAction={questAction} />
                            })
                        }
                    </tbody></table>
                </div>
            </div>                
        );
    };

    return (
    <div className="container">
        <div className="parallax">
            <div className="parallax__cover-clean">
                <div className="cover-div">
                    <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
                </div>
                <div className="cover-content cbttm">
                    <div className="section quests">
                        <h1 className="section-top">PRESENTING YOUR HISTORY</h1>
                        <p className="section-top"><strong>These are the adventure actions you've completed.</strong></p>
                    </div>
                        {guilds.map((thisGuild) => {
                            return <Guild key={thisGuild.id} guild={thisGuild}/>
                    })}
                    <br/>
                </div>  
            </div>
        </div>
    </div>
    )};
  
export default MyHistory;