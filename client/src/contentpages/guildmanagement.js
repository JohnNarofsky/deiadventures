import React from "react";
import Decorations from "../common/decorations";
import Guilds from "../common/guilds";

const GuildManagement = () => {

  return (
    <div className="container">
      <div className="parallax">
        <Decorations/> 
        <div className="parallax__cover">
          <div className="cover-content ctop">
            <div className="section quests">
                <h1 className="section-top">Guild Management</h1>
                <p className="section-top-content">As a manager of guilds, it's your task to add guilds, remove guilds, accept adventurers into the game, and remove adventurers from the game.</p>
            </div>
            <Guilds
                  guildTitle={"Current Guilds"}
                  guildDescription={"These are the current guilds."}
                  guildDetails={[
                    {title:"Warrior", detail:"Guild Leader: Abby Dryer"},
                    {title:"Scribe", detail:"No current Guild Leader"},
                    {title:"Cultivator", detail:"No current Guild Leader"},
                    {title:"Wizard", detail:"No current Guild Leader"},
                    {title:"Artisan", detail:"Guild Leader: John Narofsky"},
                    {title:"Storyteller", detail:"Guild Leader: Abby Dryer"},
                  ]}
                  guildActions={[
                    {description:"Add a Guild", action:"add-guild"},
                    {description:"Remove a Guild", action:"remove-guild"},
                    {description:"Change a Guild Leader", action:"change-guildleader"},
                    {description:"Accept Adventurers", action:"accept-adventurers"},
                    {description:"Remove Adventurers", action:"remove-adventurers"},
                  ]}
                ></Guilds>
          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildManagement;