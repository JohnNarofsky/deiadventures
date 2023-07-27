import React from "react";
import Decorations from "../common/decorations";
import {QuestActions} from "../common/quest";

const MyAdventures = () => {

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
                        <p className="section-top"><strong>These are the adventure actions you've signed up for!</strong></p>
                    </div>
                    <div className="action-table-grid">
                        <div>
                            <div className="action-table-header"><h2>Scribe Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Schedule a DEI meeting", xp: "10", guild: ""},
                                    {description:"Update Zoom name with pronouns", xp: "15", guild: ""},
                                    {description:"Update email signature with pronouns", xp: "15", guild: ""},
                                    {description:"Help plan a DEI-related event", xp: "100", guild: ""},
                                    {description:"Create a Fundraising Campaign", xp: "200", guild: ""},
                                    {description:"Submit a DEI presentation for an external conference", xp: "250", guild: ""},
                                ]}
                                participateStatus="true"
                            ></QuestActions>
                        </div>    
                        <div>
                            <div className="action-table-header"><h2>Wizard Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Produce reading lists/things to watch", xp: "75", guild: ""},
                                    {description:"Create DEI content to share internally", xp: "200", guild: ""},
                                    {description:"Produce a DEI-focused research paper", xp: "200", guild: ""},
                                ]}
                                participateStatus="true"
                            ></QuestActions>
                        </div>      
                        <div>
                            <div className="action-table-header"><h2>Artisan Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Complete a ticket from a DEI-related Jira Project (2 or less story points)", xp: "250", guild: ""},
                                    {description:"Complete a ticket from a DEI-related Jira Project (3-5 story points)", xp: "400", guild: ""},
                                    {description:"Complete a ticket from a DEI-related Jira Project (8 or more story points)", xp: "500", guild: ""},
                                    {description:"Create art for the DEI Adventure Game", xp: "200", guild: ""},
                                ]}
                                participateStatus="true"
                            ></QuestActions>
                        </div>    
                    </div>
                </div>  
            </div>
        </div>
    </div>
  )};
  
export default MyAdventures;