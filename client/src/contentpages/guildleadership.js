import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const GuildLeadership = () => {
  //state
  const [guildQuestActions, setGuildQuestActions] = useState([]);

  const baseURL="https://testdei.narofsky.org/api";

  //initializing UseEffect
  useEffect(()=>{
    axios.get(baseURL + "/guild").then((response) => {
      console.log(response);
    });

    let currentGuildQuestActions = [
      {
        guildId: 1,
        guildTitle: "Scribe",
        guildQuestActions:[
          {id:1, description:"Schedule a DEI meeting", xp: "10"},
          {id:2, description:"Update Zoom name with pronouns", xp: "15"},
          {id:3, description:"Update email signature with pronouns", xp: "15"},
          {id:4, description:"Track a set of DEI metrics", xp: "50"},
          {id:5, description:"Draft a DEI or ERG-related survey", xp: "50"},
          {id:6, description:"Review Job Descriptions to help remove bias", xp: "75"},
          {id:7, description:"Review a presentation draft for Accessibility needs", xp: "75"},
          {id:8, description:"Help plan a DEI-related event", xp: "100"},
          {id:9, description:"Create a Fundraising Campaign", xp: "200"},
          {id:10, description:"Submit a DEI presentation for an external conference", xp: "250"},
        ],
      },
      {
        guildId: 1,
        guildTitle: "Scribe",
        guildQuestActions:[
          {id:1, description:"Schedule a DEI meeting", xp: "10"},
          {id:2, description:"Update Zoom name with pronouns", xp: "15"},
          {id:3, description:"Update email signature with pronouns", xp: "15"},
          {id:4, description:"Track a set of DEI metrics", xp: "50"},
          {id:5, description:"Draft a DEI or ERG-related survey", xp: "50"},
          {id:6, description:"Review Job Descriptions to help remove bias", xp: "75"},
          {id:7, description:"Review a presentation draft for Accessibility needs", xp: "75"},
          {id:8, description:"Help plan a DEI-related event", xp: "100"},
          {id:9, description:"Create a Fundraising Campaign", xp: "200"},
          {id:10, description:"Submit a DEI presentation for an external conference", xp: "250"},
        ],
      },
    ];
    setGuildQuestActions(currentGuildQuestActions);

  }, []);

  //function components
  const editGuildQuestAction = (guildQuestAction) => {

  };

  const retireGuildQuestAction = (guildQuestAction) => {

  };

  const GuildActionSet = ({questActionSet, editGuildQuestAction, retireGuildQuestAction}) => {

    return (
      <>
        <div className="action-table-header"><h2>{questActionSet.guildTitle}</h2></div>
        <div className="action-table-container quest-examples">
              <table className="action-table"><tbody>
              {questActionSet.guildQuestActions.map((guildQuestAction,index)=>{
                  return <QuestAction key={guildQuestAction.id} guildQuestAction={guildQuestAction} editGuildQuestAction={editGuildQuestAction} retireGuildQuestAction={retireGuildQuestAction} />
              })}
              </tbody></table>
          </div>

      </>
    );
  }

  const QuestAction = ({guildQuestAction, editGuildQuestAction, retireGuildQuestAction}) => {
    return (
        <tr>
            <td className="action-table-td left-col">{guildQuestAction.description}</td>
            <td className="action-table-td right-col">{guildQuestAction.xp} xp</td>
            <td className="action-table-td right-col">{guildQuestAction.guild}</td>
            <td className="action-table-td right-col">
              <Button variant="dark" onClick={() => editGuildQuestAction(guildQuestAction.id)}>Edit</Button>&nbsp;
              <Button variant="dark" onClick={() => retireGuildQuestAction(guildQuestAction.id)}>Reject</Button>
            </td>
        </tr>
    );
  };

  return (
    <div className="container">
      <div className="parallax">
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
                  return <GuildActionSet key={questActionSet.guildId} questActionSet={questActionSet} retireGuildQuestAction={retireGuildQuestAction} editGuildQuestAction={editGuildQuestAction} />
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildLeadership;