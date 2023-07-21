import React from "react";
import Decorations from '../landingpage/decorations';
import Quest, {QuestActions} from '../landingpage/quest';

function Home() {
  return (
    <div className="container">
        <div className="parallax">
            <Decorations/>
            <div className="parallax__cover">
                <div className="cover-content ctop">
                    <div className="section quests">
                        <h1 className="section-top">Welcome Adventurers!</h1>
                        <p className="section-top-content">This guide is for all Game Masters <strong>or GM's</strong> out there looking to start a Choose Your DEI Adventure game. Following these starting quests will help you along your journey. Good luck!</p>
                    </div>
                    <Quest 
                        questTitle={"First Quest: Assemble the Adventure"} 
                        questDescription={"Confirm that your company has formal, actionable DEI Goals & Objectives that can be aligned with the actions in the game. Without clear Goals and Objectives, the actions will not be as impactful, and you'll do a lot of work for minimal results. Find at least one executive sponsor. This person will be the one to make sure that the efforts within the game are prioritized and funded (where needed). Assemble your Guild Leaders to manage and support the players if they need help with any of the actions in the game. In this guide, we're using six guilds - Warrior, Scribe, Cultivator, Wizard, Artisan, and Storyteller.                   But feel free to custimize guilds as you like. Next, gather your employees that are ready to take on a grass-roots initiative to work on DEI. These are the folks that will help the guild leaders design quests and play the game. Once these are in place, you're ready for your second quest!"} 
                        questActions={[]}
                        questDetails={[]}
                        >
                    </Quest>
                    <Quest
                        questTitle={"Second Quest: Draw the Map"}
                        questDescription={"Align your company Goals & Objectives to actions in the game. Take a look at the actions for each Guild and create Quests for you and your colleagues to embark on to help meet those goals. An example:"}
                        questDetails={[{title:"Company DEI Goal", detail:"Diversity in Hiring/Recruitment"}, {title:"Quest", detail:"Recruitment Quest"},{title:"Required Guilds", detail:"Scribe & Cultivator"}]}
                        questActions={[
                            {description:"Review Job Descriptions for open roles to remove bias", xp:"75", guild:"Scribe"},
                            {description:"Participate in a Structured Interview", xp:"100", guild:"Cultivator"},
                            {description:"Conduct interviews at a diversity-related recruitment event", xp:"175", guild:"Cultivator"},
                        ]}
                        questNotes={"Partner with your grassroots groups in your company, such as Employee Resource Groups. What quests would they like to organize for folks to participate in? Share the quests you've created with your Executive Sponsor(s). Get their feedback and buy-in before you launch. Decide how you want to track points until the tracker is finished. Some teams prefer Excel, while others prefer Microsoft Forms for folks to enter the actions they've completed and accumulate points. Now the real fun begins! "}
                    >
                    </Quest>
                    <Quest
                        questTitle={"Third Quest: Gather Your Adventure Parties and Play!"}
                        questDescription={"You know what's best for your organization when it comes to rolling out large scale initiatives, so do what works for you. Town Halls, Emails, Intranet Links, Word of Mouth - it's all likely going to be necessary to get folks excited about the game! As the adventure unfolds, share your stories (and get Storyteller points!) on social media with the hashtag #DEIAdventureGame so we can all be inspired! "}
                        questDetails={[]}
                        questActions={[]}
                        questNotes={""}
                    >
                    </Quest>
                    <div className="section quests">
                        <h2>Want more information?</h2>
                        Contact <a className="linkedin-link" href="https://www.linkedin.com/in/abbydryer/" target="_new">Abby Dryer</a>
                    </div>  
                </div>
                <div className="cover-div">
                    <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
                </div>
                <div className="cover-content cbttm">
                    <div className="section quests">
                        <h1 className="section-top">Ideas for Guild Actions</h1>
                        <p className="section-top-content">Members of a guild can complete actions to gain experience points <strong>(XP)</strong>. As adventurers continue to accumulate points, they can ‘level up’ and gain other abilities, like being able to define quests or lead Adventure parties. </p>
                    </div>
                    <div className="action-table-grid">
                        <div>
                            <div className="action-table-header"><h2>Warrior Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Join an Employee Resource Group (ERG)", xp: "20", guild: ""},
                                    {description:"Attend an ERG event", xp: "30", guild: ""},
                                    {description:"Attend an ERG Committee meeting", xp: "50", guild: ""},
                                    {description:"Find ERG partners for groups", xp: "120", guild: ""},
                                    {description:"Be a Guild Leader", xp: "200", guild: ""},
                                    {description:"Be a DEI Champion", xp: "200", guild: ""},
                                    {description:"Be an ERG Officer or Committee Lead", xp: "200", guild: ""},
                                    {description:"Run a DEI-related event", xp: "200", guild: ""},
                                    {description:"Found an ERG", xp: "300", guild: ""}
                                ]}
                            ></QuestActions>
                        </div>    
                        <div>
                            <div className="action-table-header"><h2>Scribe Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Schedule a DEI meeting", xp: "10", guild: ""},
                                    {description:"Update Zoom name with pronouns", xp: "15", guild: ""},
                                    {description:"Update email signature with pronouns", xp: "15", guild: ""},
                                    {description:"Track a set of DEI metrics", xp: "50", guild: ""},
                                    {description:"Draft a DEI or ERG-related survey", xp: "50", guild: ""},
                                    {description:"Review Job Descriptions to help remove bias", xp: "75", guild: ""},
                                    {description:"Review a presentation draft for Accessibility needs", xp: "75", guild: ""},
                                    {description:"Help plan a DEI-related event", xp: "100", guild: ""},
                                    {description:"Create a Fundraising Campaign", xp: "200", guild: ""},
                                    {description:"Submit a DEI presentation for an external conference", xp: "250", guild: ""},
                                ]}
                            ></QuestActions>
                        </div>    
                        <div>
                            <div className="action-table-header"><h2>Cultivator Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Celebrate an emplyee's DEI efforts", xp: "50", guild: ""},
                                    {description:"Recruit a new member for an ERG", xp: "50", guild: ""},
                                    {description:"Involve someone new in a DEI initiative", xp: "75", guild: ""},
                                    {description:"Arrange a speaker for a DEI panel", xp: "100", guild: ""},
                                    {description:"Conduct interviews at a diversity-related recruitment event", xp: "150", guild: ""},
                                    {description:"Find Community Organizations for ERGs to work with", xp: "175", guild: ""},
                                    {description:"Submit a colleague for an external DEI Award", xp: "175", guild: ""},
                                    {description:"Define DEI metrics for your team", xp: "175", guild: ""},
                                    {description:"Act as a Mentor or Manager for a DEI program", xp: "200", guild: ""},
                                ]}
                            ></QuestActions>
                        </div>    
                        <div>
                            <div className="action-table-header"><h2>Wizard Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Use your education stipend to purchase DEI-related materials or DEI Conference tickets", xp: "5", guild: ""},
                                    {description:"Complete a DEI-focused Learning Course", xp: "30", guild: ""},
                                    {description:"Participate in a DEI-focused Book Club", xp: "30", guild: ""},
                                    {description:"Attend a DEI session at an external conference", xp: "30", guild: ""},
                                    {description:"Read a chapter in a DEI-related book", xp: "50", guild: ""},
                                    {description:"Suggest DEI improvements to your DEI Champion", xp: "50", guild: ""},
                                    {description:"Attend an Inclusive Leader Workshop in your region", xp: "50", guild: ""},
                                    {description:"Produce reading lists/things to watch", xp: "75", guild: ""},
                                    {description:"Create DEI content to share internally", xp: "200", guild: ""},
                                    {description:"Produce a DEI-focused research paper", xp: "200", guild: ""},
                                ]}
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
                            ></QuestActions>
                        </div>    
                        <div>
                            <div className="action-table-header"><h2>Storyteller Actions</h2></div>
                            <QuestActions
                                questActions={[
                                    {description:"Share a DEI post on social media", xp: "10", guild: ""},
                                    {description:"Provide information about a cultural holiday to your team", xp: "15", guild: ""},
                                    {description:"Promote a DEI Event", xp: "20", guild: ""},
                                    {description:"Share DEI information at a meeting", xp: "50", guild: ""},
                                    {description:"Promote an ERG event/meeting", xp: "50", guild: ""},
                                    {description:"Produce DEI content for social media", xp: "175", guild: ""},
                                    {description:"Be part of a DEI panel", xp: "200", guild: ""},
                                    {description:"Write a blog post or article about a DEI event experience", xp: "250", guild: ""},
                                    {description:"Produce a DEI-focused research paper", xp: "300", guild: ""},
                                    {description:"Present at a national/international conference", xp: "350", guild: ""},
                                ]}
                            ></QuestActions>
                        </div>     
                    </div>
                </div>  
            </div>
        </div>
    </div>
    );
  };
  
  export default Home;
  
