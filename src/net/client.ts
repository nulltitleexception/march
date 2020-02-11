import * as t from 'io-ts';
import { Socket } from 'socket.io';

import { Server } from './server';
import { User } from './user';

export enum CLIENT_CONNECTION_STATE {
    CONNECTED,
    DISCONNECTED,
}

export enum CLIENT_AUTHENTICATION_STATE {
    UNAUTHENTICATED,
    PROCESSING,
    AUTHENTICATED,
    INVALID,
}

const usernameCharRegex = /^[a-zA-Z0-9_\- ]+$/;
const usernameStartRegex = /^[a-zA-Z0-9]+/;
const usernameEndRegex = /[a-zA-Z0-9]+$/;
const minUsernameLength = 3;
const maxUsernameLength = 32;
const minPassLength = 3;
const maxPassLength = 72;

const UserAuthDataType = t.type({
    'user': t.string,
    'auth': t.string,
});

const CredentialsDataType = t.type({
    'user': t.string,
    'pass': t.string,
});

export class Client {
    private connection_state_inner: CLIENT_CONNECTION_STATE = CLIENT_CONNECTION_STATE.DISCONNECTED;
    private user?: User;
    public get connection_state() {
        return this.connection_state_inner;
    }
    public get has_attached_user(): boolean {
        return this.user !== undefined;
    }
    constructor(private server: Server, public id: string, private socket: Socket) {
        this.connection_state_inner = CLIENT_CONNECTION_STATE.CONNECTED;
        socket.on('disconnect', () => this.disconnect());
        console.log('Connection from ' + socket.handshake.address);
        const client = this;
        socket.on('create_user', async (msg) => {
            if (msg.user && msg.pass) {
                if (msg.user.length < minUsernameLength) {
                    socket.emit('fail', { 'reason': 'Username too short! ' + minUsernameLength + ' character minimum' });
                    return socket.disconnect();
                }
                if (msg.user.length > maxUsernameLength) {
                    socket.emit('fail', { 'reason': 'Username too long! ' + maxUsernameLength + ' character maximum' });
                    return socket.disconnect();
                }
                if (msg.pass.length < minPassLength) {
                    socket.emit('fail', { 'reason': 'Passphrase too short! ' + minPassLength + ' character minimum' });
                    return socket.disconnect();
                }
                if (msg.pass.length > maxPassLength) {
                    socket.emit('fail', { 'reason': 'Passphrase too long! ' + maxPassLength + ' character maximum' });
                    return socket.disconnect();
                }
                if (!usernameCharRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must only contain underscores, dashes, spaces and alphanumerics' });
                    return socket.disconnect();
                }
                if (!usernameStartRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must start with an alphanumeric' });
                    return socket.disconnect();
                }
                if (!usernameEndRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must end with an alphanumeric' });
                    return socket.disconnect();
                }
                try {
                    const { success, error, token } = await User.createUser(client, msg.user, msg.pass);
                    if (success) {
                        socket.emit('success', {
                            'user': msg.user,
                            'auth': token,
                        });
                        return socket.disconnect();
                    }
                    socket.emit('fail', { 'reason': error });
                    return socket.disconnect();
                } catch (err) {
                    console.log(err);
                    socket.emit('fail', { 'reason': 'An Unknown error occurred!' });
                    return socket.disconnect();
                }
            }
            socket.emit('fail', { 'reason': 'Please supply a username and passphrase' });
            return socket.disconnect();
        });
        socket.on('validate', async (msg) => {
            if (UserAuthDataType.is(msg)) {
                const user_id = await User.getUserIdFromName(msg.user);
                if (user_id) {
                    let user = User.getLoadedUser(user_id);
                    let owned = false;
                    if (!user) {
                        user = await User.loadUser(user_id);
                        owned = true;
                    }
                    if (user.validateToken(msg.auth)) {
                        if (owned) {
                            user.unload();
                        }
                        socket.emit('success');
                        return socket.disconnect();
                    }
                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
        socket.on('authorize', async (msg) => {
            if (CredentialsDataType.is(msg)) {
                const user_id = await User.getUserIdFromName(msg.user);
                if (user_id) {
                    let user = User.getLoadedUser(user_id);
                    let owned = false;
                    if (!user) {
                        user = await User.loadUser(user_id);
                        owned = true;
                    }
                    const token = user.validateCredentials(msg.user, msg.pass);
                    if (token) {
                        if (owned) {
                            user.unload();
                        }
                        socket.emit('success', {
                            'user': msg.user,
                            'auth': token,
                        });
                        return socket.disconnect();
                    }
                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
        socket.on('login', async (msg) => {
            if (UserAuthDataType.is(msg)) {
                const user_id = await User.getUserIdFromName(msg.user);
                if (user_id) {
                    let user = User.getLoadedUser(user_id);
                    let owned = false;
                    if (!user) {
                        user = await User.loadUser(user_id);
                        owned = true;
                    }
                    if (user.isLoggedIn()) {
                        socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                        socket.disconnect();
                        return;
                    }
                    if (user.login(client, msg.auth)) {
                        socket.emit('success');
                        socket.removeAllListeners('validate');
                        socket.removeAllListeners('authorize');
                        socket.removeAllListeners('create_user');
                        socket.removeAllListeners('login');
                        return;
                    }
                    if (owned) {
                        user.unload();
                    }

                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
    }
    public attachUser(user: User) {
        this.user = user;
    }
    public disconnect() {
        this.user?.logout();
        this.user = undefined;
        if (this.connection_state === CLIENT_CONNECTION_STATE.CONNECTED) {
            this.connection_state_inner = CLIENT_CONNECTION_STATE.DISCONNECTED;
            this.server.removeClient(this.id);
            this.socket.disconnect();
            console.log(this.socket.handshake.address + ' disconnected');
        }
    }
}
