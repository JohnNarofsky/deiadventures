-- While src/init.sql now defines Quest.repeatable, the original version did not.

ALTER TABLE Quest ADD COLUMN
repeatable INTEGER NOT NULL DEFAULT 0;

PRAGMA user_version = 1;
