import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const QuestTitle = ({questTitle}) => {
    return (
        <h2>{questTitle}</h2>
    )
}

export const QuestDescription = ({questDescription}) => {
    return(
        <p>{questDescription}</p>
    );
}

const QuestDetail = ({title, detail}) => {
    return(
        <div className="action-table-header"><h3>{title}: <span className="quest-detail">{detail}</span></h3></div>
    );
}

const QuestActionChanges = ({questActionChanges}) => {
    if (questActionChanges.length === 0){
        return <></>;
    }
    return(
        questActionChanges.map((questActionChange)=>{
            return <td className="action-table-td right-col"><Link to={questActionChange.path}>{questActionChange.description}</Link></td>
        })
    );
}

const QuestAction = ({id,description, xp, guild, editStatus, participateStatus}) => {
    let questActionChanges = [];

    if (editStatus==="true"){
        questActionChanges = [
            {description:"Edit", path:"./quest-edit:" + id},
            {description:"Copy", path:"./quest-copy:" + id},
            {description:"Retire", path:"./quest-retire:" + id},
          ];
    }
    if (participateStatus==="true"){
        questActionChanges = [
            {description:"Complete", path:"./complete:" + id},
            {description:"Retire", path:"./retire:" + id},
          ];
    }

    let actionChanges = <QuestActionChanges questActionChanges={questActionChanges}></QuestActionChanges>;

    return (
        <tr>
            <td className="action-table-td left-col">{description}</td>
            <td className="action-table-td right-col">{xp} xp</td>
            <td className="action-table-td right-col">{guild}</td>
            {actionChanges}
        </tr>
    );
};

export const QuestActions = ({questActions, editStatus, participateStatus, reviewStatus}) => {
    return(
        <div className="action-table-container">
            <table className="action-table quest-examples">
            {questActions.map((questAction,index)=>{
                return <QuestAction
                    id={questAction.id}
                    description={questAction.description} 
                    xp={questAction.xp} 
                    guild={questAction.guild} 
                    editStatus={editStatus} 
                    participateStatus={participateStatus} 
                    reviewStatus={reviewStatus} />
            })}
            </table>
        </div>
    );
};

export const QuestNotes = ({questNotes}) => {
    return (
        <p>{questNotes}</p>
    );
};

export default function Quest({questTitle, questDescription, questDetails, questActions, questNotes}) {
    let actionTitle = <></>;
    let actions = <></>;
    if (questActions.length > 0){
        actionTitle = <QuestDetail title="Quest Actions" detail="" />;
        actions = <QuestActions questActions={questActions}/>;
    }


    return(
        <div className="section quests">
            <QuestTitle questTitle={questTitle} />
            <QuestDescription questDescription={questDescription}/>
            {questDetails.map((questDetail) => (
                <QuestDetail title={questDetail.title} detail ={questDetail.detail}/>
            ))}
            {actionTitle}
            {actions}
            <QuestNotes questNotes={questNotes}/>
        </div>
    );
}