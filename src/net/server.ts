import bcrypt = require('bcrypt');
import { promises as fs } from 'fs';
import type { Socket } from 'socket.io';
import { CharacterSheet } from '../character/charactersheet';
import type { Globals } from '../globals';
import { Random } from '../math/random';
import { File } from '../system/file';
import type { World } from '../world/world';
import { Client, CLIENT_CONNECTION_STATE } from './client';
import { User } from './user';
import type { CurrentUserSchema } from './user_schema_versions';
import { UserSettings } from './user_settings';

async function getHash(pass: string) {
    return bcrypt.hash(pass, 10);
}
async function setUsername(id: string, name: string) {
    return fs.writeFile('users/' + name.toLowerCase() + '.id', id + '\n' + name);
}

async function isUsernameUnavailable(username: string): Promise<boolean> {
    return File.exists('users/' + username.toLowerCase() + '.id');
}

interface UserCreationResult {
    success: boolean;
    error?: string;
    token?: string;
}

export class Server {
    private running: boolean = true;
    private running_promise: Promise<void> | undefined;
    private clients: { [id: string]: Client; } = {};
    private users: { [id: string]: User; } = {};
    constructor(private _server: SocketIO.Server, public readonly world: World, public globals: Globals) {
        _server.on('connection', (socket: Socket) => {
            if (this.running) {
                this.clients[socket.id] = new Client(this, socket.id, socket);
            }
        });
    }
    public async run() {
        this.running_promise = this.world.update();
        await this.running_promise;
        if (this.running) {
            setTimeout(() => this.run(), 10);
        }
    }
    public get server() {
        return this._server;
    }
    public async shutdown() {
        this.running = false;
        await this.running_promise;
        Object.values(this.clients).forEach((client: Client) => {
            client.disconnect();
        });
        this.clients = {};
        await Promise.all(Object.values(this.users).map((user: User) => user.unload()));
        this.users = {};
        await this.world.unload();
    }
    public removeClient(id: string) {
        if (this.clients[id]) {
            if (this.clients[id].connection_state === CLIENT_CONNECTION_STATE.CONNECTED) {
                console.log('Error: Cannot remove connected Client!');
            } else {
                delete this.clients[id];
            }
        } else {
            console.log('Error: Cannot remove nonexistent Client!');
        }
    }
    public getClient(id: string): Client | null {
        return this.clients[id] || null;
    }
    public getLoadedUser(id: string): User | undefined {
        return this.users[id];
    }
    public async getUser(id: string): Promise<User | undefined> {
        if (!this.users[id]) {
            const path = 'users/' + id + '.json';
            const file = await File.acquireFile(path);
            this.users[id] = await User.createUserFromFile(this, this.world, file);
        }
        return this.users[id];
    }
    public async getUserIdFromName(name: string): Promise<string | undefined> {
        try {
            const data = (await File.getReadOnlyFile('users/' + name.toLowerCase() + '.id')).getString();
            const lines = (data + '').split('\n');
            if (name === lines[1]) {// for now we don't allow usernames that only differ by case
                return lines[0];
            }
            return;
        } catch (err) {
            return;
        }
    }
    public async createUser(username: string, passphrase: string): Promise<UserCreationResult> {
        if (await isUsernameUnavailable(username)) {
            const success = false;
            const error = 'Username not available.';
            return { success, error };
        }
        let id = Random.uuid();
        let path = 'users/' + id + '.json';
        while (await File.exists(path)) {
            console.log('Duplicate ID while creating User! UUID collisions should not occur!');
            id = Random.uuid();
            path = 'users/' + id + '.json';
        }
        const file = await File.acquireFile(path);
        const hash = getHash(passphrase);
        const user_json: CurrentUserSchema = {
            'version': 3,
            'admin': false,
            'id': id,
            'name': username,
            'auth': {
                'hash': await hash,
                'token': '',
                'token_creation_time': 0,
            },
            'settings': UserSettings.createFreshWithDefaults(),
            'unfinished_player': {
                'name': '',
                'sheet': CharacterSheet.newPlayerSheet().toJSON(),
            },
            'players': [],
        };
        file.setJSON(user_json);
        const user = await User.createUserFromFile(this, this.world, file);
        this.users[id] = user;
        user.save();
        await setUsername(id, username);
        const token = await user.validateCredentials(username, passphrase);
        const success = true;
        return { success, token };
    }
}
