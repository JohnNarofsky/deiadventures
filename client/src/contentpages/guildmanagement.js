import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const GuildManagement = () => {

  const [guilds, setGuilds] = useState([{id:-1, title:"", leader: ""}]);
  const [adventurers, setAdventures] = useState([{id:-1, participation: []}]);
  const [availableGuildLeaders, setAvailableGuildLeaders] = useState([]);
  const [targetGuild, setTargetGuild] = useState({id:-1, title:"", leaderId:-1, leader: ""});
  const [newGuildCreation, setNewGuildCreation] = useState(false);

  const baseURL="https://testdei.narofsky.org/api";

  useEffect(()=>{

    axios.get(baseURL + "/guild").then((response) => {
      console.log(response);
    });

    axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
      console.log(response);
    });

    axios.get(baseURL + "/user").then((response) => {
      console.log(response);
    });

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
    if (leaderName === undefined){
      leaderName = null;
    }

    let newGuilds = guilds.map((e) => {
      if (e.id === targetGuild.id){
        return {...e, title:targetGuild.title, leaderId: targetGuild.leaderId, leader: leaderName}
      }
      return {...e};
    });

    setGuilds(newGuilds);
  }

  const cancelGuild = () => {
    setTargetGuild({id:-1, title:"", leaderId: -1, leader: ""});
  };

  const cancelNewGuild = () => {
    setNewGuildCreation(false);
    setTargetGuild({id:-1, title:"", leaderId: -1, leader: ""});
  }

  const saveNewGuild = (targetGuild) => {
    let leaderName = availableGuildLeaders.filter(v=>v.id === targetGuild.leaderId)[0]?.name;
    if (leaderName === undefined){
      leaderName = null;
    }

    //TODO: Add a call the server to save this new guild...
    let newGuild = {
      id: guilds.length + 1, //TODO: this should be the result of the call
      title: targetGuild.title, 
      leaderId: targetGuild.leaderId,
      leader: leaderName
    };

    let newGuilds = [...guilds];
    newGuilds.push(newGuild);
    setNewGuildCreation(false);
    setGuilds(newGuilds);

  }

  const NewGuild = ({saveGuild, cancelGuild, availableGuildLeaders, setNewGuildCreation}) => {
    if (newGuildCreation){
      return (
        <>
          <div className="action-table-container">
              <table className="action-table quest-examples">
                <tbody>
                  <TargetGuild saveGuild={saveGuild} cancelGuild={cancelGuild} targetGuild={{id:-2, title:"", leader: ""}} availableGuildLeaders={availableGuildLeaders} />  
                </tbody>
              </table>
          </div>
          <br/>
        </>
      );
    }
    return (
      <>
        <Button variant="dark" onClick={() => {setNewGuildCreation(true);setTargetGuild({id:-2, title:"", leader: ""});}}>Add a Guild</Button> 
        <br/>
      </>
    );
    
  };

  const TargetGuild = ({saveGuild, cancelGuild, targetGuild, availableGuildLeaders}) => {
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
        <td className="action-table-td right-col">
          </td>
        <td className="action-table-td right-col">
          <Button variant="dark" onClick={() => {
            saveGuild({...targetGuild, leaderId: parseInt(currentLeaderId), title: currentTitle});
            }}>Done</Button>
          &nbsp;<Button variant="dark" onClick={cancelGuild}>Cancel</Button>
        </td>
      </tr>
    );
  };

  const Guild = ({guild, setTargetGuild}) => {
      let leaderText = guild.leader !== null ? "Guild Leader: " + guild.leader : "No Current Guild Leader";
    return (
        <tr>
          <td className="action-table-td left-col">{guild.title}</td>
          <td className="action-table-td left-col">{leaderText}</td>
          <td className="action-table-td right-col"></td>
          <td className="action-table-td right-col"><Button variant="dark" onClick={() => setTargetGuild({...guild})}>Edit</Button></td>
        </tr>
    );
  };

  const acceptAdventurer = (adventurer) => {

  }

  const rejectAdventurer = (adventurer) => {

  }

  const editAdventurer = (adventurer) => {

  }

  const Adventurer = ({adventurer, editAdventurer, rejectAdventurer}) => {
    let participationText = adventurer.participation?.join(", ");
    return (
        <tr>
          <td className="action-table-td left-col">{adventurer.name}</td>
          <td className="action-table-td left-col">{participationText}</td>
          <td className="action-table-td right-col"></td>
          <td className="action-table-td right-col">
            <Button variant="dark" onClick={() => rejectAdventurer(adventurer.id)}>Edit</Button>&nbsp;
            <Button variant="dark" onClick={() => rejectAdventurer(adventurer.id)}>Reject</Button>
          </td>
        </tr>
    );
  };

  const ProspectiveAdventurer = ({adventurer, acceptAdventurer, rejectAdventurer}) => {
    let participationText = adventurer.participation?.join(", ");
    return (
        <tr>
          <td className="action-table-td left-col">{adventurer.name}</td>
          <td className="action-table-td left-col">{participationText}</td>
          <td className="action-table-td right-col"></td>
          <td className="action-table-td right-col">
            <Button variant="dark" onClick={() => acceptAdventurer(adventurer.id)}>Accept</Button>&nbsp;
            <Button variant="dark" onClick={() => rejectAdventurer(adventurer.id)}>Reject</Button>
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
                <h1 className="section-top">Administration</h1>
                <p className="section-top-content">As an administrator of guilds, it's your task to add guilds, remove guilds, accept adventurers into the game, and remove adventurers from the game.</p>
            </div>

            <div className="section quests">
              <h2>Current Guilds</h2>
              <div className="section quests">
              <NewGuild setNewGuildCreation={setNewGuildCreation} saveGuild={saveNewGuild} cancelGuild={cancelNewGuild} availableGuildLeaders={availableGuildLeaders} />
              </div>
              <div className="action-table-container">
                  <table className="action-table quest-examples">
                    <tbody>
                    {guilds.map((guild,index)=>{
                      if (guild.id === targetGuild.id){
                        return <TargetGuild key={index} saveGuild={saveGuild} cancelGuild={cancelGuild} targetGuild={targetGuild} availableGuildLeaders={availableGuildLeaders} />  
                      }
                      return <Guild key={index} guild={guild} setTargetGuild={setTargetGuild} availableGuildLeaders={availableGuildLeaders} />
                    })}
                    </tbody>
                  </table>
              </div>
            </div>
            <br/>

            <div className="section quests">
              <h2>Current Adventurers</h2>
              <div className="action-table-container">
                  <table className="action-table quest-examples"><tbody>
                    {adventurers.filter((v)=>{return v.participation.length > 0}).map((adventurer,index)=>{
                        return <Adventurer key={adventurer.id} rejectAdventurer={rejectAdventurer} editAdventurer={editAdventurer} adventurer={adventurer} />
                    })}
                  </tbody></table>
              </div>
            </div>

            <div className="section quests">
              <h2>Prospective Adventurers</h2>
              <p>These are adventurers that have asked to join your game.</p>
              <div className="action-table-container">
                  <table className="action-table quest-examples"><tbody>
                    {adventurers.filter((v)=>{return v.participation.length === 0}).map((adventurer,index)=>{
                        return <ProspectiveAdventurer key={adventurer.id} adventurer={adventurer} acceptAdventurer={acceptAdventurer} rejectAdventurer={rejectAdventurer} />
                    })}
                  </tbody></table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )

  };
  
  export default GuildManagement;