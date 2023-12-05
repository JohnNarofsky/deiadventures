import React from "react";
import { useEffect, useCallback, useState, useContext } from 'react';
import { ProfileContext } from '../common/profilecontext';
import axios from 'axios';
import api_config from '../api_config.json'


const MyHistory = () => {
    const { profile } = useContext(ProfileContext);
    const [completedQuestActions, setCompletedQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
  
  
    //initializing UseEffect
    useEffect(()=>{
        axios.get(api_config.baseURL + "/guild").then((response) => {
            setGuilds(response.data);
          });

          axios.get(api_config.baseURL + "/user/" + profile.id + "/completed-quest-actions").then((response) => {
            setCompletedQuestActions(response.data);
          });
    }, []);

    const FinishedQuestAction = ({questAction}) => {
        const completedDate = new Date(questAction.completed_date).toDateString();
        return (
            <tr>
                <td className="action-table-td left-col">{questAction.description}</td>
                <td className="action-table-td middle-col">{questAction.xp} xp</td>
                <td className="action-table-td right-col">{completedDate}</td>
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
        <>
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
        </> 
    )};
  
export default MyHistory;