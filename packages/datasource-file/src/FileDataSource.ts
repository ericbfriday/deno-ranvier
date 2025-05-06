import type fs from 'node:fs';
import path from 'node:path';
import { type exists, existsSync } from 'jsr:@std/fs/exists';
import type { IEntityLoaderConfig } from '@friday/ranvier';
import { assert } from '@std/assert';

Deno.test({
    name: 'a test case',
    fn() {
        const someCondition = true;
        assert(someCondition);
    },
});

export class FileDataSource {
    root: string;
    config: IEntityLoaderConfig;
    constructor(config: IEntityLoaderConfig, rootPath: string | URL) {
        this.config = config;
        this.root = typeof rootPath === 'string' ? rootPath : String(rootPath);
    }

    /**
     * Parse [AREA] and [BUNDLE] template in the path
     */
    resolvePath(config: IEntityLoaderConfig): string {
        const { path: localPath, bundle, area } = config;

        if (!this.root) {
            throw new Error('No root configured for DataSource');
        }

        if (!localPath) {
            throw new Error('No path for DataSource');
        }

        if (localPath.includes('[AREA]') && !area) {
            throw new Error('No area configured for path with [AREA]');
        }

        if (localPath.includes('[BUNDLE]') && !bundle) {
            throw new Error('No bundle configured for path with [BUNDLE]');
        }

        const filePath = path.join(this.root, localPath)
            .replace('[AREA]', area!)
            .replace('[BUNDLE]', bundle!);
        console.assert(existsSync(filePath), `Filepath does not exist: ${filePath}`);
        return filePath;
    }
}
