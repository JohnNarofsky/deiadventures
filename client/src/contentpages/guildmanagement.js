import React from "react";
import { useEffect, useCallback, useState } from 'react';
import Decorations from "../common/decorations";
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import './guildmanagement.css';
import baseURL from '../api_config.json'

const GuildManagement = () => {

  const [guilds, setGuilds] = useState([{id:-1, name:"", leader_id: ""}]);
  const [adventurers, setAdventurers] = useState([{id:-1, permissions: []}]);
  const [availableGuildLeaders, setAvailableGuildLeaders] = useState([]);
  const [targetGuild, setTargetGuild] = useState({id:-1, name:"", leader_id:-1, leader_name: ""});
  const [newGuildCreation, setNewGuildCreation] = useState(false);


  useEffect(()=>{

    axios.get(baseURL + "/guild").then((response) => {
      setGuilds(response.data);
    });

    axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
      setAvailableGuildLeaders(response.data);
    });

    axios.get(baseURL + "/user").then((response) => {
      setAdventurers(response.data);
    });

  }, []);

  useEffect(()=>{
    setTargetGuild({id:-1, title:"", leader_id: -1, leader: ""});
  }, [guilds]);

  const saveGuild = (targetGuild) => {
    let leaderName = availableGuildLeaders.filter(v=>v.id === targetGuild.leader_id)[0]?.name;
    if (leaderName === undefined){
      leaderName = null;
    }
    const data = {name: targetGuild.name, leader_id: targetGuild.leader_id !== -1? targetGuild.leader_id : null};
    axios.put(baseURL + "/guild/" + targetGuild.id, data).then((response) => {});

    let newGuilds = guilds.map((e) => {
      if (e.id === targetGuild.id){
        return {...e, name:targetGuild.name, leader_id: targetGuild.leader_id, leader_name: leaderName}
      }
      return {...e};
    });

    setGuilds(newGuilds);
  }

  const cancelGuild = () => {
    setTargetGuild({id:-1, title:"", leader_id: -1, leader: ""});
  };

  const cancelNewGuild = () => {
    setNewGuildCreation(false);
    setTargetGuild({id:-1, title:"", leader_id: -1, leader: ""});
  }

  const saveNewGuild = (targetGuild) => {
    let leaderName = availableGuildLeaders.filter(v=>v.id === targetGuild.leader_id)[0]?.name;
    if (leaderName === undefined){
      leaderName = null;
    }

    let newGuild = {
      id: -1, 
      name: targetGuild.name, 
      leader_id: targetGuild.leader_id,
      leader_name: leaderName
    };

    let data = {name: targetGuild.name, leader_id: targetGuild.leader_id};
    axios.post(baseURL + "/guild", data).then((response) => {
      newGuild.id = response.data;
      let newGuilds = [...guilds];
      newGuilds.push(newGuild);
      setNewGuildCreation(false);
      setGuilds(newGuilds);
    });
  }

  const NewGuild = ({saveGuild, cancelGuild, availableGuildLeaders, setNewGuildCreation}) => {
    if (newGuildCreation){
      return (
        <>
          <div className="sub-content">
            <div className="action-title">Adding a New Guild</div>
            <TargetGuild saveGuild={saveGuild} cancelGuild={cancelGuild} targetGuild={{id:-2, name:"", leader_id: -1, leader_name: null}} availableGuildLeaders={availableGuildLeaders} />  
          </div>
        </>
      );
    }
    return (
      <>
        <Button className="sub-action" variant="dark" onClick={() => {setNewGuildCreation(true);setTargetGuild({id:-2, name:"", leader_id: -1, leader_name: null});}}>Add a Guild</Button> 
      </>
    );
    
  };

  const TargetGuild = ({saveGuild, cancelGuild, targetGuild, availableGuildLeaders}) => {
    const [currentName, setCurrentName] = useState(targetGuild.name);
    const [currentleader_id, setCurrentleader_id] = useState(targetGuild.leader_id);
    const handleChangeName = (event) => {
      setCurrentName(event.target.value);
    }

    const handleChangeLeader = (event) => {
      setCurrentleader_id(event.target.value);
    }

    return (
      <div className="action">
          <input onChange={handleChangeName} value={currentName} />
          <select value={currentleader_id?currentleader_id:-1} onChange={handleChangeLeader}>
            <option value="-1">No Guild Leader</option>
            {availableGuildLeaders.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <div>
            <Button variant="dark" onClick={() => {
              saveGuild({...targetGuild, leader_id: parseInt(currentleader_id), name: currentName});
              }}>Done</Button>
            &nbsp;<Button variant="dark" onClick={cancelGuild}>Cancel</Button>
          </div>
      </div>
    );
  };

  const Guild = ({guild, setTargetGuild}) => {
    let leaderText = guild.leader_name !== null ? "Guild Leader: " + guild.leader_name : "No Current Guild Leader";
    return (
        <div className="listing">
          <div className="details">
            <div>{guild.name}</div>
            <div>{leaderText}</div>
          </div>
          <div className="actions"><Button variant="dark" onClick={() => setTargetGuild({...guild})}>Edit</Button></div>
        </div>
    );
  };

  const acceptAdventurer = (adventurer) => {
    const data = {set: true};
    axios.put(baseURL + "/perm/" + adventurer.id + "/accepted", data).then((response) => {
      axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
        setAvailableGuildLeaders(response.data);
      });
  
      axios.get(baseURL + "/user").then((response) => {
        setAdventurers(response.data);
      });
    });
  }

  const rejectAdventurer = (adventurer) => {
    // .route("/perm/:user_id/rejected", put(set_user_rejected))
    const data = {set: true};
    axios.put(baseURL + "/perm/" + adventurer.id + "/rejected", data).then((response) => {
      axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
        setAvailableGuildLeaders(response.data);
      });
  
      axios.get(baseURL + "/user").then((response) => {
        setAdventurers(response.data);
      });
    });


  }

  const toggleSuperUser = (adventurer) => {
    const data = adventurer.permissions.filter((p) => p.type === "SuperUser").length !== 0 ? {set: false} : {set: true};
    axios.put(baseURL + "/perm/" + adventurer.id + "/superuser", data).then((response) => {
      axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
        setAvailableGuildLeaders(response.data);
      });
  
      axios.get(baseURL + "/user").then((response) => {
        setAdventurers(response.data);
      });
    });
  }

  const toggleAvailableGuildLeader = (adventurer) => {
    // .route("/perm/:user_id/eligible-guild-leader", put(set_user_eligible_guild_leader))
    const data = adventurer.permissions.filter((p) => p.type === "GuildLeaderEligible").length !== 0 ? {set: false} : {set: true};
    axios.put(baseURL + "/perm/" + adventurer.id + "/eligible-guild-leader", data).then((response) => {
      axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
        setAvailableGuildLeaders(response.data);
      });
  
      axios.get(baseURL + "/user").then((response) => {
        setAdventurers(response.data);
      });
    });
  }

  const toggleApprovedAdventurer = (adventurer) => {
    const data = adventurer.permissions.filter((p) => p.type === "Approved").length !== 0 ? {set: false} : {set: true};
    axios.put(baseURL + "/perm/" + adventurer.id + "/accepted", data).then((response) => {
      axios.get(baseURL + "/perm/allowed-leaders").then((response) => {
        setAvailableGuildLeaders(response.data);
      });
  
      axios.get(baseURL + "/user").then((response) => {
        setAdventurers(response.data);
      });
    });
  }

  const Adventurer = ({adventurer, toggleSuperUser, toggleAvailableGuildLeader, toggleApprovedAdventurer}) => {
    let permissionText = adventurer.permissions.map((v)=>{return v.type;}).join(", ");
    return (
        <div className="listing">
          <div className="details">
            <div>{adventurer.name}</div>
            <div>{permissionText}</div>
          </div>
          <div className="actions">
            <Button variant="dark" onClick={() => toggleSuperUser(adventurer)}>Admin</Button>&nbsp;
            <Button variant="dark" onClick={() => toggleAvailableGuildLeader(adventurer)}>Leader</Button>&nbsp;
            <Button variant="dark" onClick={() => toggleApprovedAdventurer(adventurer)}>Approved</Button>
          </div>
        </div>
    );
  };

  const ProspectiveAdventurer = ({adventurer, acceptAdventurer, rejectAdventurer}) => {
    return (
        <div className="listing">
          <div className="details">
            <div>{adventurer.name}</div>
          </div>
          <div className="actions">
            <Button variant="dark" onClick={() => acceptAdventurer(adventurer)}>Accept</Button>&nbsp;
            <Button variant="dark" onClick={() => rejectAdventurer(adventurer)}>Reject</Button>
          </div>
        </div>
    );
  };


  return (
    <>
      <div className="main">
        <div className="main-title">Administration</div>
        <div className="main-description">As an administrator of guilds, it's your task to add guilds, remove guilds, accept adventurers into the game, and remove adventurers from the game.</div>
        <div className="main-description">Coalitions are an upcoming feature.</div>
        <div className="content">

          <div className="sub-content">
            <div className="sub-title">Current Guilds</div>
            <div className="sub-content">
              <NewGuild setNewGuildCreation={setNewGuildCreation} saveGuild={saveNewGuild} cancelGuild={cancelNewGuild} availableGuildLeaders={availableGuildLeaders} />
              {guilds.map((guild,index)=>{
                    if (guild.id === targetGuild.id){
                      return <TargetGuild key={index} saveGuild={saveGuild} cancelGuild={cancelGuild} targetGuild={targetGuild} availableGuildLeaders={availableGuildLeaders} />  
                    }
                    return <Guild key={index} guild={guild} setTargetGuild={setTargetGuild} availableGuildLeaders={availableGuildLeaders} />
                  })}
            </div>
          </div>

          <div className="sub-content">
            <div className="sub-title">Prospective Adventurers</div>
            <div className="sub-content">
              {adventurers.filter((v)=>{return v.permissions?.length === 0}).map((adventurer,index)=>{
                      return <ProspectiveAdventurer key={adventurer.id} adventurer={adventurer} acceptAdventurer={acceptAdventurer} rejectAdventurer={rejectAdventurer} />
                  })}
              </div>
          </div>

          <div className="sub-content">
            <div className="sub-title">Current Adventurers</div>
            <div className="sub-content">
              {adventurers.filter((v)=>{return v.permissions?.filter((p) => p.type === "Approved").length !== 0}).map((adventurer,index)=>{
                      return <Adventurer key={adventurer.id} toggleApprovedAdventurer={toggleApprovedAdventurer} toggleSuperUser={toggleSuperUser} toggleAvailableGuildLeader={toggleAvailableGuildLeader} adventurer={adventurer} />
                  })}
            </div>
          </div>

        </div>

      </div>
    </>

    )

  };
  
  export default GuildManagement;