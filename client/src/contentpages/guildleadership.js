import React from "react";
import { useEffect, useCallback, useState, useContext } from 'react';
import { AuthContext } from '../common/auth_context';
import { ProfileContext } from '../common/profilecontext';
import Button from 'react-bootstrap/Button';
import _ from 'lodash';
import './guildmanagement.css';

const GuildLeadership = () => {
  //state
  const [guildQuestActions, setGuildQuestActions] = useState([]);
  const [targetGuildQuestAction, setTargetGuildQuestAction] = useState({id:-1, description: "", xp: ""});
  const [newGuildQuestActionCreation, setNewGuildQuestActionCreation] = useState(false);
  const [targetGuild, setTargetGuild] = useState({id:-1});
  const { deiClient } = useContext(AuthContext);
  const { profile } = useContext(ProfileContext);

  //initializing UseEffect
  useEffect(()=>{
    let currentGuildQuestActions = [];
    deiClient.get("/guild").then((response) => {
      let guilds = response.data;
      let promises = [];
      guilds.filter((v) => {return v.leader_id === profile.id}).forEach((guild) => {
        let newPromise = deiClient.get("/guild/" + guild.id + "/quest-actions").then(x => {
          return {guildId: guild.id, guildTitle: guild.name, ...x};
        });
        promises.push(newPromise);
      });
      Promise.all(promises).then((values)=>{
        values.forEach((p) => {
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

  }, [deiClient, profile]);

  //function components
  const editGuildQuestAction = (guildId, guildQuestAction) => {

    const data = {quest_id: guildQuestAction.id, description: guildQuestAction.description, xp: parseInt(guildQuestAction.xp)};
    
    deiClient.put("/guild/" + guildId + "/quest-action", data).then((response) => {});

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
    
    deiClient.delete("/guild/" + guildId + "/quest-action", { headers: { 'Content-Type': 'application/json' }, data}).then((response) => {});

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
    deiClient.post("/guild/" + guildId + "/quest-action", data).then((response) => {
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
          <div className="sub-content">
          <div className="action-title">Adding a New Action</div>

            <TargetQuestAction 
                guildId = {guildId}
                guildQuestAction={{id:-2, description: "", xp: ""}}
                editGuildQuestAction={saveNewGuildQuestAction}
                cancelEditGuildQuestAction={cancelNewGuildQuestAction}
              />
          </div>
        </>
      );
    }
    return (
      <>
        <Button className="sub-action" variant="dark" onClick={() => {setNewQuestActionCreation(true);setTargetGuild({id:guildId});setTargetGuildQuestAction({id:-2, description: null, xp: null});}}>Add an Action</Button> 
        <br/>
      </>
    );
    
  };

  const TargetQuestAction = ({guildId, guildQuestAction, editGuildQuestAction, cancelEditGuildQuestAction}) => {
    const [description, setDescription] = useState(guildQuestAction.description);
    const [xp, setXp] = useState(guildQuestAction.xp);

    return (
      <div className="listing">
        <div className="details">
          <div>Description:&nbsp;<input className="wide-input" onChange={(event) => setDescription(event.target.value)} value={description} /></div>
          <div><input onChange={(event) => setXp(event.target.value)} value={xp} /> xp</div>
        </div>
          <div className="actions">
            <Button variant="dark" onClick={() => editGuildQuestAction(guildId, {...guildQuestAction, xp: Number.isSafeInteger(Number.parseInt(xp)) ? xp : -1, description: description})}>Done</Button>&nbsp;
            <Button variant="dark" onClick={() => cancelEditGuildQuestAction()}>Cancel</Button>
          </div>
      </div>
  );
  };

  const QuestAction = ({guildId, guildQuestAction, setTargetGuildQuestAction, retireGuildQuestAction}) => {
    let questId = guildQuestAction.id;
    return (
        <div className="listing">
          <div className="details">
            <div>{guildQuestAction.description}</div>
            <div>{guildQuestAction.xp} xp</div>
          </div>
            <div className="actions">
              <Button variant="dark" onClick={() => setTargetGuildQuestAction(guildQuestAction)}>Edit</Button>&nbsp;
              <Button variant="dark" onClick={() => retireGuildQuestAction(guildId, questId)}>Retire</Button>
            </div>
        </div>
    );
  };

  const GuildActionSet = ({questActionSet, editGuildQuestAction, retireGuildQuestAction, targetGuild, setTargetGuild, setTargetGuildQuestAction, cancelEditGuildQuestAction, saveNewGuildQuestAction, cancelNewGuildQuestAction, setNewGuildQuestActionCreation}) => {

    return (
      <div className="sub-content">
        <div className="sub-title">{questActionSet.guildTitle}</div>
        <div className="sub-content">
          <NewQuestAction
            guildId = {questActionSet.guildId}
            targetGuild = {targetGuild}
            setTargetGuild = {setTargetGuild}
            saveNewGuildQuestAction = {saveNewGuildQuestAction} 
            cancelNewGuildQuestAction = {cancelNewGuildQuestAction} 
            setNewQuestActionCreation = {setNewGuildQuestActionCreation} 
          />
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
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="main-title">Guild Leadership</div>
      <div className="main-description">As a leader of a guild, it's your task to open and close actions for players to complete.</div>
      <div className="main-description">Additionally, from time to time you may run quests that groups of players can sign up for as a party. This is an upcoming feature.</div>
      <div className="content">
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
    )

  };
  
  export default GuildLeadership;