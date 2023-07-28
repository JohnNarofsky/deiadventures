-- This file creates all the tables we need in the database.
-- It is written with SQLite in mind.

-- Note that, due to our use of `STRICT` tables, we require version 3.37.0 or later.

-- TODO: we need to ensure that when the server initializes a connection,
--       it enables foreign key constraint enforcement and such.

-- Note: We use "PascalCase" for table names, and "snake_case" for column names.

-- A randomly generated number. This is hardcoded elsewhere,
-- so grep for everywhere it's used in the server before changing it.
PRAGMA application_id = 249251854;
PRAGMA user_version = 0;

-- Unlike other journaling modes, WAL mode needs only to be set once,
-- instead of upon each connection to the database.
PRAGMA journal_mode = WAL;

-- Honestly, calling these character classes would still be more intuitive to me,
-- since "guild" sounds like "organization" or "company" to me.
-- Oh well.
CREATE TABLE Guild (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
) STRICT;
-- We use strict tables, as described here:
-- https://www.sqlite.org/stricttables.html
-- It is in our interest to catch screw ups with the schema early.
-- Also, prevents null primary keys from being inserted,
-- which are a thing that SQLite has kept around for backward compatibility.

-- quest_type currently has two accepted values:
--  - Guild      (0)
--  - Adventurer (1)
CREATE TABLE Quest (
    id INTEGER PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES Guild (id),
    name TEXT,
    quest_type INTEGER NOT NULL,
    open_date INTEGER,
    close_date INTEGER
) STRICT;

CREATE TABLE QuestDetail (
    id INTEGER PRIMARY KEY,
    quest_id INTEGER NOT NULL REFERENCES Quest (id),
    -- Note: It is possible we'll change this to be nullable in the future.
    description TEXT NOT NULL
) STRICT;

CREATE TABLE QuestTask (
    id INTEGER PRIMARY KEY,
    quest_id INTEGER NOT NULL REFERENCES Quest (id),
    name TEXT NOT NULL,
    description TEXT,
    xp INTEGER NOT NULL
) STRICT;

CREATE TABLE Adventurer (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    -- email_address and password_hash are used for authentication,
    -- and are required at least until we have OAuth2 working in their stead
    email_address TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    -- randomly generated for each user, to make attacking many hashes at once
    -- more difficult. this is standard practice.
    password_salt TEXT NOT NULL
) STRICT;

-- Note: This table reflects permissions which the backend code knows about,
-- with the currently approved values of permission_type being:
--  - Super User                  (0)
--  - Approved                    (1)
--  - Eligible To Be Guild Leader (2)
--  - Rejected                    (3)
CREATE TABLE Permission (
    id INTEGER PRIMARY KEY,
    adventurer_id INTEGER NOT NULL REFERENCES Adventurer (id),
    permission_type INTEGER NOT NULL
) STRICT;

-- Alternatively, this could be called "QuestMember".
-- This table tracks which adventurers are active in which quests.
CREATE TABLE PartyMember (
    id INTEGER PRIMARY KEY,
    adventurer_id INTEGER NOT NULL REFERENCES Adventurer (id),
    quest_id INTEGER NOT NULL REFERENCES Quest (id)
) STRICT;

-- Note: Currently, the only Role is 'leader'.
CREATE TABLE AdventurerRole (
    id INTEGER PRIMARY KEY,
    adventurer_id INTEGER NOT NULL REFERENCES Adventurer (id),
    guild_id INTEGER NOT NULL REFERENCES Guild (id),
    assigned_role TEXT NOT NULL
) STRICT;
