import { getTileProps } from '../../tile';
import { ChatDirections, DIRECTION, directionVectors, getRelativeDirection, RELATIVE_DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { AddEntityEvent } from '../event/add_entity_event';
import { RemoveEntityEvent } from '../event/remove_entity_event';
import { SetBoardEvent } from '../event/set_board_event';
import { StrafeEvent } from '../event/strafe_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';
import { BackstepAction } from './backstep_action';
import { MoveAction } from './move_action';

export class StrafeAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new StrafeAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.STRAFE = ACTION_TYPE.STRAFE;
    public readonly cost: number = 8;
    constructor(public direction: DIRECTION) {
        super();
    }
    public async perform(entity: Entity) {
        const vec = directionVectors[this.direction];
        const newLoc = entity.location.translate(vec.x, vec.y);

        if (!getTileProps(newLoc.getTileAt()).passable) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        for (const ent of newLoc.getEntitiesAt()) {
            if (ent.isCollidable()) {
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
        }

        const [direction, sheet] = entity.getComponents('direction', 'sheet');
        if (direction === undefined) {
            return (new MoveAction(this.direction)).perform(entity);
        }
        if (sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const rel_dir = getRelativeDirection(direction, this.direction);
        if (rel_dir === RELATIVE_DIRECTION.FORWARD) {
            return (new MoveAction(this.direction)).perform(entity);
        }
        if (rel_dir === RELATIVE_DIRECTION.BACKWARD) {
            return (new BackstepAction(this.direction)).perform(entity);
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const oldLoc = entity.location;
            entity.location.cell.emitWB(new AddEntityEvent(entity), [newLoc], [oldLoc]);
            entity.setPosition(newLoc.getPosition());
            entity.location.cell.emit(new StrafeEvent(entity, newLoc, rel_dir), oldLoc, newLoc);
            entity.location.cell.emitWB(new RemoveEntityEvent(entity), [oldLoc], [newLoc]);
            entity.getComponent('controller')?.sendEvent(new SetBoardEvent());
            entity.getComponent('visibility_manager')?.recalculateAllVisibleEntities();
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': DIRECTION[this.direction],
        };
    }
}
