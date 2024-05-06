import React from "react";
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../common/auth_context';
import { ProfileContext } from '../common/profilecontext';


const MyHistory = () => {
    const { deiClient } = useContext(AuthContext);
    const { profile } = useContext(ProfileContext);
    const [completedQuestActions, setCompletedQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
  
  
    //initializing UseEffect
    useEffect(()=>{
        deiClient.get("/guild").then((response) => {
            setGuilds(response.data);
          });

          deiClient.get("/user/" + profile.id + "/completed-quest-actions").then((response) => {
            setCompletedQuestActions(response.data);
          });
    }, [deiClient, profile]);

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