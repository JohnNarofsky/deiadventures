-- This file creates all the tables we need in the database.
-- It is written with SQLite in mind.

-- Note that, due to our use of `STRICT` tables, we require version 3.37.0 or later.

-- TODO: we need to ensure that when the server initializes a connection,
--       it enables foreign key constraint enforcement and such.

-- Note: We use "PascalCase" for table names, and "snake_case" for column names.

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

CREATE TABLE Quest (
    id INTEGER PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES Guild (id),
    name TEXT,
    status TEXT NOT NULL,
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
    description TEXT NOT NULL,
    xp INTEGER NOT NULL
) STRICT;

CREATE TABLE Adventurer (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    -- email_address and password are used for authentication,
    -- and are required at least until we have OAuth2 working in their stead
    email_address TEXT NOT NULL,
    password TEXT NOT NULL
) STRICT;

-- Note: This table reflects permissions which the backend code knows about,
-- with the currently approved values of permission_type being:
--  - Super User (0)
--  - Approved   (1)
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

CREATE TABLE AdventurerRole (
    id INTEGER PRIMARY KEY,
    adventurer_id INTEGER NOT NULL REFERENCES Adventurer (id),
    guild_id INTEGER NOT NULL REFERENCES Guild (id),
    assigned_role TEXT NOT NULL
) STRICT;
