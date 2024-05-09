import React from "react";
import { useEffect, useCallback, useState, useContext } from 'react';
import { ProfileContext } from '../common/profilecontext';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';
import api_config from '../api_config.json'


const MyAdventures = () => {
    const { profile, setProfile, usedGoogleLogin, setUsedGoogleLogin } = useContext(ProfileContext);
    const [acceptedQuestActions, setAcceptedQuestActions] = useState([]);
    const [availableQuestActions, setAvailableGuildQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
 
  
    //initializing UseEffect
    useEffect(()=>{
        axios.get(api_config.baseURL + "/guild").then((response) => {
            setGuilds(response.data);
          });

        //TODO: GET profile.id FROM CONTEXT THAT IS UPDATED UPON LOGIN
          axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
            setAcceptedQuestActions(response.data);
          });
      
          axios.get(api_config.baseURL + "/user/" + profile.id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
          });

    }, []);

    const finishQuestAction = (questAction) => {
        const data = {quest_id: questAction.quest_id};
        //TODO: Give them a little modal happiness telling them where this went
        
        axios.put(api_config.baseURL + "/user/" + profile.id + "/complete-quest", data).then((response) => {
            axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
                setAcceptedQuestActions(response.data);
            });
          
            axios.get(api_config.baseURL + "/user/" + profile.id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
            });
    
        });
    };

    const cancelQuestAction = (questAction) => {
        const data = {quest_id: questAction.quest_id};
        //TODO: Give them a little modal happiness telling them where this went
        
        axios.delete(api_config.baseURL + "/user/" + profile.id + "/cancel-quest", { headers: { 'Content-Type': 'application/json' }, data }).then((response) => {
            axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
                setAcceptedQuestActions(response.data);
            });
          
            axios.get(api_config.baseURL + "/user/" + profile.id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
            });
    
        });

    };

    const acceptQuestAction = (questAction) => {
        const data = {quest_id: questAction.quest_id};

        axios.put(api_config.baseURL + "/user/" + profile.id + "/accept-quest", data).then((response) => {
            axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
                setAcceptedQuestActions(response.data);
            });
          
            axios.get(api_config.baseURL + "/user/" + profile.id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
            });
    
        });
    };

    //{guild_id: 2, quest_id: 0, description: 'Schedule a DEI meeting', xp: 15}
    const AcceptedQuestAction = ({questAction}) => {
        // If a Quest.open_date is missing for an accepted quest,
        // it's because it was accepted before we started recording
        // that field. We implemented that on May 6th, 2024, and got the
        // change deployed by May 10th.
        const acceptedDate = questAction.open_date != null ?
            new Date(questAction.open_date).toDateString() :
            "Before May 10th, 2024";
        return (
            <tr>
                <td className="action-table-td left-col">{questAction.description}</td>
                <td className="action-table-td right-col">{questAction.xp} xp</td>
                <td className="action-table-td right-col">{acceptedDate}</td>
                <td className="action-table-td right-col">
                  <Button variant="dark" onClick={() => finishQuestAction(questAction)}>Finish</Button>&nbsp;
                  <Button variant="dark" onClick={() => cancelQuestAction(questAction)}>Cancel</Button>
                </td>
            </tr>
        );
      };

      
      const AvailableQuestAction = ({questAction}) => {
        return (
            <tr>
                <td className="action-table-td left-col">{questAction.description}</td>
                <td className="action-table-td right-col">{questAction.xp} xp</td>
                <td className="action-table-td right-col">
                  <Button variant="dark" onClick={() => acceptQuestAction(questAction)}>Accept</Button>
                </td>
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
                        <tr>
                            <td>
                                <div className="action-table-container quest-examples">
                                    <h3>Your Accepted Guild Actions</h3>
                                    <table className="action-table"><thead><tr>
                                        <th className="action-table-td left-col"></th>
                                        <th className="action-table-td right-col"></th>
                                        <th className="action-table-td right-col">Date Accepted</th>
                                        <th className="action-table-td right-col"></th>
                                    </tr></thead><tbody>
                                        {acceptedQuestActions.filter((v)=>v.guild_id===guild.id).map((questAction)=>{
                                            return <AcceptedQuestAction key={questAction.quest_id} questAction={questAction} />
                                            })
                                        }
                                    </tbody></table>
                                </div>
                            </td>
                        </tr>                        
                        <tr>
                            <td>
                                <br/>
                                <div className="action-table-container quest-examples">
                                    <h3>Available Guild Actions</h3>
                                    <table className="action-table"><tbody>
                                        {availableQuestActions.filter((v)=>v.guild_id===guild.id).map((questAction)=>{
                                            return <AvailableQuestAction key={questAction.quest_id} questAction={questAction} />
                                            })
                                        }
                                    </tbody></table>
                                </div>
                            </td>
                        </tr>                        
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
                    <h1 className="section-top">Welcome to Your Adventures!</h1>
                    <p className="section-top"><strong>These are the adventure actions you've signed up for along with the ones available!</strong></p>
                </div>
                    {guilds.map((thisGuild) => {
                        return <Guild key={thisGuild.id} guild={thisGuild}/>
                })}
            </div>
        </>  
    )};

export default MyAdventures;