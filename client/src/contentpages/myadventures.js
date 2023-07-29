import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import _ from 'lodash';
import Quest, {QuestActions} from '../common/quest';

const MyAdventures = () => {

    const [guildQuestActions, setGuildQuestActions] = useState([]);
    const [acceptedGuildQuestActions, setAcceptedGuildQuestActions] = useState([]);
    const [guilds, setGuilds] = useState([]);
  
    const baseURL="https://testdei.narofsky.org/api";
  
    //initializing UseEffect
    useEffect(()=>{
        const fetchData = async () => {
            const response = await axios(baseURL + "/guild");
            console.log(response.data);
            const guilds = response.data;
            setGuilds(guilds);
        };

        fetchData();
  
        let availableGuildQuestActions = [
        {
            guildId: 1,
            guildTitle: "Scribe",
            guildQuestActions:[
            {id:4, description:"Track a set of DEI metrics", xp: "50"},
            {id:5, description:"Draft a DEI or ERG-related survey", xp: "50"},
            {id:6, description:"Review Job Descriptions to help remove bias", xp: "75"},
            {id:7, description:"Review a presentation draft for Accessibility needs", xp: "75"},
            {id:9, description:"Create a Fundraising Campaign", xp: "200"},
            {id:10, description:"Submit a DEI presentation for an external conference", xp: "250"},
            ],
        },
        {
            guildId: 2,
            guildTitle: "Warrior",
            guildQuestActions:[
            {id:11, description:"Schedule a DEI meeting", xp: "10"},
            {id:12, description:"Update Zoom name with pronouns", xp: "15"},
            {id:13, description:"Update email signature with pronouns", xp: "15"},
            {id:16, description:"Review Job Descriptions to help remove bias", xp: "75"},
            {id:17, description:"Review a presentation draft for Accessibility needs", xp: "75"},
            ],
        },
        ];
        setGuildQuestActions(availableGuildQuestActions);

        let currentAcceptedGuildQuestActions = [
        {
            guildId: 1,
            guildTitle: "Scribe",
            guildQuestActions:[
            {id:1, description:"Schedule a DEI meeting", xp: "10"},
            {id:2, description:"Update Zoom name with pronouns", xp: "15"},
            {id:3, description:"Update email signature with pronouns", xp: "15"},
            {id:8, description:"Help plan a DEI-related event", xp: "100"},
            ],
        },
        {
            guildId: 2,
            guildTitle: "Warrior",
            guildQuestActions:[
            {id:14, description:"Track a set of DEI metrics", xp: "50"},
            {id:15, description:"Draft a DEI or ERG-related survey", xp: "50"},
            {id:18, description:"Help plan a DEI-related event", xp: "100"},
            {id:19, description:"Create a Fundraising Campaign", xp: "200"},
            {id:20, description:"Submit a DEI presentation for an external conference", xp: "250"},
            ],
        },
        ];
        setAcceptedGuildQuestActions(currentAcceptedGuildQuestActions);
    }, []);

    const Guild = ({guild}) => {

        return (
            <div>
                <div className="action-table-header">
                    <h2>{guild.name} Actions</h2>
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
                    <div className="action-table-grid">
                        {guilds.map((thisGuild) => {
                            return <Guild key={thisGuild.id} guild={thisGuild}/>
                    })}
                    </div>
                </div>  
            </div>
        </div>
    </div>
    )};
  
export default MyAdventures;