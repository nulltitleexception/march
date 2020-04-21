import { INSTANCE_GEN_TYPE } from '../instancegenerator';
import { Random } from '../math/random';
import { spawnMobFromSchema } from '../mobschema';
import { ACTION_STATUS, Entity } from '../old_entity';
import { Instance, InstanceAttributes } from '../old_instance';
import { Location } from '../old_location';

class TextEntity extends Entity {
    public doNextAction(): ACTION_STATUS {
        this.charSheet.status.action_points = 0;
        return ACTION_STATUS.WAITING;
    }
}

export class CharGen {
    public static getTutorialLocation() {
        const attr = new InstanceAttributes(Random.getDeterministicID(), 10, 10, true);
        attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
        const inst = new Instance(attr);
        const t1 = new TextEntity(Entity.generateNewEntityID(), 'Use WASD to move', 'text', new Location(2, 1, inst.id));
        const t2 = new TextEntity(Entity.generateNewEntityID(), 'Press Spacebar to Attack', 'text', new Location(5, 2, inst.id));
        const t3 = new TextEntity(Entity.generateNewEntityID(), 'Use > to do down stairs', 'text', new Location(8, 3, inst.id));
        const slime = spawnMobFromSchema('slime_tutorial', new Location(6, 6, inst.id));
        if (!slime) {
            console.log('could not get Tutorial Slime schema!');
        }
        inst.saveToDisk();
        return new Location(3, 8, inst.id);
    }
}