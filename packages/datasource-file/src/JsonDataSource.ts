import fs from 'node:fs';
import { exists } from 'jsr:@std/fs/exists';
import { FileDataSource } from './FileDataSource.ts';
import type { IEntityLoaderConfig } from '@friday/ranvier';
export type JsonDataSourceConfig = {
    /** relative path to.json file from project root */
    path: string;
};
/**
 * Data source when you have all entities in a single json file
 *
 * Config:
 *   path: string: relative path to .json file from project root
 */
export class JsonDataSource extends FileDataSource {
    hasData(config: IEntityLoaderConfig) {
        const filepath = this.resolvePath(config);
        return exists(filepath);
    }

    fetchAll(config: IEntityLoaderConfig = {}) {
        const filepath = this.resolvePath(config);

        if (!this.hasData(config)) {
            throw new Error(`Invalid path [${filepath}] for JsonDataSource`);
        }

        delete require.cache[filepath];

        return Promise.resolve(require(filepath));
    }

    async fetch(config: IEntityLoaderConfig = {}, id: string /* keyof data */) {
        const data = await this.fetchAll(config) as Record<string, unknown>;

        if (!Object.hasOwn(data, id)) {
            throw new ReferenceError(`Record with id [${id}] not found.`);
        }

        return data[id];
    }

    async replace(config: IEntityLoaderConfig = {}, data: Record<string, unknown>) {
        const filepath = this.resolvePath(config);

        return new Promise<void>((resolve, reject) => {
            fs.writeFile(filepath, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    async update(config: IEntityLoaderConfig = {}, id: string, data: Record<string, unknown>) {
        const currentData = await this.fetchAll(config);

        if (Array.isArray(currentData)) {
            throw new TypeError('Yaml data stored as array, cannot update by id');
        }

        currentData[id] = data;

        return this.replace(config, currentData);
    }
}
