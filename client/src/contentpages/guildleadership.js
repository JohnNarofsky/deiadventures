import React from "react";
import Decorations from "../common/decorations";
import {QuestActions} from "../common/quest";

const GuildLeadership = () => {

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
            <div className="action-table-header"><h2>Scribe Actions</h2></div>
              <QuestActions
                  questActions={[
                      {id:1, description:"Schedule a DEI meeting", xp: "10", guild: ""},
                      {id:2, description:"Update Zoom name with pronouns", xp: "15", guild: ""},
                      {id:3, description:"Update email signature with pronouns", xp: "15", guild: ""},
                      {id:4, description:"Track a set of DEI metrics", xp: "50", guild: ""},
                      {id:5, description:"Draft a DEI or ERG-related survey", xp: "50", guild: ""},
                      {id:6, description:"Review Job Descriptions to help remove bias", xp: "75", guild: ""},
                      {id:7, description:"Review a presentation draft for Accessibility needs", xp: "75", guild: ""},
                      {id:8, description:"Help plan a DEI-related event", xp: "100", guild: ""},
                      {id:9, description:"Create a Fundraising Campaign", xp: "200", guild: ""},
                      {id:10, description:"Submit a DEI presentation for an external conference", xp: "250", guild: ""},
                  ]}
                  editStatus="true"
              ></QuestActions>
          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildLeadership;