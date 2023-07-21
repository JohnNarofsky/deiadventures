import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const GuildTitle = ({guildTitle}) => {
    return (
        <h2>{guildTitle}</h2>
    )
}

export const GuildDescription = ({guildDescription}) => {
    return(
        <p>{guildDescription}</p>
    );
}

const GuildDetail = ({title, detail}) => {
    return(
        <div className="action-table-header"><h3>{title}</h3></div>
    );
}

const GuildAction = ({description, action}) => {
    return (
        <tr>
            <td className="action-table-td left-col"><Link to={action}>{description}</Link></td>
        </tr>
    );
};

export const GuildActions = ({guildActions}) => {
    return(
        <div className="action-table-container">
            <table className="action-table quest-examples">
            {guildActions.map((guildAction,index)=>{
                return <GuildAction description={guildAction.description} action={guildAction.action} />
            })}
            </table>
        </div>
    );
};

export const GuildNotes = ({guildNotes}) => {
    return (
        <p>{guildNotes}</p>
    );
};

export default function Guilds({guildTitle, guildDescription, guildDetails, guildActions}) {
    let actionTitle = <></>;
    let actions = <></>;
    if (guildActions.length > 0){
        actionTitle = <><br/><GuildDetail title="Guild Actions" detail="" /></>;
        actions = <GuildActions guildActions={guildActions}/>;
    }


    return(
        <div className="section quests">
            <GuildTitle guildTitle={guildTitle} />
            <GuildDescription guildDescription={guildDescription}/>
            {guildDetails.map((guildDetail) => (
                <GuildDetail title={guildDetail.title} detail ={guildDetail.detail}/>
            ))}
            {actionTitle}
            {actions}
        </div>
    );
}