import type * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { Random, UUID } from '../math/random';
import type { User } from '../net/user';
import { ChatCommands } from '../system/chat_commands';
import { getTileFromName, getTilePalette, NO_TILE } from '../tile';
import { version } from '../version';
import { Action, ActionClasses, ChatActions } from './action';
import type { Cell } from './cell';
import { PlayerController } from './controller/playercontroller';
import { DIRECTION } from './direction';
import { Entity, PlayerEntity } from './entity';
import type { Event } from './event';
import type { Instance } from './instance';
import { CurrentPlayerSchema, EntityRef, PlayerVersionSchema, PlayerVersionSchemas, PLAYER_FILE_CURRENT_VERSION, SeenCache, updatePlayerSchema } from './player_schema_versions';
import { VisibilityManager } from './visibilitymanager';
import type { World } from './world';

const MAX_SEEN_CACHE_COUNT = 10;
const starting_cell = 'tutorial/start';

export type PlayerSchema = t.TypeOf<typeof Player.schema>;

export class Player {
    public static schema = PlayerVersionSchema;

    public static async fromJSON(user: User, world: World, json: PlayerSchema): Promise<Player> {
        if (PlayerVersionSchemas[PLAYER_FILE_CURRENT_VERSION].is(json)) {
            const ret = new Player(user, world, json.id);
            ret.name = json.name;
            ret.sheet = CharacterSheet.fromJSON(json.sheet);
            ret.entity_ref = json.entity_ref;
            const mapping: number[] = json.seen_cache_palette.map(getTileFromName);
            mapping[NO_TILE] = NO_TILE;
            ret.seen_cache = json.seen_cache.map((cache) => {
                cache.tiles = cache.tiles.map((row) => row.map((tile) => mapping[tile]));
                return cache;
            });
            return ret;
        }
        return Player.fromJSON(user, world, updatePlayerSchema(json));
    }
    public static async createPlayer(user: User, world: World, name: string, sheet: CharacterSheet) {
        const blueprint = await world.globals.cell_blueprint_manager.get(starting_cell);
        if (blueprint === undefined) {
            throw new Error(`Could not create player! Starting cell blueprint (${starting_cell}) not found!`);
        }
        const ret = new Player(user, world);
        ret.name = name;
        sheet.status.restoreFully();
        ret.sheet = sheet;
        const inst: Instance = await world.createInstance();
        const cell: Cell = await inst.createCell(blueprint, user.server.globals);
        const loc = cell.getRandomEmptyLocation();
        const ent: PlayerEntity = (() => {
            const e: Entity = new Entity(loc);
            e.setComponent('player', ret);
            e.setComponent('name', ret.name);
            e.setComponent('direction', DIRECTION.NORTH);
            e.setComponent('sheet', ret.sheet);
            e.setComponent('sprite', 'mob/player/A');
            e.setComponent('inventory', new Inventory());
            e.setComponent('collidable', true);
            e.setComponent('visibility_manager', new VisibilityManager(e));
            e.setComponent('controller', new PlayerController(e));
            return e;
        })();
        ent.refreshPlaceInTurnOrder();
        ret.entity_ref = {
            'instance_id': inst.id,
            'cell_id': cell.id,
            'entity_id': ent.id
        };
        return ret;
    }

    public name: string = '';
    public sheet: CharacterSheet = new CharacterSheet();
    private entity_ref?: EntityRef;
    private entity?: Entity;
    private _active: boolean = false;
    private queued_action?: Action[] | undefined;
    private seen_cache: SeenCache = [];
    private constructor(private user: User, private world: World, protected _id: string = Random.uuid()) { }
    public getSeenCache(instance_id: UUID, cell_id: UUID) {
        const index = this.seen_cache.findIndex((c) => { return c.instance_id === instance_id && c.cell_id === cell_id });
        if (index < 0) {
            return;
        }
        const ret = this.seen_cache.splice(index, 1)[0];
        this.seen_cache.push(ret);
        return ret;
    }
    public addSeenCache(instance_id: UUID, cell_id: UUID, cache: SeenCache[number]) {
        const index = this.seen_cache.findIndex((c) => { return c.instance_id === instance_id && c.cell_id === cell_id });
        if (index >= 0) {
            const err = 'BUG! Attempted to add existing cache to seen_cache!';
            console.log(err);
            throw (err);
        }
        if (this.seen_cache.length >= MAX_SEEN_CACHE_COUNT) {
            this.seen_cache.shift();
        }
        this.seen_cache.push(cache);
    }
    public get id() {
        return this._id;
    }
    public get active() {
        return this._active;
    }
    public sendChatMessage(text: string) {
        this.user.sendChatMessage(text);
    }
    public sendEvent(event: Event) {
        if (this.entity === undefined) {
            return console.log('Event could not be sent to player! no attached Entity!')
        }
        this.user.sendEvent(event.getClientJSON(this.entity));
    }
    public doAction(message: string) {
        let msgs: string[] = [];
        if (message.startsWith('[') && message.endsWith(']')) {
            msgs = message.substring(1, message.length - 1).split(',');
        } else {
            msgs = [message];
        }
        const actions: (Action | undefined)[] = msgs.map((msg) => {
            const args = msg.split(' ');
            const chat_action = args[0];
            args.shift();
            const action_type = ChatActions[chat_action];
            if (action_type !== undefined) {
                const action = ActionClasses[action_type].fromArgs(args);
                if (typeof action === 'string') {
                    this.sendChatMessage(action);
                    return;
                }
                return action;
            }
            this.sendChatMessage(`Invalid action type: ${chat_action}!`);

        });
        if (actions.includes(undefined)) {
            return;
        }
        const ent = this.getEntity();
        if (this.queued_action === undefined) {
            ent.location.cell.notifyAsyncEnt(ent.id);
        }
        this.queued_action = actions as Action[];
    }
    public getQuery(query: string) {
        // TODO: handle query
    }
    public async doCommand(command: string) {
        const msg = await ChatCommands.exec(command, this.user, this);
        if (msg !== undefined) {
            this.sendChatMessage(msg);
        }
    }
    public getNextAction() {
        if (this.queued_action !== undefined) {
            return this.queued_action[0];
        }
    }
    public popAction() {
        if (this.queued_action !== undefined && this.queued_action.length > 1) {
            this.queued_action?.shift();
        } else {
            this.queued_action = undefined;
        }
    }
    public getGameData() {
        const ent = this.getEntity();
        let sheet = ent.getComponent('sheet');
        if (sheet === undefined) {
            sheet = this.sheet;
        }
        return {
            'player_entity': ent.id,
            'board': ent.location.cell.getClientJSON(ent),
            'palette': getTilePalette(),
            'entities': ent.location.cell.getClientEntitiesJSON(ent),
            'settings': this.user.settings.toJSON(),
            'messages': [
                `Gods of the Graemarch Prototype V${version}`,
            ],
        }
    }
    public getEntity(): Entity {
        if (!this._active) {
            throw new Error('Player not active!');
        }
        if (this.entity === undefined) {
            throw new Error('Active player did not have a loaded EntityRef!')
        }
        return this.entity;
    }
    public async setActive() {
        if (this._active) {
            throw new Error('Player already active!');
        }
        if (this.entity_ref === undefined) {
            throw new Error('Player did not have an attached entity!')
        }
        const cell = await this.world.getCell(this.entity_ref.instance_id, this.entity_ref.cell_id);
        const ent: Entity = cell.getEntity(this.entity_ref.entity_id);
        ent.setComponent('player', this);
        this.entity = ent;
        ent.getComponent('visibility_manager')?.recalculateAllVisibleEntities();
        this.entity.location.cell.addActivePlayer();
        this._active = true;
    }
    public setInactive() {
        if (!this._active) {
            throw new Error('Player not active!');
        }
        if (this.entity === undefined) {
            throw new Error('Active player did not have a loaded EntityRef!')
        }
        this.entity.location.cell.removeActivePlayer();
        this.entity.removeComponent('player');
        this.entity_ref = {
            'instance_id': this.entity.location.instance_id,
            'cell_id': this.entity.location.cell_id,
            'entity_id': this.entity.id,
        }
        this.entity = undefined;
        this._active = false;
    }
    public toJSON(): CurrentPlayerSchema {
        return {
            'version': PLAYER_FILE_CURRENT_VERSION,
            'id': this.id,
            'name': this.name,
            'sheet': this.sheet.toJSON(),
            'entity_ref': this.entity_ref,
            'seen_cache': this.seen_cache,
            'seen_cache_palette': getTilePalette(),
        };
    }
}
