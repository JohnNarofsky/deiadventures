-- This file contains new example data.
CREATE TABLE TempQuestAction (
       -- We make this column autoincrement so we can force all members
       -- to have an ID that comes after a chosen number.
       -- This is very hacky, and the only reason we're doing it like this is cause I don't
       -- want to bother
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       guild TEXT NOT NULL,
       name TEXT NOT NULL,
       xp INTEGER NOT NULL
);

INSERT INTO TempQuestAction(id, xp, guild, name)
VALUES(1, 10,'Artisan','Ensure all your PDF''s are accessible');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(25,'Scribe','Accessibility - Scan and log accessibility tickets');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Artisan','Accessibility - Complete an Accessibility Training episode');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Artisan','Accessibility - Closing serious/critical issues');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Artisan','Accessibility - Check out your product with a screen reader');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Artisan','Accessibility - Storybook Accessibility Plugin - per component/project');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(75,'Artisan','Accessibility - Audit Designs for Accessibility');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Artisan','Complete an issue from the DEI Jira Project (medium - 3 to 5 story points)');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Artisan','Accessibility - Roadmap Accessibility issues and features');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(150,'Artisan','Accessibility - Complete Accessibility issues on a single component');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Artisan','Accessibility - Setup Accessibility Automation');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(500,'Artisan','Accessibility - Complete Accessibility issues on a single page');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Cultivator','Celebrate an employee''s DEI efforts');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Cultivator','Prevent a Manel - Ensure diversity of presenters in an event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(175,'Cultivator','Submit a colleague for an external DEI Award');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(10,'Scribe','Schedule a DEI meeting');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(10,'Storyteller','Share a DEI post on social media');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(15,'Scribe','Update Zoom name with pronouns');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(15,'Scribe','Update signature to include pronouns');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(20,'Storyteller','Promote a DEI Event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(20,'Warrior','Join An ERG');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Scribe','Coordinate calendar invite time zones');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Warrior','Attend an ERG committee meeting');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Wizard','Attend a DEI Book Club Meeting');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Artisan','Complete an issue from the DEI Jira Project (small - 2 or less story points)');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Cultivator','Recruit a new member for an ERG');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Storyteller','Share DEI Information at a meeting');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Storyteller','Promote an ERG event/meeting');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Warrior','Volunteer at an event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Cultivator','Suggest DEI program improvements');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(75,'Cultivator','Involve someone new in a DEI initiative');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(75,'Scribe','Recruiting - Review Job Descriptions for open roles to help remove bias');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Cultivator','Get a speaker on a DEI panel');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Cultivator','Recruiting - Participate in a Structured Interview');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(100,'Scribe','Help plan an event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(120,'Warrior','Find ERG partners for groups');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(150,'Cultivator','Participate in Mock Interviews at a partner organization');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(175,'Cultivator','Recruiting - Conduct interviews at a diversity-related recruitment event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(175,'Cultivator','Find Community Organizations for ERGs to work with');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Artisan','Complete an issue from the DEI Jira Project (large - 8 or more story points)');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Scribe','Create a Fundraiser Campaign for a community organization');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(350,'Scribe','Complete Best In Class submission');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Cultivator','Define DEI metrics for your team');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Warrior','Be a Guild Officer');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Warrior','Become a DEI Champion');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Warrior','Lead an event');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Warrior','Be an ERG Officer/Committee Lead');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(300,'Warrior','Found an ERG');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(350,'Cultivator','Act as a Mentor or Manager for an Intern from a DEI program');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(10,'Wizard','Complete a DEI-related book - Get Bonus Points!');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Wizard','Attend an ERG-hosted session (not patio party)');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Wizard','Complete a DEI-related LinkedIn Learning Course');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(30,'Wizard','Read a diversity-related article');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Wizard','Attend a DEI session at an external conference');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Wizard','Read a chapter in a DEI-related book');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(15,'Scribe','Track ERG Goals & Objectives');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Scribe','Track a set of DEI metrics');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(50,'Scribe','Draft a DEI or ERG related survey');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Scribe','Speaker''s Quest - Build a deck for a presentation');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Storyteller','Report on DEI metrics');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Storyteller','Speaker''s Quest - Be Part of a DEI panel');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(250,'Scribe','Speaker''s Quest - Submit a DEI presentation for an external conference');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(350,'Storyteller','Speaker''s Quest - Present a DEI topic at a conference or present at a DEI-related conference');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(15,'Storyteller','Provide information about a cultural holiday to your team');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Artisan','Produce DEI content for social media');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(200,'Artisan','Create DEI content to share internally');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(250,'Storyteller','Write a Blog post or article about a DEI event experience');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(250,'Wizard','Produce reading lists/things to watch');
INSERT INTO TempQuestAction(xp, guild, name) VALUES(300,'Wizard','Produce DEI research paper');

INSERT INTO Guild (name)
SELECT guild FROM TempQuestAction GROUP BY guild;

INSERT INTO Quest (id, guild_id, quest_type)
SELECT TempQuestAction.id, Guild.id, 0 FROM TempQuestAction
JOIN Guild ON Guild.name = TempQuestAction.guild;

INSERT INTO QuestTask (quest_id, name, xp)
SELECT id, name, xp FROM TempQuestAction;

INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(1,'Abby Dryer','abbydryer@gmail.com','$argon2id$v=19$m=19456,t=2,p=1$JEbMCefVRBxs3vVUSDWOqg$UmNmSQ37ohK2xZopfzCKorhYO4+f+MD4yl9jItx/2bE','JEbMCefVRBxs3vVUSDWOqg');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(2,'John Narofsky','john@email.com','fiddldygrak','456');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(3,'Amelia Dryer','amelia@email.com','fiddldygrak','786');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(4,'Matthew Narofsky','matthew@email.com','fiddldygrak','777');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(5,'Billy Bob Joe','billy@email.com','wawawaw','899');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(6,'Atticus Finch','finch@email.com','aaaaa','999');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(7,'The Borg','borg@borg.borg','borg','borg');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(8,'wut','wut@gmail.com','$argon2id$v=19$m=19456,t=2,p=1$q6O8aoGUJCoxeiKOwTaTaQ$HdC2EviaqQNDdUQoFKlTq0VxpNnyD3I1KvQf4feAAQM','q6O8aoGUJCoxeiKOwTaTaQ');
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt) VALUES(9,'derp','derrp@gmail.com','$argon2id$v=19$m=19456,t=2,p=1$HPNn5Pm+b85YL8P3mDh0pg$ysMXTx3D4pJ21ogwv/qt05NSzxoS/f/6IV41GGkuvmE','HPNn5Pm+b85YL8P3mDh0pg');

INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(1,1,0);
INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(2,1,1);
INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(3,1,2);
INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(4,2,0);
INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(5,2,1);
INSERT INTO Permission (id, adventurer_id, permission_type) VALUES(6,2,2);

INSERT INTO AdventurerRole (id, adventurer_id, guild_id, assigned_role) VALUES(4,2,5,'leader');

DROP TABLE TempQuestAction;
