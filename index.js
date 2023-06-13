#!/usr/bin/env node
import { readFile } from "fs/promises";
import { createBackend, createFrontend, updateBackend, updateFrontend } from "./commands.js";


const getVariables = async () => {
    try {
        const file = await readFile('.prod.env', 'utf-8');
        const variables = file.split(/\r?\n|\r|\n/g);
        let newVariables = [];
        for (const variable of variables) {
            if (variable.includes('#')) continue;
            const data = variable.split('=');
            if (data?.length !== 2) return false;
            newVariables.push({ name: data[0], value: data[1] });
        }; 
        return newVariables;
    } catch {
        return false;
    }
};

(async () => {
    const commands = process.argv.slice(2) || [];
    if (commands?.length !== 3) return console.error('Command does not exist.');
    let service = commands[0], path = process.cwd(), variables = await getVariables() || [];
    if (commands[1] === 'frontend' && commands[2] === 'create') createFrontend(path, service);
    else if  (commands[1] === 'frontend' && commands[2] === 'update') updateFrontend(path, service);
    else if (commands[1] === 'backend' && commands[2] === 'create') createBackend(path, service, variables);
    else if (commands[1] === 'backend' && commands[2] === 'update') updateBackend(path, service, variables);
    else return console.error('Command does not exist.');
    // operations self-handle
})();