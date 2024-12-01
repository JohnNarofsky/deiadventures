import React from "react";
import ReactMarkdown from 'react-markdown';
import { useEffect, useCallback, useState, useContext } from 'react';
import { ProfileContext } from '../common/profilecontext';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';
import './guildmanagement.css';
import api_config from '../api_config.json';
import { 
  MDXEditor, 
  headingsPlugin, 
  quotePlugin, 
  listsPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  toolbarPlugin,
  linkPlugin,
  CreateLink,
  linkDialogPlugin,
} from '@mdxeditor/editor';
import remarkGfm from 'remark-gfm'; 
import ReactModal from 'react-modal';
import '@mdxeditor/editor/style.css';

ReactModal.setAppElement('#root');

const GuildLeadership = () => {
  //state
  const [guildQuestActions, setGuildQuestActions] = useState([]);
  const [targetGuildQuestAction, setTargetGuildQuestAction] = useState({id:-1, description: "", xp: "", repeatable: false });
  const [newGuildQuestActionCreation, setNewGuildQuestActionCreation] = useState(false);
  const [targetGuild, setTargetGuild] = useState({id:-1});
  const [targetQuestActionUsage,setTargetQuestActionUsage] = useState({id:-1, description: "", xp: "", repeatable: false });
  const { profile } = useContext(ProfileContext);
  const [actionUsageIsOpen, setActionUsageIsOpen] = useState(false);
  const [retrievedUsage, setRetrievedUsage] = useState([]);

  //initializing UseEffect
  useEffect(()=>{
    let currentGuildQuestActions = [];
    axios.get(api_config.baseURL + "/guild").then((response) => {
      let guilds = response.data;
      let promises = [];
      guilds.filter((v) => {return v.leader_id === profile.id}).map((guild) => {
        let newPromise = axios.get(api_config.baseURL + "/guild/" + guild.id + "/quest-actions").then(x => {
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

    const data = {quest_id: guildQuestAction.id, description: guildQuestAction.description, xp: parseInt(guildQuestAction.xp), repeatable: guildQuestAction.repeatable};
    
    axios.put(api_config.baseURL + "/guild/" + guildId + "/quest-action", data).then((response) => {});

    let currentGuildQuestActions = 
      guildQuestActions.map((e) => {
        if (e.guildId === guildId){
          return {...e, 
            guildQuestActions: 
              e.guildQuestActions.map((f) => {
                if (f.id === guildQuestAction.id){
                  return {...f, description: guildQuestAction.description, xp: guildQuestAction.xp, repeatable: guildQuestAction.repeatable};
                }
                return {...f};
              })
          }
        }
        return _.cloneDeep(e);
      });
    setGuildQuestActions(currentGuildQuestActions);
    setTargetGuildQuestAction({id:-1, description: null, xp: null, repeatable: false});
    setTargetGuild({id:-1});
  };

  const retireGuildQuestAction = (guildId, questId) => {
    const data = {quest_id: questId};
    
    axios.delete(api_config.baseURL + "/guild/" + guildId + "/quest-action", { headers: { 'Content-Type': 'application/json' }, data}).then((response) => {});

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
    setTargetGuildQuestAction({id:-1, description: null, xp: null, repeatable: false});
    setTargetGuild({id:-1});

  };

  const cancelEditGuildQuestAction = () => {
    setTargetGuildQuestAction({id:-1, description: null, xp: null});
  }  

  const saveNewGuildQuestAction  = (guildId, guildQuestAction) => {
    let data = {description: guildQuestAction.description, xp: parseInt(guildQuestAction.xp), repeatable: guildQuestAction.repeatable};
    axios.post(api_config.baseURL + "/guild/" + guildId + "/quest-action", data).then((response) => {
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

  const showTargetQuestUsage = (questAction) => {
    axios.get(api_config.baseURL + "/quest-action/" + questAction.id + "/participation").then((response) => {
      setRetrievedUsage(response.data);
      setTargetQuestActionUsage(questAction);
      setActionUsageIsOpen(true);
        });

  }

  const hideTargetQuestUsage = () => {
    setTargetQuestActionUsage({id:-1, description: "", xp: "", repeatable: false });
    setActionUsageIsOpen(false);
  }

  const TargetQuestActionUsageContent = ({actionUsage, retrievedUsage}) => {
    console.log(retrievedUsage);
    return (
      <div className='sub-content'>
        <div className="sub-title">
          {actionUsage.description}
        </div>
        <div className="modal-content-container">
        <Button className="sub-action" variant="dark" 
            onClick={hideTargetQuestUsage}
          >Export</Button>

          <div className="modal-content">
          {retrievedUsage.adventurers.map((usage) => {
              return <div className="sub-content">
                <div
                  key={usage.accepted_date + " " + usage.user.id}
                >
                  <div>Adventurer Name: {usage.user.name}</div>
                  <div>Accepted Date: {new Date(usage.accepted_date).toDateString()}</div>
                  <div>Completed Date: {usage.completed_date !== null ? new Date(usage.completed_date).toDateString() : ""}</div>
                </div>
              </div>
          })}
          </div>
          <Button className="sub-action" variant="dark" 
            onClick={hideTargetQuestUsage}
            >Exit</Button><br/>
        </div>
      </div>
    );
  };

  const NewQuestAction = ({guildId, targetGuild, setTargetGuild, saveNewGuildQuestAction, cancelNewGuildQuestAction, setNewQuestActionCreation}) => {
    if (newGuildQuestActionCreation && targetGuild.id === guildId){
      return (
        <>
          <div className="sub-content">
          <div className="action-title">Adding a New Action</div>

            <TargetQuestAction 
                guildId = {guildId}
                guildQuestAction={{id:-2, description: "", xp: "", repeatable: false }}
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
    const [repeatable, setRepeatable] = useState(guildQuestAction.repeatable);

    return (
      <div className="listing">
        <div className="details">
          <h5>Description:&nbsp;
          </h5>
          <div className="editor">
            <MDXEditor 
            markdown={description}
            plugins={[
              headingsPlugin(),   
              quotePlugin(), 
              listsPlugin(),
              toolbarPlugin({
                toolbarClassName: 'my-classname',
                toolbarContents: () => (
                  <>
                    {' '}
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <CreateLink />
                  </>
                )
              }),
              linkPlugin(), 
              linkDialogPlugin({
                linkAutocompleteSuggestions: ['https://virtuoso.dev', 'https://mdxeditor.dev']
              }),
            ]}
            onChange={(event) => setDescription(event)}
            />
          </div>
          <div>
            <input onChange={(event) => setXp(event.target.value)} value={xp} /> xp
            &nbsp;
            <input onChange={(event) => setRepeatable(event.target.checked)} checked={repeatable} type="checkbox"/> repeatable
          </div>
        </div>
          <div className="actions">
            <Button variant="dark" onClick={() => editGuildQuestAction(guildId, {...guildQuestAction, xp: Number.isSafeInteger(Number.parseInt(xp)) ? xp : -1, description: description, repeatable: repeatable})}>Done</Button>&nbsp;
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
            <div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} >{guildQuestAction.description}</ReactMarkdown>
            </div>
            <div>
              {guildQuestAction.xp} xp
              &nbsp;
              <input type="checkbox" checked={guildQuestAction.repeatable} readOnly /> repeatable
            </div>
          </div>
            <div className="actions">
              <Button variant="dark" onClick={() => showTargetQuestUsage(guildQuestAction)}>Usage</Button>&nbsp;
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
        <ReactModal 
          isOpen={actionUsageIsOpen}
          contentLabel="onRequestClose Example"
          onRequestClose={hideTargetQuestUsage}
          className="Modal"
          overlayClassName="Overlay"
        >
          <TargetQuestActionUsageContent actionUsage={targetQuestActionUsage} retrievedUsage={retrievedUsage}/>
        </ReactModal>
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