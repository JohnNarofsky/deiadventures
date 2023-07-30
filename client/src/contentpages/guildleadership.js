import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';

const user_id = 1;


const GuildLeadership = () => {
  //state
  const [guildQuestActions, setGuildQuestActions] = useState([]);
  const [targetGuildQuestAction, setTargetGuildQuestAction] = useState({id:-1, description: "", xp: ""});
  const [newGuildQuestActionCreation, setNewGuildQuestActionCreation] = useState(false);
  const [targetGuild, setTargetGuild] = useState({id:-1});

  const baseURL="https://testdei.narofsky.org/api";

  //initializing UseEffect
  useEffect(()=>{
    let currentGuildQuestActions = [];
    axios.get(baseURL + "/guild").then((response) => {
      let guilds = response.data;
      let promises = [];
      guilds.filter((v) => {return v.leader_id === user_id}).map((guild) => {
        let newPromise = axios.get(baseURL + "/guild/" + guild.id + "/quest-actions").then(x => {
          return {guildId: guild.id, guildTitle: guild.name, ...x};
        });
        promises.push(newPromise);
      });
      Promise.all(promises).then((values)=>{
        values.map((p) => {
          let newActions = {
            guildId: p.guildId,
            guildTitle: p.guildTitle,
            guildQuestActions: p.data
          };
          currentGuildQuestActions.push(newActions);
        });
        setGuildQuestActions(currentGuildQuestActions);
      });
    });

  }, []);

  //function components
  const editGuildQuestAction = (guildId, guildQuestAction) => {

    const data = {quest_id: guildQuestAction.id, description: guildQuestAction.description, xp: parseInt(guildQuestAction.xp)};
    
    axios.put(baseURL + "/guild/" + guildId + "/quest-action", data).then((response) => {});

    let currentGuildQuestActions = 
      guildQuestActions.map((e) => {
        if (e.guildId === guildId){
          return {...e, 
            guildQuestActions: 
              e.guildQuestActions.map((f) => {
                if (f.id === guildQuestAction.id){
                  return {...f, description: guildQuestAction.description, xp: guildQuestAction.xp};
                }
                return {...f};
              })
          }
        }
        return _.cloneDeep(e);
      });
    setGuildQuestActions(currentGuildQuestActions);
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
    setTargetGuild({id:-1});
  };

  const retireGuildQuestAction = (guildId, questId) => {
    const data = {quest_id: questId};
    
    axios.delete(baseURL + "/guild/" + guildId + "/quest-action", { headers: { 'Content-Type': 'application/json' }, data}).then((response) => {});

    let currentGuildQuestActions = 
      guildQuestActions.map((e) => {
        if (e.guildId === guildId){
          return {...e, 
            guildQuestActions: e.guildQuestActions.filter((d) => {return d.id !== questId}).map((f) => {return {...f};})
          }
        }
        return _.cloneDeep(e);
      });

    setGuildQuestActions(currentGuildQuestActions);
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
    setTargetGuild({id:-1});

  };

  const cancelEditGuildQuestAction = () => {
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
  }  

  const saveNewGuildQuestAction  = (guildId, guildQuestAction) => {
    let data = {description: guildQuestAction.description, xp: parseInt(guildQuestAction.xp)};
    axios.post(baseURL + "/guild/" + guildId + "/quest-action", data).then((response) => {
      let questId = response.data.quest_id;

      let currentGuildQuestActions = 
        guildQuestActions.map((e) => {
          if (e.guildId === guildId){
            let guildActions = _.cloneDeep(e.guildQuestActions);
            guildActions.push({...data, id: questId});
            return {...e, guildQuestActions: guildActions};
          }
            return _.cloneDeep(e);
        });
    setGuildQuestActions(currentGuildQuestActions);
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
    setTargetGuild({id:-1});
    });

  }

  const cancelNewGuildQuestAction   = () => {
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
    setTargetGuild({id:-1});
  }

  const NewQuestAction = ({guildId, targetGuild, setTargetGuild, saveNewGuildQuestAction, cancelNewGuildQuestAction, setNewQuestActionCreation}) => {
    if (newGuildQuestActionCreation && targetGuild.id === guildId){
      return (
        <>
          <div className="action-table-container">
              <table className="action-table quest-examples">
                <tbody>
                  <TargetQuestAction 
                      guildId = {guildId}
                      guildQuestAction={{id:-2, description: "", xp: ""}}
                      editGuildQuestAction={saveNewGuildQuestAction}
                      cancelEditGuildQuestAction={cancelNewGuildQuestAction}
                    />
                </tbody>
              </table>
          </div>
          <br/>
        </>
      );
    }
    return (
      <>
        <Button variant="dark" onClick={() => {setNewQuestActionCreation(true);setTargetGuild({id:guildId});setTargetGuildQuestAction({id:-2, description: null, xp: null});}}>Add an Action</Button> 
        <br/>
      </>
    );
    
  };

  const TargetQuestAction = ({guildId, guildQuestAction, editGuildQuestAction, cancelEditGuildQuestAction}) => {
    const [description, setDescription] = useState(guildQuestAction.description);
    const [xp, setXp] = useState(guildQuestAction.xp);

    return (
      <tr>
          <td className="action-table-td left-col"><input className="wide-input" onChange={(event) => setDescription(event.target.value)} value={description} /></td>
          <td className="action-table-td right-col"><input onChange={(event) => setXp(event.target.value)} value={xp} /> xp</td>
          <td className="action-table-td right-col">
            <Button variant="dark" onClick={() => editGuildQuestAction(guildId, {...guildQuestAction, xp: Number.isSafeInteger(Number.parseInt(xp)) ? xp : -1, description: description})}>Done</Button>&nbsp;
            <Button variant="dark" onClick={() => cancelEditGuildQuestAction()}>Cancel</Button>
          </td>
      </tr>
  );
  };

  const QuestAction = ({guildId, guildQuestAction, setTargetGuildQuestAction, retireGuildQuestAction}) => {
    let questId = guildQuestAction.id;
    return (
        <tr>
            <td className="action-table-td left-col">{guildQuestAction.description}</td>
            <td className="action-table-td right-col">{guildQuestAction.xp} xp</td>
            <td className="action-table-td right-col">
              <Button variant="dark" onClick={() => setTargetGuildQuestAction(guildQuestAction)}>Edit</Button>&nbsp;
              <Button variant="dark" onClick={() => retireGuildQuestAction(guildId, questId)}>Retire</Button>
            </td>
        </tr>
    );
  };

  const GuildActionSet = ({questActionSet, editGuildQuestAction, retireGuildQuestAction, targetGuild, setTargetGuild, setTargetGuildQuestAction, cancelEditGuildQuestAction, saveNewGuildQuestAction, cancelNewGuildQuestAction, setNewGuildQuestActionCreation}) => {

    return (
      <>
        <div className="action-table-header"><h2>{questActionSet.guildTitle}</h2></div>
        <NewQuestAction
        guildId = {questActionSet.guildId}
        targetGuild = {targetGuild}
        setTargetGuild = {setTargetGuild}
        saveNewGuildQuestAction = {saveNewGuildQuestAction} 
        cancelNewGuildQuestAction = {cancelNewGuildQuestAction} 
        setNewQuestActionCreation = {setNewGuildQuestActionCreation} 
        /><br/>
        <div className="action-table-container quest-examples">
              <table className="action-table"><tbody>
                {questActionSet.guildQuestActions.map((guildQuestAction,index)=>{
                  if (guildQuestAction.id === targetGuildQuestAction.id){
                    return <TargetQuestAction 
                      guildId = {questActionSet.guildId}
                      key={guildQuestAction.id}
                      guildQuestAction={guildQuestAction}
                      editGuildQuestAction={editGuildQuestAction}
                      cancelEditGuildQuestAction={cancelEditGuildQuestAction}
                    />
                  }
                  return <QuestAction
                    key={guildQuestAction.id} 
                    guildId = {questActionSet.guildId}
                    guildQuestAction={guildQuestAction} 
                    setTargetGuildQuestAction={setTargetGuildQuestAction} 
                    retireGuildQuestAction={retireGuildQuestAction} 
                    />
                })}
              </tbody></table>
          </div>
      </>
    );
  }


  return (
    <div className="container">
      <div className="parallax-thin">
        <Decorations/> 
        <div className="parallax__cover">
          <div className="cover-content ctop">
            <div className="section quests">
                <h1 className="section-top">Guild Leadership</h1>
                <p className="section-top-content">As a leader of a guild, it's your task to open and close actions for players to complete.</p>
                <p className="section-top-content">Additionally, from time to time you may run quests that groups of players can sign up for as a party. This is an upcoming feature.</p>
            </div>
            <div className="section quests">
              {guildQuestActions.map((questActionSet) => {
                  return <GuildActionSet 
                    key={questActionSet.guildId} 
                    questActionSet={questActionSet} 
                    retireGuildQuestAction={retireGuildQuestAction} 
                    editGuildQuestAction={editGuildQuestAction} 
                    targetGuild={targetGuild}
                    setTargetGuild={setTargetGuild}
                    setTargetGuildQuestAction={setTargetGuildQuestAction}
                    cancelEditGuildQuestAction={cancelEditGuildQuestAction}
                    saveNewGuildQuestAction={saveNewGuildQuestAction}
                    cancelNewGuildQuestAction={cancelNewGuildQuestAction}
                    setNewGuildQuestActionCreation={setNewGuildQuestActionCreation}
                    />
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildLeadership;