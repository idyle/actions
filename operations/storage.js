import dotenv from 'dotenv';
import { Storage } from "@google-cloud/storage";
import { randomBytes } from 'crypto';
import Path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: Path.join(__dirname, '..', '.env') });

const storage = new Storage();
const defaultBucket = process.env.IDYLE_CLI_DEFAULT_BUCKET;
// const storageDeploymentBucket = process.env.DEPLOYMENT_BUCKET_NAME;

export const uploadFiles = async (filepath) => {
    try {
        const storageBucketReference = storage.bucket(defaultBucket);
        const file = filepath.substring(filepath.lastIndexOf('/') + 1);
        const fullPath = path.resolve(filepath);
        const destination = `deployments/${file}`;
        const upload = await storageBucketReference.upload(fullPath, { destination });
        if (!upload) return false;
        return upload;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const uploadFile = async (bufferCont) => {
    try {
        const storageBucketReference = storage.bucket(defaultBucket);
        const fileName = `${randomBytes(16).toString('hex')}.tar.gz`;
        await storageBucketReference.file(`deployments/${fileName}`).save(bufferCont);
        return fileName;
    } catch (e) {
        console.log(e);
        return false;
    }
};

export const deleteFile = async (objectName) => {
    try {
        const storageBucketReference = storage.bucket(defaultBucket);
        const deletion = await storageBucketReference.file(`deployments/${objectName}`).delete();
        if (!deletion) return false;
        return deletion;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deployFiles = async (folderPath, files, bucket) => {
    try {
        let promises = [];
        for (const file of files) {
            let destination = file.split(folderPath)?.[1];
            if (destination.startsWith('/')) destination = destination.substring(1);
            const upload = storage.bucket(bucket).upload(file, { destination });
            promises.push(upload);
        };
        const uploadedFiles = await Promise.all(promises);
        for (const uploadedFile of uploadedFiles) if (!uploadedFile) return false;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteFiles = async (files, bucket) => {
    try {
        let promises = [];
        for (const file of files) promises.push(storage.bucket(bucket).file(file).delete());
        const deletedFiles = await Promise.all(promises);
        for (const deletedFile of deletedFiles) if (!deletedFile) return false;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const listFiles = async (bucket) => {
    try {
        let list = [];
        const [ operation ] = await storage.bucket(bucket).getFiles();
        if (!operation) return false;
        for (const { name } of operation) list.push(name);
        return list;
    } catch (e) {
        console.error(e);
        return false;    
    }
};

export const setMetadata = async (metadata, bucket) => {
    if (!metadata) return false;
    try {
        const operation = await storage.bucket(bucket).setMetadata(metadata);
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const makeFrontendPublic = async (bucket) => {
    try {
        const operation = await storage.bucket(bucket).makePublic();
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
}; 

export const createBucket = async (bucket, metadata = {}) => {
    if (!bucket) return false;
    try {
        const operation = await storage.createBucket(bucket, metadata);
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};