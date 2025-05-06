import fs from 'node:fs';
import path from 'node:path';

import type { IEntityLoaderConfig } from '@friday/ranvier';
import { FileDataSource } from './FileDataSource.ts';
import { JsonDataSource } from './JsonDataSource.ts';

/**
 * Data source when you have a directory of json files and each entity is stored in
 * its own json file, e.g.,
 *
 *   foo/
 *     a.json
 *     b.json
 *     c.json
 *
 * Config:
 *   path: string: relative path to directory containing .json files from project root
 *
 * @extends DataSource
 */
export class JsonDirectoryDataSource extends FileDataSource {
    hasData(config: IEntityLoaderConfig = {}) {
        const filepath = this.resolvePath(config);
        return Promise.resolve(fs.existsSync(filepath));
    }

    fetchAll(config: IEntityLoaderConfig = {}) {
        const dirPath = this.resolvePath(config);

        if (!this.hasData(config)) {
            throw new Error(`Invalid path [${dirPath}] specified for JsonDirectoryDataSource`);
        }

        return new Promise((resolve, reject) => {
            const data = {} as Record<string, unknown>;

            fs.readdir(fs.realpathSync(dirPath), async (err, files) => {
                for (const file of files) {
                    if (path.extname(file) !== '.json') {
                        continue;
                    }

                    const id = path.basename(file, '.json');
                    data[id] = await this.fetch(config, id);
                }

                resolve(data);
            });
        });
    }

    fetch(config: IEntityLoaderConfig = {}, id: string) {
        const dirPath = this.resolvePath(config);
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Invalid path [${dirPath}] specified for JsonDirectoryDataSource`);
        }

        const source = new JsonDataSource({}, dirPath);

        return source.fetchAll({ path: `${id}.json` });
    }

    async update(config: IEntityLoaderConfig = {}, id: string, data: Record<string, unknown>) {
        const dirPath = this.resolvePath(config);
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Invalid path [${dirPath}] specified for JsonDirectoryDataSource`);
        }
        const source = new JsonDataSource({}, dirPath);

        return await source.replace({ path: `${id}.json` }, data);
    }
}
