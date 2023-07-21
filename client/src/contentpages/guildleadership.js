import React from "react";
import Decorations from "../common/decorations";
import Guilds from "../common/guilds";

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
            <Guilds
                  guildTitle={"Current Quests"}
                  guildDescription={"These are the current guilds."}
                  guildDetails={[
                    {title:"Warrior", detail:"Negotiating, Partnering"},
                    {title:"Scribe", detail:"Illuminating, Clarifying"},
                    {title:"Cultivator", detail:"Growing, Nurturing"},
                    {title:"Wizard", detail:"Experimenting, Testing"},
                    {title:"Artisan", detail:"Building, Securing"},
                    {title:"Storyteller", detail:"Inspiring, Sharing"},
                  ]}
                  guildActions={[
                    {description:"Add a Guild", action:"add-guild"},
                    {description:"Remove a Guild", action:"remove-guild"},
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
  
  export default GuildLeadership;