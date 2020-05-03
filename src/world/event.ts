import type { ValueOf } from '../util/types';
import { AttackEvent } from './event/attack_event';
import { BackstepEvent } from './event/backstep_event';
import { DropEvent } from './event/drop_event';
import type { EVENT_TYPE } from './event/event_type';
import { LookEvent } from './event/look_event';
import { MoveEvent } from './event/move_event';
import { NewRoundEvent } from './event/new_round_event';
import { PickupEvent } from './event/pickup_event';
import { SayEvent } from './event/say_event';
import { StrafeEvent } from './event/strafe_event';
import { TurnEvent } from './event/turn_event';
import { WaitEvent } from './event/wait_event';
import { WaitOnceEvent } from './event/wait_once_event';
import { WaitRoundEvent } from './event/wait_round_event';

interface EventClientJSON {
    type: keyof typeof EVENT_TYPE,
}

export interface Event<T extends EVENT_TYPE = EVENT_TYPE> {
    type: T;
    getClientJSON(): EventClientJSON;
}

export type EventClass<T extends EVENT_TYPE> = new (...args: any) => Event<T>;

type EventClassArray = {
    [P in ValueOf<typeof EVENT_TYPE>]: EventClass<P>;
};

export const EventClasses: EventClassArray = [
    NewRoundEvent,
    WaitEvent,
    WaitOnceEvent,
    WaitRoundEvent,
    SayEvent,
    LookEvent,
    MoveEvent,
    StrafeEvent,
    BackstepEvent,
    TurnEvent,
    AttackEvent,
    PickupEvent,
    DropEvent,
];
