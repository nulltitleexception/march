import * as t from 'io-ts';

export enum SKILL {
    // weapon
    LONG_BLADE,
    SHORT_BLADE,
    BLUNT,
    AXE,
    POLEARM,
    STAFF,
    BOW,
    CROSSBOW,
    SHIELD,
    // armor
    UNARMORED,
    CLOTH_ARMOR,
    LEATHER_ARMOR,
    CHAIN_ARMOR,
    PLATE_ARMOR,
    // magic methods
    IMPOSITION, // direct exertion of will - "Will Magic"
    INCANTATION, // utilizing words of power - "Chants"
    SIGILRY, // utilizing shapes and patterns to channel power to effects - "Enchanting"
    SUPPLICATION, // entreating powerful beings, deities, etc.
    MANIFESTATION, // embodiment, "naming", utilizing the very name and nature of a being or object to utilize one of its aspects - usually for the self, but sometimes upon others.  Works most easily with non-sentient objects/concepts, and is especially difficult to manifest an aspect of a spaient being.  i.e. one manifests an aspect of water or earth, one is a supplicant of the Flame God Guet'Ro
    CONVERSION, // trading one thing for another, sacrifice, etc. (used to convert types of energy, e.g. a souls weight into mana)
    ATAVISM, // altering the self by bringing forth bloodline powers
    // magic effects
    ILLUSION, // tricking the mind or senses
    BENEDICTION, // beneficially affecting others (buffs, etc)
    MALEDICTION, // detrimentally affecting others (debuffs, curses, etc.)
    ENHANCEMENT, // making the self more powerful
    RESTORATION, // curing diseases, mending wounds, fixing that which is decayed, rusted, injured, etc. (a stick broken in half would use alteration, a rotting loaf of bread could be 'restored')
    ALTERATION, // altering the physical world: igniting or freezing an object, some physical repairs (removing rust would be restoration, combining two broken halves would be alteration)
    RECONFIGURATION, // "space magic" - Moving things, levitation, telekinesis, spacial expansion (bags of holding, house in a bag)
    REORIENTATION, // "dimensional magic" - looking from a different perspective: dimensional travel, teleportation
    CONJURATION, // creating objects or beings from magic
    SUMMONING, // calling forth an existing being from far away (another plane, etc.)
    BINDING, // forcing a being to follow your will
    REPUDIATION, // negating or reversing magical effects
    PROPHECY, // foretelling the future, or the past
    // misc
    ALCHEMY,
    HERBALISM,
    BUTCHERING,
    PROSPECTING,
    SMELTING,
    SMITHING,
    ENCHANTING,
}

const SKILL_COUNT: number = SKILL.ENCHANTING + 1;

type CharacterSkillsSchema = t.TypeOf<typeof CharacterSkills.schema>;

export class CharacterSkills {
    public static schema = t.type(Object.keys(SKILL).reduce((all, skill) => {
        if (isNaN(Number(skill))) {
            all[skill as keyof typeof SKILL] = t.number;
        }
        return all;
    }, {} as Record<keyof typeof SKILL, t.NumberC>));

    public static fromJSON(json: CharacterSkillsSchema) {
        const ret = new CharacterSkills();
        for (let i = 0; i < SKILL_COUNT; i++) {
            ret.values[i] = json[SKILL[i] as keyof typeof SKILL] || 0;
        }
        return ret;
    }
    private values: number[];
    constructor() {
        this.values = [];
        for (let i = 0; i < SKILL_COUNT; i++) {
            this.values[i] = 0;
        }
    }
    public get(skill: SKILL): number {
        return this.values[skill];
    }
    public set(skill: SKILL, val: number) {
        this.values[skill] = val;
    }
    public getEssenceCost(): number {
        let ret: number = 0;
        for (let i = 0; i < SKILL_COUNT; i++) {
            ret += ((this.values[i] + 1) * (this.values[i])) / 2;
        }
        return ret;
    }
    public getLevelupCosts() {
        const ret: CharacterSkills = new CharacterSkills();
        for (let i = 0; i < SKILL_COUNT; i++) {
            ret.values[i] = this.values[i] + 1;
        }
        return ret;
    }
    public clone() {
        const ret: CharacterSkills = new CharacterSkills();
        for (let i = 0; i < SKILL_COUNT; i++) {
            ret.values[i] = this.values[i];
        }
        return ret;
    }
    public toJSON(): CharacterSkillsSchema {
        return this.values.reduce(
            (skills: CharacterSkillsSchema, value: number, skill: SKILL) => {
                skills[SKILL[skill] as keyof typeof SKILL] = value;
                return skills;
            }, {} as CharacterSkillsSchema,
        );
    }
}
