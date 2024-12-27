import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { useEffect, useState, useContext } from 'react';
import { ProfileContext } from '../common/profilecontext';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';
import api_config from '../api_config.json'
import ReactModal from 'react-modal';

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
import '@mdxeditor/editor/style.css';

ReactModal.setAppElement('#root');


const MyAdventures = () => {
    const { profile } = useContext(ProfileContext);
    const [acceptedQuestActions, setAcceptedQuestActions] = useState([]);
    const [availableQuestActions, setAvailableGuildQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
    const [actionDescriptionIsOpen, setActionDescriptionIsOpen] = useState(false);
    const [targetQuestActionDescription, setTargetQuestActionDescription] = useState([]);
    const [userName, setUserName] = useState('');

    //initializing UseEffect
    useEffect(()=>{
        axios.get(api_config.baseURL + "/guild").then((response) => {
            setGuilds(response.data);
        });

        axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
            setAcceptedQuestActions(response.data);
        });
    
        axios.get(api_config.baseURL + "/user/" + profile.id + "/available-quest-actions").then((response) => {
            setAvailableGuildQuestActions(response.data);
        });

        axios.get(api_config.baseURL + "/user/" + profile.id).then((response) => {
            setUserName(response.data.name);
        });

    }, []);

    const showTargetQuestUsage = (questAction) => {
        setTargetQuestActionDescription(questAction);
        setActionDescriptionIsOpen(true);
    }
    
    const hideTargetQuestActionDescription = () => {
        setTargetQuestActionDescription({id:-1, description: "", xp: "", name: "", repeatable: false });
        setActionDescriptionIsOpen(false);
        axios.get(api_config.baseURL + "/user/" + profile.id + "/accepted-quest-actions").then((response) => {
            setAcceptedQuestActions(response.data);
        });

    }
    
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

    const saveNotes = (questAction, notes) => {
        const data = {task_id: questAction.task_id, adventurer_note: notes};

        axios.put(api_config.baseURL + "/user/" + profile.id + "/edit-quest-task", data).then((response) => {
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
            <div className="my-adventures-action">
                <div className="accepted-action-name">{questAction.name}</div>
                <div className="accepted-action-description">
                    <Button onClick={(event) => showTargetQuestUsage(questAction)}>Notes & Description</Button>
                </div>
                <div className="accepted-action-accepted-date">accepted: {acceptedDate}</div>
                <div className="accepted-action-experience-points">{questAction.xp} xp</div>
                <div className="accepted-action-actions">
                    <Button variant="dark" onClick={() => finishQuestAction(questAction)}>Finish</Button>&nbsp;
                    <Button variant="dark" onClick={() => cancelQuestAction(questAction)}>Cancel</Button>
                </div>
            </div>
        );
    };


    const AvailableQuestAction = ({questAction}) => {
        return (
            <div className="my-adventures-action">
                <div className="available-action-name">{questAction.name}</div>
                <div className="available-action-description">
                    <Button onClick={(event) => showTargetQuestUsage(questAction)}>Description</Button>
                </div>
                <div className="available-action-repeatable">{questAction.repeatable ? "(repeatable)":""}</div>
                <div className="available-action-experience-points">{questAction.xp} xp</div>
                <div className="available-action-actions">
                    <Button variant="dark" onClick={() => acceptQuestAction(questAction)}>Accept</Button>
                </div>
            </div>
        );
    };

    const Guild = ({guild}) => {
        return (
            <div>
                <div className="action-table-container">
                    <h4>{guild.name}</h4>
                    <div className="my-adventures-actions">
                        <div className="my-adventures-actions-title">Accepted Actions</div>
                        {acceptedQuestActions.filter((v)=>v.guild_id===guild.id).map((questAction)=>{
                            return <AcceptedQuestAction key={questAction.quest_id} questAction={questAction} />
                        })}
                    </div>
                    <div className="my-adventures-actions">
                        <div className="my-adventures-actions-title">Available Actions</div>
                        {availableQuestActions.filter((v)=>v.guild_id===guild.id).map((questAction)=>{
                            return <AvailableQuestAction key={questAction.quest_id} questAction={questAction} />
                        })}
                    </div>
                </div>                
            </div>
        );
    };

    const TargetQuestActionContent = ({action}) => {
        const isAccepted = action.open_date !== undefined;
        console.log(action);
        const adventurer_note = action.adventurer_note === null ? "" : action.adventurer_note;
        if (isAccepted){
            return (
                <div className='sub-content'>
                    <h5>{action.name}</h5>
                    <div className="modal-content-container">    
                        <div className="modal-content">
                            <div
                                className="sub-content">
                                <div className="editor">
                                    <MDXEditor 
                                        markdown={adventurer_note}
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
                                        onChange={(event) => saveNotes(action, event)}
                                    />
                                </div>
                            </div>
                            <div className="sub-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} >{action.description}</ReactMarkdown>
                            </div>
                        </div>
                        <Button className="sub-action" variant="dark" onClick={hideTargetQuestActionDescription}>Exit</Button><br/>
                    </div>
                </div>
            );
        } else {
            return (
                <div className='sub-content'>
                    <h5>{action.name}</h5>
                    <div className="modal-content-container">    
                        <div className="modal-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} >{action.description}</ReactMarkdown>
                        </div>
                        <Button className="sub-action" variant="dark" onClick={hideTargetQuestActionDescription}>Exit</Button><br/>
                    </div>
                </div>
            );            
        }
    };

    return (
        <>
            <ReactModal 
                isOpen={actionDescriptionIsOpen}
                contentLabel="onRequestClose Example"
                onRequestClose={hideTargetQuestActionDescription}
                className="Modal"
                overlayClassName="Overlay"
            >
                <TargetQuestActionContent action={targetQuestActionDescription} />
            </ReactModal>
        
            <div className="cover-div">
                <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
            </div>
            <div className="cover-content cbttm">
                <div className="section quests">
                    <h1 className="section-top">Welcome to your adventures, {userName}!</h1>
                    <p className="section-top"><strong>These are the adventure actions you've signed up for along with the ones available!</strong></p>
                </div>
                    {guilds.map((thisGuild) => {
                        return <Guild key={thisGuild.id} guild={thisGuild}/>
                })}
            </div>
        </>  
    )};

export default MyAdventures;