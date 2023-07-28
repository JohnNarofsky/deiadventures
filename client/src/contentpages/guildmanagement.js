import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const GuildManagement = () => {

  const [guilds, setGuilds] = useState([{id:-1, title:"", leader: ""}]);
  const [adventurers, setAdventures] = useState([{id:-1, participation: []}]);
  const [availableGuildLeaders, setAvailableGuildLeaders] = useState([]);
  const [targetGuild, setTargetGuild] = useState({id:-1, title:"", leaderId:-1, leader: ""});

  useEffect(()=>{
    let currentGuilds = [
      {id:1, title:"Warrior", leaderId: 1, leader: "Abby Dryer"},
      {id:2, title:"Scribe", leaderId: -1, leader: null},
      {id:3, title:"Cultivator", leaderId: -1, leader: null},
      {id:4, title:"Wizard", leaderId: -1,  leader: null},
      {id:5, title:"Artisan", leaderId: 2, leader: "John Narofsky"},
      {id:6, title:"Storyteller", leaderId: 1, leader: "Abby Dryer"},
    ];
    setGuilds(currentGuilds);

    let currentAdventurers = [
      {id:1, name:"Abby Dryer", participation: ["adventurer", "leader", "management"]},
      {id:2, name:"John Narofsky", participation: ["adventurer", "leader", "management"]},
      {id:3, name:"Amelia Dryer", participation: []},
      {id:4, name:"Matthew Narofsky", participation: []},

    ];
    setAdventures(currentAdventurers);

    let currentAvailableGuildLeaders = [
        {id:1, name:"Abby Dryer", participation: ["adventurer", "leader", "management"]},
        {id:2, name:"John Narofsky", participation: ["adventurer", "leader", "management"]},
    ];
    setAvailableGuildLeaders(currentAvailableGuildLeaders);

  }, []);

  useEffect(()=>{
    setTargetGuild({id:-1, title:"", leaderId: -1, leader: ""});
  }, [guilds]);

  const saveGuild = (targetGuild) => {
    let leaderName = availableGuildLeaders.filter(v=>v.id === targetGuild.leaderId)[0]?.name;

    let newGuilds = guilds.map((e) => {
      if (e.id === targetGuild.id){
        return {...e, leaderId: targetGuild.leaderId, leader: leaderName}
      }
      return {...e};
    });

    setGuilds(newGuilds);
  }

  const TargetGuild = ({saveGuild, targetGuild, availableGuildLeaders}) => {
    const [currentTitle, setCurrentTitle] = useState(targetGuild.title);
    const [currentLeaderId, setCurrentLeaderId] = useState(targetGuild.leaderId)
    const handleChangeTitle = (event) => {
      setCurrentTitle(event.target.value);
    }

    const handleChangeLeader = (event) => {
      setCurrentLeaderId(event.target.value);
    }

    return (
      <tr>
        <td className="action-table-td left-col"><input onChange={handleChangeTitle} value={currentTitle} /></td>
        <td className="action-table-td left-col">
          <select value={currentLeaderId} onChange={handleChangeLeader}>
            <option value="-1">No Guild Leader</option>
            {availableGuildLeaders.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </td>
        <td className="action-table-td right-col"><Button variant="dark" onClick={() => {
          saveGuild({...targetGuild, leaderId: parseInt(currentLeaderId), title: currentTitle});
          }}>Done</Button></td>
      </tr>
    );
  }

  const Guild = ({guild, setTargetGuild}) => {
      let leaderText = guild.leader !== null ? "Guild Leader: " + guild.leader : "No Current Guild Leader";
    return (
        <tr>
          <td className="action-table-td left-col">{guild.title}</td>
          <td className="action-table-td left-col">{leaderText}</td>
          <td className="action-table-td right-col"><Button variant="dark" onClick={() => setTargetGuild({...guild})}>Edit</Button></td>
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
                      if (guild.id === targetGuild.id){
                        return <TargetGuild key={index} saveGuild={saveGuild} targetGuild={targetGuild} availableGuildLeaders={availableGuildLeaders} />  
                      }
                      return <Guild key={index} guild={guild} setTargetGuild={setTargetGuild} availableGuildLeaders={availableGuildLeaders} />
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