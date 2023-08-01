import React from "react";
import Decorations from '../common/decorations';
import Quest, {QuestActions} from '../common/quest';

function Home() {
  return (
    <div className="container">
        <div className="parallax">
            <Decorations/>
            <div className="parallax__cover">
                <div className="cover-content ctop">
                    <div className="section quests">
                        <h2 className="section-top">What is the <strong>"Choose your DEI Adventure"</strong> program?</h2><br/>
                        <p className="section-top-content">
                            The Choose Your DEI Adventure Game was created in 2020 to help Morningstar improve employee engagement with
                            Diversity, Equity, and Inclusion (DEI) work.
                        </p>
                        <p className="section-top-content">
                            One of the many obstacles companies face in meeting their DEI goals is that most folks who aren't engaged in DEI either
                            don't understand the problem or don't know where to start. This game is meant to help solve both.
                        </p>
                        <p className="section-top-content">
                            Those who are unaware as to the why, this game can help address that. Through playing, they can look at various issues,
                            causes, and areas that are impactful to communities both within and outside of work. This discovery will help foster that
                            deeper understanding and give avenues where individuals are comfortable participating. For those who don't know where
                            to start, the game provides a menu of options that make it easy to engage without suffering from paralysis of analysis. The
                            2021 pilot of this program at Morningstar set a goal for all employees to earn a minimum of 1500 points in a calendar year,
                            which equated to approximately 5% of their time allocation at work.
                        </p>
                        <p className="section-top-content">
                            This is all made possible by Guild Leaders creating and maintaining a list of actions that adventurers can undertake.
                            Whether the actions are to help Employee Resource Groups (ERGs) reach their goals in outreach, education, or
                            belonging - or corporate DEI goals such as recruitment and retention.
                        </p>
                    </div>
                    <div className="section quests">
                        <h2 className="section-top">How do I play the game?</h2><br/>
                        <p className="section-top-content">
                            Getting started is easy! First, take a look at the description of each Guild below and decide which one feels best based on
                            the type of work you prefer to do. Keep in mind that you're not locked into any type of work once you've chosen a Guild.
                            Multi-guild participation is not only allowed, it is encouraged!
                        </p>
                        <p className="section-top-content">
                            After that, sign-up! After the Admin have given you the go-ahead to participate, navigate to <b>My Adventures</b> to select 
                            the actions that appeal to you. Then do that thing, come back to track your points, and find more things to do!
                        </p>
                    </div>
                    <div className="section quests">
                        <h2>Want more information?</h2>
                        Contact <a className="linkedin-link" href="https://www.linkedin.com/in/abbydryer/" target="_new">Abby Dryer</a>
                    </div>  
                </div>
                <div className="cover-div">
                    <img src="./images/dei_site_layer_trees_div_lt.png" alt="More Trees" />
                </div>
                <div className="cover-content cbttm">
                    <div className="section quests">
                        <h1 className="section-top">Guilds</h1><br/>
                        <p className="section-top-content">
                            <h3>Warriors</h3>
                            Warriors are the ones that come to mind when we think about DEI work. They're the ones that are excited to be out in the
                            fray, fighting injustice and socio-economic problems head on. Warriors are our ERG Leads, DEI/ERG committee leaders,
                            community volunteers, event planners, and DEI program leads that keep things moving forward towards continued progress.
                        </p><br/>
                        <p className="section-top-content">
                            <h3>Scribes</h3>
                            Scribes are the ones who remain outside the fray but are just as engaged in the cause. They're the ones who track the
                            themes, report on patterns, handle the logistics, and keep the Warriors informed as they head towards the chaos. Without
                            our Scribes, we wouldn't have Best Places to Work awards, or have our folks featured in various notable and
                            distinguished lists. This illustrious group also helps develop DEI Dashboards which help point us in the right direction to
                            ensure we're making a meaningful and lasting impact. Scribes are generally the invisible support structure that keep our
                            DEI efforts alive. You rarely see who is doing the work, but you can always see the benefits of their efforts.
                        </p><br/>
                        <p className="section-top-content">
                            <h3>Cultivators</h3>
                            Cultivators are the ones help our employees grow to meet their true potential. They are the ones who keep an eye to the
                            future and work with all of us to see that vision and work together towards it. Cultivators are our mentors, leaders,
                            interviewers, and generally inspire us to find the best in ourselves.
                        </p><br/>
                        <p className="section-top-content">
                            <h3>Wizards</h3>
                            Wizards are accumulators of knowledge. They always seem to have just the right information at just the right time. By
                            finding books, articles, podcasts, videos, and LinkedIn Learning Courses, their accumulated wisdom can help drive and
                            inform future adventures.
                        </p><br/>
                        <p className="section-top-content">
                            <h3>Artisans</h3>
                            Artisans are our builders, creating the things that can make a tangible change. Whether they are updating our products to
                            be more accessible and inclusive, creating art to inspire action, or building and improving the tools we use to track our
                            progress in this game, our Artisans help bring it all together in a very real way.
                        </p><br/>
                        <p className="section-top-content">
                            <h3>Storytellers</h3>
                            Storytellers bring the hype. Who would know about the adventures unfolding without someone sharing the heroic deeds
                            of their fellow adventurers? By forwarding invites, sharing stories on social media, or just plain talking about what's going
                            on to anyone who will listen, our Storytellers help us maintain our momentum and excitement as we all work together to
                            save the world.
                        </p><br/>
                    </div>
                </div>  

            </div>
        </div>
    </div>
    );
  };
  
  export default Home;
  
