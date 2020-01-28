import { Socket } from 'socket.io';

import { Client, CLIENT_CONNECTION_STATE } from './client';
import { User } from './user';

export class Server {
    private clients: { [id: string]: Client; } = {};
    private users: { [id: string]: User; } = {};
    constructor(private server: SocketIO.Server) {
        server.on('connection', (socket: Socket) => {
            this.clients[socket.id] = new Client(this, socket.id, socket);
        });
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
    public async getUser(id: string): Promise<User | null> {
        return this.getLoadedUser(id) || this.loadUser(id);
    }
    private async loadUser(id: string): Promise<User | null> {
        return null; // TODO: load User from disk
    }
    private getLoadedUser(id: string): User | null {
        return this.users[id] || null;
    }
}
