import React, { useEffect, useState } from "react";

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

const QuestAction = ({description, xp, guild}) => {
    return (
        <></>
    );
};

const QuestActions = ({questActions}) => {
    if (questActions.length === 0){
        return <></>;
    }

    return(
        <>
        <QuestDetail title="Quest Actions" detail="" />
        {questActions.map((questAction)=>{
            <QuestAction description={questAction.Description} xp={questAction.Xp} guild={questAction.Guild} />
        })}
        </>
    );
};

export const QuestNotes = ({questNotes}) => {
    return (
        <></>
    );
};

export default function Quest({questTitle, questDescription, questDetails, questActions, questNotes}) {
    return(
        <div className="section quests">
            <QuestTitle questTitle={questTitle} />
            <QuestDescription questDescription={questDescription}/>
            {questDetails.map((questDetail) => (
                <QuestDetail title={questDetail.Title} detail ={questDetail.Detail}/>
            ))}
            <QuestActions questActions={questActions}/>
            <QuestNotes questNotes={questNotes}/>
        </div>
    );
}