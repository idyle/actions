import archiver from 'archiver';
import { BufferListStream} from 'bl';
import path from 'path';
import { readdir, stat } from 'fs/promises';

export const archiveFile = async (sourceDir) => {
    const archive = archiver('tar', { gzip: true, gzipOptions: { zlib: { level: 9 } } } );
    return new Promise((resolve) => {
        let bufferString;
        archive.glob('**/*', { cwd: path.resolve(sourceDir), ignore: [ 'node_modules/**' ] });
        archive.pipe(BufferListStream((err, data) => bufferString = data));
        archive.on('end', () => resolve(bufferString));
        archive.on('error', () => resolve(false));
        archive.finalize();
    });
};

export const listFolder = async (sourceDir) => {
    try {
        let files = [];
        const list = await readdir(sourceDir);
        for (const item of list) {
            const stats = await stat(path.join(sourceDir, item));
            if (stats.isFile()) files.push(`${sourceDir}/${item}`);
            else if (stats.isDirectory()) files = [ ...files, ...(await listFolder(`${sourceDir}/${item}`))];
        };
        return files; 
    } catch (e) {
        console.error(e);
        return [];
    }
};

listFolder('../app/build').then(r => console.log(r))