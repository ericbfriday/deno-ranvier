import { DatabaseSync } from 'node:sqlite';
import type { IDataSource, IEntityLoaderConfig, Player } from '@friday/ranvier';

// const this._db = new DatabaseSync("test-ranvierdb.db");
// const this._db = require('better-sqlite3')('ranvierdb');

/**
 * Data source when you have all entities in a sqlite table
 */
export class SqliteDataSource {
    private _db: DatabaseSync;
    constructor(public dbName: string = 'ranvierdb.db', public table: string = 'ranvier-dev') {
        this._db = new DatabaseSync(this.dbName);
        this.table = table || 'ranvier-dev';
    }

    hasData(config: IEntityLoaderConfig = {}) {
        if (config?.db == undefined) {
            throw new Error(`You must set a config value for table in your ranvier.json file for this data`);
        }
        this._db.exec('CREATE TABLE IF NOT EXISTS' + config.table + '(name TEXT UNIQUE, data TEXT)');
        const stmt = this._db.prepare('SELECT name FROM ' + config.table);
        return Promise.resolve(stmt.get());
    }

    fetchAll(config: IEntityLoaderConfig = {}) {
        if (!this.hasData()) {
            throw new Error(config.table + ` table does not exist and cannot create`);
        }

        const stmt = this._db.prepare('SELECT * FROM ' + config.table);
        return Promise.resolve(stmt.all());
    }

    fetch(config: IEntityLoaderConfig = {}, id: string) {
        const stmt = this._db.prepare('SELECT data FROM ' + config.table + ' WHERE name = ?');
        const player = stmt.get(id);

        if (player == undefined) {
            throw new ReferenceError(`Record with id [${id}] not found.`);
        }

        return Promise.resolve(JSON.parse((player as Player).data));
    }

    replace(config: IEntityLoaderConfig = {}, data) {
        const stmt = this._db.prepare('REPLACE INTO ' + config.table + '(name, data) values (?, ?)');
        return Promise.resolve(stmt.run(data.name, JSON.stringify(data, null, 2)));
    }

    update(config: IEntityLoaderConfig = {}, id: string, data: Record<string, any>) {
        const exists = this._db.prepare('SELECT name from ' + config.table + ' where name = ?').get(id);
        let result;
        if (exists == undefined) {
            result = this._db.prepare('INSERT INTO ' + config.table + '(data, name) values (?, ?)').run(
                JSON.stringify(data),
                id,
            );
        } else {
            result = this._db.prepare('UPDATE ' + config.table + ' SET data = ? where name = ?').run(
                JSON.stringify(data),
                id,
            );
        }
        return Promise.resolve(result);
    }
}
