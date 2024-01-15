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
-- The password is all 'fiddldygrak'.
(1, 'Abby Dryer', 'abby@email.com', '$argon2id$v=19$m=19456,t=2,p=1$SYxmVBOz/Dg3j0o0qR9lLg$NPQd7qoesKAeXpg9yUsPwaoEYaPikXiG4vwEJLrG6m0', 'SYxmVBOz/Dg3j0o0qR9lLg'),
(2, 'John Narofsky', 'john@email.com', '$argon2id$v=19$m=19456,t=2,p=1$oGLhpFlG9xD9qlWvoq5jZw$pA2StIiTIH3P5x2lcubQ0QSh2N4XGHH/9d7lDljHTwk', 'oGLhpFlG9xD9qlWvoq5jZw'),
(3, 'Amelia Dryer', 'amelia@email.com', '$argon2id$v=19$m=19456,t=2,p=1$WxD79BpDaGJUiE/vcRDurg$Q5xyBE8gXaXC9TnSU3X+aA5FzUsnbbdSB6bG1HQTL7U', 'WxD79BpDaGJUiE/vcRDurg'),
(4, 'Matthew Narofsky', 'matthew@email.com', '$argon2id$v=19$m=19456,t=2,p=1$DFkzua2QY3SHkxrYE1/wAg$M3H+WVmVRQlc/pndMsYvYe6223G9TZKs2O549fnwvZc', 'DFkzua2QY3SHkxrYE1/wAg');

INSERT INTO AdventurerRole (adventurer_id, guild_id, assigned_role)
VALUES
(1, 1, 'leader'),
(1, 6, 'leader'),
(1, 2, 'leader'),
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
--(3, 2, 0),
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
--(3, 3, 'Update email signature with pronouns', 15),
(4, 4, 'Track a set of DEI metrics', 50),
(5, 5, 'Draft a DEI or ERG-related survey', 50),
(6, 6, 'Review Job Descriptions to help remove bias', 75),
(7, 7, 'Review a presentation draft for Accessibility needs', 75),
(8, 8, 'Help plan a DEI-related event', 100),
(9, 9, 'Create a Fundraising Campaign', 200),
(10, 10, 'Submit a DEI presentation for an external conference', 250);


-- Make copies of quests when people start them.
-- (It'd also make sense to, instead, make copies of quests when they're updated,
-- and never delete them when anyone is associated with them.
-- Basically garbage collected Copy-on-Write semantics.
-- I suspect such an optimization could be added backwards compatibly
-- with our current scheme, and it's not at all high priority for now.)

-- TODO: QuestDetail

-- Steps to begin a quest:
--  1. Make copy row in Quest, with a flipped quest_type field
--  2. Copy associated rows in QuestTask
--  3. Copy associated rows in QuestDetail
--  4. Insert row(s) into PartyMember which associates the row(s) in Adventurer
--     with the new row in Quest.

-- Step 1
INSERT INTO Quest (id, guild_id, parent_quest_id, name, quest_type)
SELECT 20, guild_id, 4, name, 1 FROM Quest WHERE id = 4;
-- Step 2
INSERT INTO QuestTask (quest_id, name, description, xp)
SELECT 20, name, description, xp FROM QuestTask WHERE quest_id = 4;
-- Step 3
INSERT INTO QuestDetail (quest_id, description)
SELECT 20, description FROM QuestDetail WHERE quest_id = 4;
-- Step 4
INSERT INTO PartyMember (adventurer_id, quest_id)
VALUES (1, 20);
