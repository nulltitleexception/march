import { ITEM_TYPE, ItemSchema } from './item';

export enum APPAREL_SLOT {
    HEAD,
    LEFT_EAR, RIGHT_EAR,
    NECKLACE,
    SHIRT,
    CLOAK,
    LEFT_WRIST, RIGHT_WRIST,
    THROAT_ARMOR,
    CHEST_ARMOR,
    LEFT_SHOULDER_ARMOR, RIGHT_SHOULDER_ARMOR,
    LEFT_UPPER_ARM_ARMOR, RIGHT_UPPER_ARM_ARMOR,
    LEFT_ELBOW_ARMOR, RIGHT_ELBOW_ARMOR,
    LEFT_FOREARM_ARMOR, RIGHT_FOREARM_ARMOR,
    LEFT_HAND, RIGHT_HAND,
    LEFT_RING_POINTERFINGER, RIGHT_RING_POINTERFINGER,
    LEFT_RING_MIDDLEFINGER, RIGHT_RING_MIDDLEFINGER,
    LEFT_RING_RINGFINGER, RIGHT_RING_RINGFINGER,
    LEFT_RING_PINKY, RIGHT_RING_PINKY,
    BELT,
    PANTS,
    LEFT_THIGH_ARMOR, RIGHT_THIGH_ARMOR,
    LEFT_KNEE_ARMOR, RIGHT_KNEE_ARMOR,
    LEFT_SHIN_ARMOR, RIGHT_SHIN_ARMOR,
    LEFT_FOOT, RIGHT_FOOT,
}

export enum APPAREL_TYPE {
    // jewelry
    NECKLACE,
    BRACELET,
    ARM_BAND,
    EARRING,
    RING,
    // clothing
    HAT,
    SHIRT,
    VEST,
    BELT,
    PANTS,
    LEFT_GLOVE,
    RIGHT_GLOVE,
    // armor
    HELMET,
    CUIRASS,
    LEFT_PAULDRON,
    RIGHT_PAULDRON,
    LEFT_BRACER,
    RIGHT_BRACER,
    GREAVES,
    LEG,
    FEET,

}

export interface ApparelSchema extends ItemSchema {
    item_type: ITEM_TYPE.APPAREL;
}
