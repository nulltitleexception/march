import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class SayEvent {
    public type: EVENT_TYPE.SAY = EVENT_TYPE.SAY;
    public resendBoard = false;
    constructor(private entity: Entity, private message: string) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getName()}: ${this.message}`,
        };
    }
}