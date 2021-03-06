import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class EndLoadEvent {
    public type: EVENT_TYPE.END_LOAD = EVENT_TYPE.END_LOAD;
    constructor() { /* nothing to do here */ }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
        };
    }
}
