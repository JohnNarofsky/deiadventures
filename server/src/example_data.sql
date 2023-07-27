-- This file contains example data for the purpose of testing.

-- Setup guilds
INSERT INTO Guild (id, name)
VALUES
(1, 'Warrior'),
(2, 'Scribe'),
(3, 'Cultivator'),
(4, 'Wizard'),
(5, 'Artisan'),
(6, 'Storyteller');

-- Setup people
INSERT INTO Adventurer (id, name, email_address, password_hash, password_salt)
VALUES
(1, 'Abby Dryer', 'abby@email.com', 'fiddldygrak', '123'),
(2, 'John Narofsky', 'john@email.com', 'fiddldygrak', '456'),
(3, 'Amelia Dryer', 'amelia@email.com', 'fiddldygrak', '786'),
(4, 'Matthew Narofsky', 'matthew@email.com', 'fiddldygrak', '777');

INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
VALUES
(1, 1, 'leader'),
(1, 6, 'leader'),
(2, 5, 'leader');

INSERT INTO Permission (adventurer_id, permission_type)
VALUES
(1, 0),
(1, 1),
(2, 0),
(2, 1);

-- Setup quests
-- An "Action" is a nameless Quest with a single QuestTask.
INSERT INTO Quest (id, guild_id, quest_type)
VALUES
(0, 2, 0),
(1, 2, 0),
(2, 2, 0),
(3, 2, 0),
(4, 2, 0),
(5, 2, 0),
(6, 2, 0),
(7, 2, 0),
(8, 2, 0),
(9, 2, 0),
(10, 2, 0);

INSERT INTO QuestTask (id, quest_id, name, xp)
VALUES
(0, 0, 'Schedule a DEI meeting', 15),
(1, 1, 'Update Zoom name with pronouns', 15),
(2, 2, 'Update email signature with pronouns', 15),
(3, 3, 'Update email signature with pronouns', 15),
(4, 4, 'Track a set of DEI metrics', 50),
(5, 5, 'Draft a DEI or ERG-related survey', 50),
(6, 6, 'Review Job Descriptions to help remove bias', 75),
(7, 7, 'Review a presentation draft for Accessibility needs', 75),
(8, 8, 'Help plan a DEI-related event', 100),
(9, 9, 'Create a Fundraising Campaign', 200),
(10, 10, 'Submit a DEI presentation for an external conference', 250);


-- Make copies of quests when people start them.
-- (It'd also make sense to, instead, make copies of quests when they're updated,
-- and never delete them when anyone is associated with them.)

-- TODO: PartyMember
-- TODO: QuestDetail
