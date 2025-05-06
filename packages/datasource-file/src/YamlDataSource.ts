import fs from 'node:fs';
import { parse, stringify } from '@std/yaml';

import type { IEntityLoaderConfig } from '@friday/ranvier';
import { FileDataSource } from './FileDataSource.ts';

/**
 * Data source when you have all entities in a single yaml file
 *
 * Config:
 *   path: string: relative path to .yml file from project root
 */
export class YamlDataSource extends FileDataSource {
    async hasData(config: IEntityLoaderConfig = {}) {
        const filepath = this.resolvePath(config);
        return Promise.resolve(fs.existsSync(filepath));
    }

    async fetchAll(config: IEntityLoaderConfig = {}) {
        const filepath = this.resolvePath(config);

        if (!this.hasData(config)) {
            throw new Error(`Invalid path [${filepath}] for YamlDataSource`);
        }

        return new Promise((resolve, reject) => {
            const contents = fs.readFileSync(fs.realpathSync(filepath)).toString('utf8');

            resolve(parse(contents));
        });
    }

    async fetch(config: IEntityLoaderConfig = {}, id: string) {
        const data = await this.fetchAll(config) as Record<string, unknown>;

        if (!Object.hasOwn(data, id)) {
            throw new ReferenceError(`Record with id [${id}] not found.`);
        }

        return data[id];
    }

    async replace(config: IEntityLoaderConfig = {}, data: Record<string, unknown>) {
        const filepath = this.resolvePath(config);
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(filepath, stringify(data), (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    async update(config: IEntityLoaderConfig = {}, id: string, data: Record<string, unknown>) {
        const currentData = await this.fetchAll(config) as Record<string, unknown>;

        if (Array.isArray(currentData)) {
            throw new TypeError('Yaml data stored as array, cannot update by id');
        }

        currentData[id] = data;

        return this.replace(config, currentData);
    }
}
