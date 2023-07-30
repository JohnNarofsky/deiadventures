import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';
import Quest, {QuestActions} from '../common/quest';

const MyAdventures = () => {

    const [acceptedQuestActions, setAcceptedQuestActions] = useState([]);
    const [availableQuestActions, setAvailableGuildQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
    const user_id = 1;

  
    const baseURL="https://testdei.narofsky.org/api";
  
    //initializing UseEffect
    useEffect(()=>{
        axios.get(baseURL + "/guild").then((response) => {
            setGuilds(response.data);
          });

        //TODO: GET USER_ID FROM CONTEXT THAT IS UPDATED UPON LOGIN
          axios.get(baseURL + "/user/" + user_id + "/accepted-quest-actions").then((response) => {
            setAcceptedQuestActions(response.data);
          });
      
          axios.get(baseURL + "/user/" + user_id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
            console.log(response.data);
          });

    }, []);

    const finishQuestAction = (questAction) => {

    };

    const cancelQuestAction = (questAction) => {

    };

    const acceptQuestAction = (questAction) => {
        const data = {quest_id: questAction.quest_id};

        axios.put(baseURL + "/user/" + user_id + "/accept-quest", data).then((response) => {
            axios.get(baseURL + "/user/" + user_id + "/accepted-quest-actions").then((response) => {
                setAcceptedQuestActions(response.data);
            });
          
            axios.get(baseURL + "/user/" + user_id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
            });
    
        });
    };

    //{guild_id: 2, quest_id: 0, description: 'Schedule a DEI meeting', xp: 15}
    const AcceptedQuestAction = ({questAction}) => {
        return (
            <tr>
                <td className="action-table-td left-col">{questAction.description}</td>
                <td className="action-table-td right-col">{questAction.xp} xp</td>
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
                                    <table className="action-table"><tbody>
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
    <div className="container">
        <div className="parallax">
            <Decorations/>
            <div className="parallax__cover">
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
            </div>
        </div>
    </div>
    )};
  
export default MyAdventures;