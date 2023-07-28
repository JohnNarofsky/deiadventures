import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';

const GuildManagement = () => {

  const [guilds, setGuilds] = useState([{id:-1, title:"", leader: ""}]);
  const [adventurers, setAdventures] = useState([{id:-1, participation: []}]);
  const [targetGuild, setTargetGuild] = useState(-1);

  useEffect(()=>{
    let currentGuilds = [
      {id:1, title:"Warrior", leader: "Abby Dryer"},
      {id:2, title:"Scribe", leader: null},
      {id:3, title:"Cultivator", leader: null},
      {id:4, title:"Wizard", leader: null},
      {id:5, title:"Artisan", leader: "John Narofsky"},
      {id:6, title:"Storyteller", leader: "Abby Dryer"},
    ];
    setGuilds(currentGuilds);

    let currentAdventurers = [
      {id:1, name:"Abby Dryer", participation: ["adventurer", "leader", "management"]},
      {id:1, name:"John Narofsky", participation: ["adventurer", "leader", "management"]},
      {id:1, name:"Amelia Dryer", participation: []},
      {id:1, name:"Matthew Narofsky", participation: []},

    ];
    setAdventures(currentAdventurers);

  }, {});

  const saveGuild = (guild) => {
    console.log(guild);
    setTargetGuild(-1);
  }

  const Guild = ({guild}) => {
    let leaderText = guild.leader !== null ? "Guild Leader: " + guild.leader : "No Current Guild Leader";
    if (guild?.id === targetGuild){
      return (
        <tr>
          <td className="action-table-td left-col">{guild.title}</td>
          <td className="action-table-td left-col">{leaderText}</td>
          <td className="action-table-td right-col"><Button variant="dark" onClick={() => this.saveGuild(guild)}>Done</Button></td>
        </tr>
      );

    }
    return (
        <tr>
          <td className="action-table-td left-col">{guild.title}</td>
          <td className="action-table-td left-col">{leaderText}</td>
          <td className="action-table-td right-col"><Button variant="dark" onClick={() => this.saveGuild(guild.id)}>Edit</Button></td>
        </tr>
    );
  };

  const clearParticipation = ({id}) => {

  };

  const Adventurer = ({adventurer}) => {
    let participationText = adventurer.participation?.join(", ");
    return (
        <tr>
          <td className="action-table-td left-col">{adventurer.name}</td>
          <td className="action-table-td left-col">{participationText}</td>
          <td className="action-table-td right-col"><Button variant="dark" onClick={() => this.clearParticipation(adventurer.id)}>Edit</Button></td>
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
                <h1 className="section-top">Guild Management</h1>
                <p className="section-top-content">As a manager of guilds, it's your task to add guilds, remove guilds, accept adventurers into the game, and remove adventurers from the game.</p>
            </div>

            <div className="section quests">
              <h2>Current Guilds</h2>
              <div className="action-table-container">
                  <table className="action-table quest-examples">
                    {guilds.map((guild,index)=>{
                        return <Guild key={guild.id} guild={guild} />
                    })}
                  </table>
              </div>
            </div>
            <br/>

            <div className="section quests">
              <h2>Current Adventurers</h2>
              <div className="action-table-container">
                  <table className="action-table quest-examples">
                    {adventurers.filter((v)=>{return v.participation.length > 0}).map((adventurer,index)=>{
                        return <Adventurer key={adventurer.id} adventurer={adventurer} />
                    })}
                  </table>
              </div>
            </div>

            <div className="section quests">
              <h2>Prospective Adventurers</h2>
              <p>These are adventurers that have asked to join your game.</p>
              <div className="action-table-container">
                  <table className="action-table quest-examples">
                    {adventurers.filter((v)=>{return v.participation.length === 0}).map((adventurer,index)=>{
                        return <Adventurer key={adventurer.id} adventurer={adventurer} />
                    })}
                  </table>
              </div>
            </div>

            <div className="section quests">
              <h2>Is there a Guild Missing?</h2>
              <Button variant="dark" onClick={() => this.setTargetGuild()}>Add a Guild</Button> 
              </div>


          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildManagement;