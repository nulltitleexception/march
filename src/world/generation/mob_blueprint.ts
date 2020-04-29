import * as t from 'io-ts';
import { CharacterAttributes } from '../../character/characterattributes';
import { CharacterRace } from '../../character/characterrace';
import { CharacterSheet } from '../../character/charactersheet';
import { Random } from '../../math/random';
import { Resource, ResourceManager } from '../../system/resource';
import { Controller } from '../controller';
import { CONTROLLER } from '../controller/controllers';
import { DIRECTION } from '../direction';
import { Entity } from '../entity';
import type { Location } from '../location';

function createBaseMob(loc: Location): Entity {
    const ret: Entity = new Entity(loc, Random.uuid(), true);
    ret.setComponent('direction', DIRECTION.NORTH);
    ret.setComponent('name', 'Unnamed');
    ret.setComponent('controller', Controller.fromJSON({
        'type': 'WANDER',
    }));
    ret.setComponent('sheet', new CharacterSheet());
    return ret;
}

type MobBlueprintSchema = typeof MobBlueprintManager.schema;

export class MobBlueprintManager extends ResourceManager<typeof MobBlueprintManager.schema, MobBlueprint> {
    protected resource_class = MobBlueprint;
    public static schema = t.partial({
        'extends': t.string,
        'name': t.string,
        'sprite': t.string,
        'controller': t.keyof(CONTROLLER),
        'race': t.string,
        'attributes': t.partial(CharacterAttributes.schema.props),
    });
}

export class MobBlueprint extends Resource<MobBlueprintSchema> {
    private extends?: string;
    private name?: string;
    private sprite?: string;
    private race?: string;
    private controller?: CONTROLLER;
    public fromJSON(json: t.TypeOf<MobBlueprintSchema>): void {
        if (json.extends !== undefined) {
            this.extends = json.extends
        }
        if (json.name !== undefined) {
            this.name = json.name;
        }
        if (json.sprite !== undefined) {
            this.sprite = json.sprite;
        }
        if (json.race !== undefined) {
            this.race = json.race;
        }
        if (json.controller !== undefined) {
            this.controller = CONTROLLER[json.controller];
        }
    }
    public toJSON() {
        const ret: t.TypeOf<MobBlueprintSchema> = {};
        if (this.extends !== undefined) {
            ret.extends = this.extends;
        }
        if (this.name !== undefined) {
            ret.name = this.name;
        }
        if (this.sprite !== undefined) {
            ret.sprite = this.sprite;
        }
        if (this.race !== undefined) {
            ret.race = this.race;
        }
        if (this.controller !== undefined) {
            ret.controller = CONTROLLER[this.controller] as keyof typeof CONTROLLER;
        }
        return ret;
    }
    public async generateMob(mob_blueprint_manager: MobBlueprintManager, loc: Location): Promise<Entity> {
        const ret = (this.extends === undefined)
            ? (createBaseMob(loc))
            : (await (await mob_blueprint_manager.get(this.extends)).generateMob(mob_blueprint_manager, loc));
        if (this.name) {
            ret.setComponent('name', this.name);
        }
        if (this.sprite) {
            ret.setComponent('sprite', this.sprite);
        }
        if (this.race) {
            const sheet = ret.getComponent('sheet');
            if (sheet !== undefined) {
                sheet.race = new CharacterRace(this.race);
                if (sheet.race.traits.includes('omnidirectional')) {
                    ret.setComponent('direction', undefined);
                }
            }
        }
        if (this.controller) {
            ret.setComponent('controller', Controller.getNewController(this.controller))
        }
        return ret;
    }
}