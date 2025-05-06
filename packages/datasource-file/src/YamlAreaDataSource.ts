import fs from 'node:fs';
import type path from 'node:path';
// import yaml from 'npm:js-yaml';

import type { IEntityLoaderConfig } from '@friday/ranvier';
import { FileDataSource } from './FileDataSource.ts';
import { YamlDataSource } from './YamlDataSource.ts';

export type YamlAreaDataSourceConfig = {
    path: { [key: string]: unknown };
};
/**
 * Data source for areas stored in yml. Looks for a directory structure like:
 *
 *   path/
 *     area-one/
 *       manifest.yml
 *     area-two/
 *       manifest.yml
 *
 * Config:
 *   path: string: relative path to directory containing area folders
 */
export class YamlAreaDataSource extends FileDataSource {
    hasData(config: IEntityLoaderConfig = {}) {
        const dirPath = this.resolvePath(config);
        return fs.existsSync(dirPath);
    }

    async fetchAll(config: IEntityLoaderConfig = {}) {
        const dirPath = this.resolvePath(config);

        if (!this.hasData(config)) {
            throw new Error(`Invalid path [${dirPath}] specified for YamlAreaDataSource`);
        }

        return new Promise((resolve, reject) => {
            const data = {} as Record<string, unknown>;

            fs.readdir(fs.realpathSync(dirPath), { withFileTypes: true }, async (err, files) => {
                for (const file of files) {
                    if (!file.isDirectory()) {
                        continue;
                    }

                    const manifestPath = [dirPath, file.name, 'manifest.yml'].join('/');
                    if (!fs.existsSync(manifestPath)) {
                        continue;
                    }

                    data[file.name] = await this.fetch(config, file.name);
                }

                resolve(data);
            });
        });
    }

    async fetch(config: IEntityLoaderConfig = {}, id: string) {
        const dirPath = this.resolvePath(config);
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Invalid path [${dirPath}] specified for YamlAreaDataSource`);
        }

        const source = new YamlDataSource({}, dirPath);

        return source.fetchAll({ path: `${id}/manifest.yml` });
    }

    async update(config: IEntityLoaderConfig = {}, id: string, data: Record<string, unknown>) {
        const dirPath = this.resolvePath(config);
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Invalid path [${dirPath}] specified for YamlAreaDataSource`);
        }

        const source = new YamlDataSource({}, dirPath);

        return await source.replace({ path: `${id}/manifest.yml` }, data);
    }
}
