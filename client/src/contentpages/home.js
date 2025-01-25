import React, { useState, useEffect } from "react";
import MDEditor from '@uiw/react-md-editor';
import file from "./home.md";

function Home() {

    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        fetch(file)
        .then((res) => res.text())
        .then((text) => setMarkdown(text));

        console.log(markdown);
    });


    return (
        <>
            <div className="cover-div">
                <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
            </div>
            <div className="cover-content cbttm">
                <div className="section quests">
                    <MDEditor.Markdown source={markdown} style={{ whiteSpace: 'pre-wrap' }} />
                </div>
            </div>
        </>
    );
};

export default Home;
