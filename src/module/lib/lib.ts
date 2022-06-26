// =============================
// Module Generic function
// =============================

import type { ChatMessageData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import CONSTANTS from '../constants';
import { FinalBlowEffectDefinitions } from '../final-blow-effect-definitions';
import { aemlApi } from '../module';

export async function getToken(documentUuid) {
  const document = await fromUuid(documentUuid);
  //@ts-ignore
  return document?.token ?? document;
}

export function getOwnedTokens(priorityToControlledIfGM: boolean): Token[] {
  const gm = game.user?.isGM;
  if (gm) {
    if (priorityToControlledIfGM) {
      const arr = <Token[]>canvas.tokens?.controlled;
      if (arr && arr.length > 0) {
        return arr;
      } else {
        return <Token[]>canvas.tokens?.placeables;
      }
    } else {
      return <Token[]>canvas.tokens?.placeables;
    }
  }
  if (priorityToControlledIfGM) {
    const arr = <Token[]>canvas.tokens?.controlled;
    if (arr && arr.length > 0) {
      return arr;
    }
  }
  let ownedTokens = <Token[]>canvas.tokens?.placeables.filter((token) => token.isOwner && (!token.data.hidden || gm));
  if (ownedTokens.length === 0 || !canvas.tokens?.controlled[0]) {
    ownedTokens = <Token[]>(
      canvas.tokens?.placeables.filter((token) => (token.observer || token.isOwner) && (!token.data.hidden || gm))
    );
  }
  return ownedTokens;
}

export function is_UUID(inId) {
  return typeof inId === 'string' && (inId.match(/\./g) || []).length && !inId.endsWith('.');
}

export function getUuid(target) {
  // If it's an actor, get its TokenDocument
  // If it's a token, get its Document
  // If it's a TokenDocument, just use it
  // Otherwise fail
  const document = getDocument(target);
  return document?.uuid ?? false;
}

export function getDocument(target) {
  if (target instanceof foundry.abstract.Document) return target;
  return target?.document;
}

export function is_real_number(inNumber) {
  return !isNaN(inNumber) && typeof inNumber === 'number' && isFinite(inNumber);
}

export function isGMConnected() {
  return !!Array.from(<Users>game.users).find((user) => user.isGM && user.active);
}

export function isGMConnectedAndSocketLibEnable() {
  return isGMConnected(); // && !game.settings.get(CONSTANTS.MODULE_NAME, 'doNotUseSocketLibFeature');
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isActiveGM(user) {
  return user.active && user.isGM;
}

export function getActiveGMs() {
  return game.users?.filter(isActiveGM);
}

export function isResponsibleGM() {
  if (!game.user?.isGM) return false;
  return !getActiveGMs()?.some((other) => other.data._id < <string>game.user?.data._id);
}

export function firstGM() {
  return game.users?.find((u) => u.isGM && u.active);
}

export function isFirstGM() {
  return game.user?.id === firstGM()?.id;
}

export function firstOwner(doc): User | undefined {
  /* null docs could mean an empty lookup, null docs are not owned by anyone */
  if (!doc) return undefined;
  const permissionObject = (doc instanceof TokenDocument ? doc.actor?.data.permission : doc.data.permission) ?? {};
  const playerOwners = Object.entries(permissionObject)
    .filter(([id, level]) => !game.users?.get(id)?.isGM && game.users?.get(id)?.active && level === 3)
    .map(([id, level]) => id);

  if (playerOwners.length > 0) {
    return game.users?.get(<string>playerOwners[0]);
  }

  /* if no online player owns this actor, fall back to first GM */
  return firstGM();
}

/* Players first, then GM */
export function isFirstOwner(doc) {
  return game.user?.id === firstOwner(doc)?.id;
}

// ================================
// Logger utility
// ================================

// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3

export function debug(msg, args = '') {
  if (game.settings.get(CONSTANTS.MODULE_NAME, 'debug')) {
    console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
  }
  return msg;
}

export function log(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  console.log(message.replace('<br>', '\n'));
  return message;
}

export function notify(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  ui.notifications?.notify(message);
  console.log(message.replace('<br>', '\n'));
  return message;
}

export function info(info, notify = false) {
  info = `${CONSTANTS.MODULE_NAME} | ${info}`;
  if (notify) ui.notifications?.info(info);
  console.log(info.replace('<br>', '\n'));
  return info;
}

export function warn(warning, notify = false) {
  warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
  if (notify) ui.notifications?.warn(warning);
  console.warn(warning.replace('<br>', '\n'));
  return warning;
}

export function error(error, notify = true) {
  error = `${CONSTANTS.MODULE_NAME} | ${error}`;
  if (notify) ui.notifications?.error(error);
  return new Error(error.replace('<br>', '\n'));
}

export function timelog(message): void {
  warn(Date.now(), message);
}

export const i18n = (key: string): string => {
  return game.i18n.localize(key)?.trim();
};

export const i18nFormat = (key: string, data = {}): string => {
  return game.i18n.format(key, data)?.trim();
};

// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };

export function dialogWarning(message, icon = 'fas fa-exclamation-triangle') {
  return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
        <br><br>${message}
    </p>`;
}

// =========================================================================================

export function cleanUpString(stringToCleanUp: string) {
  // regex expression to match all non-alphanumeric characters in string
  const regex = /[^A-Za-z0-9]/g;
  if (stringToCleanUp) {
    return i18n(stringToCleanUp).replace(regex, '').toLowerCase();
  } else {
    return stringToCleanUp;
  }
}

export function isStringEquals(stringToCheck1: string, stringToCheck2: string, startsWith = false): boolean {
  if (stringToCheck1 && stringToCheck2) {
    const s1 = cleanUpString(stringToCheck1) ?? '';
    const s2 = cleanUpString(stringToCheck2) ?? '';
    if (startsWith) {
      return s1.startsWith(s2) || s2.startsWith(s1);
    } else {
      return s1 === s2;
    }
  } else {
    return stringToCheck1 === stringToCheck2;
  }
}

/**
 * The duplicate function of foundry keep converting my string value to "0"
 * i don't know why this methos is a brute force solution for avoid that problem
 */
export function duplicateExtended(obj: any): any {
  try {
    //@ts-ignore
    if (structuredClone) {
      //@ts-ignore
      return structuredClone(obj);
    } else {
      // Shallow copy
      // const newObject = jQuery.extend({}, oldObject);
      // Deep copy
      // const newObject = jQuery.extend(true, {}, oldObject);
      return jQuery.extend(true, {}, obj);
    }
  } catch (e) {
    return duplicate(obj);
  }
}

// =========================================================================================

/**
 *
 * @param obj Little helper for loop enum element on typescript
 * @href https://www.petermorlion.com/iterating-a-typescript-enum/
 * @returns
 */
export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}

/**
 * @href https://stackoverflow.com/questions/7146217/merge-2-arrays-of-objects
 * @param target
 * @param source
 * @param prop
 */
export function mergeByProperty(target: any[], source: any[], prop: any) {
  for (const sourceElement of source) {
    const targetElement = target.find((targetElement) => {
      return sourceElement[prop] === targetElement[prop];
    });
    targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
  }
  return target;
}

/**
 * Returns the first selected token
 */
export function getFirstPlayerTokenSelected(): Token | null {
  // Get first token ownted by the player
  const selectedTokens = <Token[]>canvas.tokens?.controlled;
  if (selectedTokens.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  if (!selectedTokens || selectedTokens.length == 0) {
    //if(game.user.character.data.token){
    //  //@ts-ignore
    //  return game.user.character.data.token;
    //}else{
    return null;
    //}
  }
  return <Token>selectedTokens[0];
}

/**
 * Returns a list of selected (or owned, if no token is selected)
 * note: ex getSelectedOrOwnedToken
 */
export function getFirstPlayerToken(): Token | null {
  // Get controlled token
  let token: Token;
  const controlled: Token[] = <Token[]>canvas.tokens?.controlled;
  // Do nothing if multiple tokens are selected
  if (controlled.length && controlled.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  // If exactly one token is selected, take that
  token = <Token>controlled[0];
  if (!token) {
    if (!controlled.length || controlled.length == 0) {
      // If no token is selected use the token of the users character
      token = <Token>canvas.tokens?.placeables.find((token) => token.data._id === game.user?.character?.data?._id);
    }
    // If no token is selected use the first owned token of the users character you found
    if (!token) {
      token = <Token>canvas.tokens?.ownedTokens[0];
    }
  }
  return token;
}

function getElevationToken(token: Token): number {
  const base = token.document.data;
  return getElevationPlaceableObject(base);
}

function getElevationWall(wall: Wall): number {
  const base = wall.document.data;
  return getElevationPlaceableObject(base);
}

function getElevationPlaceableObject(placeableObject: any): number {
  let base = placeableObject;
  if (base.document) {
    base = base.document.data;
  }
  const base_elevation =
    //@ts-ignore
    typeof _levels !== 'undefined' &&
    //@ts-ignore
    _levels?.advancedLOS &&
    (placeableObject instanceof Token || placeableObject instanceof TokenDocument)
      ? //@ts-ignore
        _levels.getTokenLOSheight(placeableObject)
      : base.elevation ??
        base.flags['levels']?.elevation ??
        base.flags['levels']?.rangeBottom ??
        base.flags['wallHeight']?.wallHeightBottom ??
        0;
  return base_elevation;
}

// =============================
// Module specific function
// =============================

// export async function zeroHPExpiry(actor:Actor, hpUpdate:number, user) {
//   // const hpUpdate = getProperty(update, "data.attributes.hp.value");
//   // if (hpUpdate !== 0) return;
//   const expiredEffects: string[] = [];
//   for (const effect of actor.effects) {
//     //@ts-ignore
//     if (effect.data.flags?.dae?.specialDuration?.includes("zeroHP")) {
//       expiredEffects.push(<string>effect.data._id);
//     }
//   }
//   if (expiredEffects.length > 0){
//     //@ts-ignore
//     await actor.deleteEmbeddedDocuments("ActiveEffect", expiredEffects, { "expiry-reason": "midi-qol:zeroHP" })
//   }
// }

// export async function checkAndApply(actor:Actor, hpUpdate:number, user) {
//   // const hpUpdate = getProperty(update, "data.attributes.hp.value");
//   // return wrapped(update,options,user);
//   // if (hpUpdate === undefined){
//   //   return;
//   // }
//   //@ts-ignore
//   const attributes = actor.data.data.attributes;

//   const needsDead = hpUpdate === 0;
//   if(needsDead){
//     // checkAndApplyDead(actor, update, options, user);

//   }
// }

export async function checkAndApplyWounded(actor: Actor, hpUpdate: number, user: User) {
  const tokens = actor.getActiveTokens();
  //@ts-ignore
  const controlled = tokens.filter((t) => t._controlled);
  const token = controlled.length ? <Token>controlled.shift() : <Token>tokens.shift();
  const msg = i18nFormat('final-blow.chat.messages.wounded', { token: token?.name });
  generateCardsFromToken(token, actor, msg);
  if (game.modules.get('mmm')?.active) {
    //@ts-ignore
    MaxwelMaliciousMaladies.displayDialog();
  }
  // const hpUpdate = getProperty(update, "data.attributes.hp.value");
  // return wrapped(update,options,user);
  // if (hpUpdate === undefined){
  //   return;
  // }
  /*
  //@ts-ignore
  const attributes = actor.data.data.attributes;
  // if (configSettings.addWounded > 0) {
    //@ts-ignore
    const CEWounded = game.dfreds?.effects?._wounded
    // const woundedLevel = attributes.hp.max * configSettings.addWounded / 100;
    // const needsWounded = hpUpdate > 0 && hpUpdate < woundedLevel;
    const needsWounded = true;
    if (game.modules.get("dfreds-convenient-effects")?.active && CEWounded) {
      const wounded = await this.convenientEffectsHasEffect(CEWounded.name, actor.uuid);
      if (wounded !== needsWounded) {
        //@ts-ignore
        await game.dfreds?.effectInterface.toggleEffect(CEWounded.name, { overlay: false, uuids: [actor.uuid] });
      }
    } else {
      const tokens = actor.getActiveTokens();
      //@ts-ignore
      const controlled = tokens.filter(t => t._controlled);
      const token = controlled.length ? controlled.shift() : tokens.shift();
      const bleeding = CONFIG.statusEffects.find(se => se.id === "bleeding");
      if (bleeding && token) {
        await token.toggleEffect(<string>bleeding.icon, { overlay: false, active: needsWounded });
        if(needsWounded){
          if (game.modules.get("mmm")?.active){
            //@ts-ignore
            MaxwelMaliciousMaladies.displayDialog();
          }
        }
      }
    }
  // }
  */
}

export async function checkAndApplyUnconscious(actor: Actor, hpUpdate: number, user: User) {
  const tokens = actor.getActiveTokens();
  //@ts-ignore
  const controlled = tokens.filter((t) => t._controlled);
  const token = controlled.length ? <Token>controlled.shift() : <Token>tokens.shift();
  const msg = i18nFormat('final-blow.chat.messages.unconscious', { token: token?.name });
  generateCardsFromToken(token, actor, msg);

  // async addEffectOnToken(tokenId: string, effectName: string, effect: Effect)
  // async findEffectByNameOnToken(tokenId: string, effectName: string): Promise<ActiveEffect | null>
  // async hasEffectAppliedOnToken(tokenId: string, effectName: string, includeDisabled: boolean)

  const effect = FinalBlowEffectDefinitions.unconscious();
  //@ts-ignore
  aemlApi.addEffectOnToken(token.id, effect.name, effect);

  // const hpUpdate = getProperty(update, "data.attributes.hp.value");
  // return wrapped(update,options,user);
  // if (hpUpdate === undefined){
  //   return;
  // }
  /*
  //@ts-ignore
  const attributes = actor.data.data.attributes;
  // if (configSettings.addDead) {
    // const needsDead = hpUpdate === 0;
    const needsUnconscious = true;
    if (game.modules.get("dfreds-convenient-effects")?.active && game.settings.get("dfreds-convenient-effects", "modifyStatusEffects") !== "none") {
      const effectName = this.getConvenientEffectsUnconscious().name;
      const hasEffect = await this.convenientEffectsHasEffect(effectName, actor.uuid);
      if ((needsUnconscious !== hasEffect)) {
        if (!actor.hasPlayerOwner) { // For CE dnd5e does not treat dead as dead for the combat tracker so update it by hand as well
          let combatant;
          if (actor.token) combatant = game.combat?.getCombatantByToken(<string>actor.token.id);
          //@ts-ignore
          else combatant = game.combat?.getCombatantByActor(actor.id);
          if (combatant) await combatant.update({ defeated: needsUnconscious })
        }
        //@ts-ignore
        await game.dfreds?.effectInterface.toggleEffect(effectName, { overlay: true, uuids: [actor.uuid] });
      }
    }
    else {
      const tokens = actor.getActiveTokens();
      //@ts-ignore
      const controlled = tokens.filter(t => t._controlled);
      const token = controlled.length ? controlled.shift() : tokens.shift();
      if (token) {
        await token.toggleEffect("/icons/svg/unconscious.svg", { overlay: true, active: needsUnconscious });
      }
    }
  // }

  */
}

export async function checkAndApplyDead(actor: Actor, hpUpdate: number, user: User) {
  const tokens = actor.getActiveTokens();
  //@ts-ignore
  const controlled = tokens.filter((t) => t._controlled);
  const token = controlled.length ? <Token>controlled.shift() : <Token>tokens.shift();
  const msg = i18nFormat('final-blow.chat.messages.dead', { token: token?.name });
  generateCardsFromToken(token, actor, msg);
  // const hpUpdate = getProperty(update, "data.attributes.hp.value");
  // return wrapped(update,options,user);
  // if (hpUpdate === undefined){
  //   return;
  // }
  /*
  //@ts-ignore
  const attributes = actor.data.data.attributes;
  // if (configSettings.addDead) {
    // const needsDead = hpUpdate === 0;
    const needsDead = true;
    if (game.modules.get("dfreds-convenient-effects")?.active && game.settings.get("dfreds-convenient-effects", "modifyStatusEffects") !== "none") {
      const effectName = actor.hasPlayerOwner ? this.getConvenientEffectsUnconscious().name : this.getConvenientEffectsDead().name;
      const hasEffect = await this.convenientEffectsHasEffect(effectName, actor.uuid);
      if ((needsDead !== hasEffect)) {
        if (!actor.hasPlayerOwner) { // For CE dnd5e does not treat dead as dead for the combat tracker so update it by hand as well
          let combatant;
          if (actor.token) combatant = game.combat?.getCombatantByToken(<string>actor.token.id);
          //@ts-ignore
          else combatant = game.combat?.getCombatantByActor(actor.id);
          if (combatant) await combatant.update({ defeated: needsDead })
        }
        //@ts-ignore
        await game.dfreds?.effectInterface.toggleEffect(effectName, { overlay: true, uuids: [actor.uuid] });
      }
    }
    else {
      const tokens = actor.getActiveTokens();
      //@ts-ignore
      const controlled = tokens.filter(t => t._controlled);
      const token = controlled.length ? controlled.shift() : tokens.shift();
      if (token) {
        if (actor.hasPlayerOwner) {
          await token.toggleEffect("/icons/svg/unconscious.svg", { overlay: true, active: needsDead });
        } else {
          await token.toggleEffect(CONFIG.controlIcons.defeated, { overlay: true, active: needsDead });
        }
      }
    }
  // }
  */
}

export async function convenientEffectsHasEffect(effectName: string, uuid: string) {
  //@ts-ignore
  return game.dfreds.effectInterface.hasEffectApplied(effectName, uuid);
}

export function getConvenientEffectsUnconscious() {
  //@ts-ignore
  return <Effect>game.dfreds?.effects?._unconscious;
}

export function getConvenientEffectsDead() {
  //@ts-ignore
  return <Effect>game.dfreds?.effects?._dead;
}

export function getConvenientEffectsWounded() {
  //@ts-ignore
  return <Effect>game.dfreds?.effects?._wounded;
}

export async function renderDialogFinalBlow(actor: Actor, hpUpdate: number, user: User) {
  // const template = await renderTemplate(
  //   `modules/${CONSTANTS.MODULE_NAME}/templates/XXX.hbs`,
  //   data,
  // );
  const template = 'This is a "FINAL BLOW", decide what to do...';
  const d = new Dialog({
    title: i18n(`${CONSTANTS.MODULE_NAME}.dialog.decidethefinalblow`),
    content: template,
    buttons: {
      wounded: {
        icon: '<i class="fas fa-tint"></i>',
        label: i18n(`${CONSTANTS.MODULE_NAME}.dialog.wounded`),
        callback: async (html: JQuery<HTMLElement>) => {
          checkAndApplyWounded(actor, hpUpdate, user);
        },
      },
      unconscious: {
        icon: '<i class="fas fa-dizzy"></i>',
        label: i18n(`${CONSTANTS.MODULE_NAME}.dialog.unconscious`),
        callback: async (html: JQuery<HTMLElement>) => {
          checkAndApplyUnconscious(actor, hpUpdate, user);
        },
      },
      dead: {
        icon: '<i class="fas fa-skull"></i>',
        label: i18n(`${CONSTANTS.MODULE_NAME}.dialog.dead`),
        callback: async (html: JQuery<HTMLElement>) => {
          checkAndApplyDead(actor, hpUpdate, user);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: i18n(`${CONSTANTS.MODULE_NAME}.dialog.cancel`),
      },
    },
    render: (html: JQuery<HTMLElement>) => {
      //
    },
    default: 'cancel',
  });
  d.render(true);
}

export async function generateCardsFromToken(token: Token, actor: Actor, messageChat: string) {
  const data = {
    actor: actor,
    combatant: null,
    combat: null,
    last: null, //revious,
    token: canvas.scene ? canvas.tokens?.get(token?.id) : null, // TODO: This can be wrong
    // get round() { return this.combat?.round; },
    // get turn() { return this.combat?.turn; },
    user: game.user,
    get player() {
      return this.user?.name;
    },
    name: token?.name,
    label: '',
    get hidden() {
      return this.combatant?.hidden ?? false;
    },
    get visible() {
      return this.combatant?.visible ?? false;
    },
    obfuscated: false,
    portrait: token?.icon ?? token.actor?.data.token.img,
    hidePortrait: false,
    msg: messageChat,
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true,
  };

  const obfuscateType = <string>game.settings.get(CONSTANTS.MODULE_NAME, 'obfuscateNPCs');
  const hasVisibleName = () => (data.token ? [30, 50].includes(data.token.data.displayName) : true); // 30=hovered by anyone or 50=always for everyone
  const obfuscate = {
    get all() {
      return false;
    },
    get owned() {
      return !data.actor?.hasPlayerOwner;
    },
    get token() {
      return !hasVisibleName();
    },
    get any() {
      return !(data.actor?.hasPlayerOwner || hasVisibleName());
    },
  };
  data.obfuscated = obfuscate[obfuscateType] ?? false;
  if (data.obfuscated) {
    data.name = i18n('final-blow.chat.messages.unidentifiedTurn');
  }
  data.label = i18nFormat('final-blow.chat.messages.turn', { name: `<span class='name'>${data.name}</span>` });

  if (!data.portrait || game.settings.get(CONSTANTS.MODULE_NAME, 'hidePortrait')) {
    data.hidePortrait = true;
  }

  // const defeated = data.combatant.data.defeated;
  // const msgs:ChatMessageData[] = [];
  // if (game.settings.get(CFG.module, CFG.SETTING.missedKey)) {
  // 	const msg = missedTurn(data, context);
  // 	if (msg) msgs.push(msg);
  // }

  // if (defeated) return msgs; // undesired
  // if (data.last?.combatant != null && data.last.combatant.id === data.combatant.id) return msgs; // don't report the same thing multiple times

  const getUsers = (thing, permission) =>
    Object.entries(thing.data.permission)
      .filter((u) => <User>u[1] >= permission)
      .map((u) => u[0]);

  const speaker = data.obfuscated
    ? { user: game.user?.id }
    : ChatMessage.getSpeaker({
        token: data.token?.document,
        actor: <Actor>data.actor,
      });

  const msgData = {
    content: await renderTemplate(`modules/${CONSTANTS.MODULE_NAME}/templates/finalBlowChatMessage.hbs`, {
      data,
    }),
    speaker: speaker,
    rollMode: !data.hidden ? 'publicroll' : 'gmroll',
    whisper: !data.hidden ? [] : getUsers(data.actor, CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER),
    flags: {
      [CONSTANTS.MODULE_NAME]: {
        enabled: true,
      },
    },
  };

  // msgs.push(<any>msgData);

  ChatMessage.create(msgData);
}

/**
 * @param {ChatMessage} cm
 * @param {JQuery} jq
 * @param {Object} _options
 */
export function chatMessageEvent(token: Token, cm: ChatMessage, jq: JQuery<HTMLElement>, _options) {
  const isGM = game.user?.isGM;
  const cmd = cm;

  const html = <HTMLElement>jq[0];

  const main = html.closest('[data-message-id]');
  html?.classList.add('turn-announcer', 'final-blow');

  // compressTurnAnnounceMessage(cm, html, main);
  html
    .querySelectorAll('.message-sender,.message-timestamp')
    ?.forEach((el: HTMLElement) => (el.style.display = 'none'));
  const db = html.querySelector('.message-header .message-delete');
  const content = html.querySelector('.message-content');
  const mb = content?.querySelector('.turn-announcer');
  if (db && mb) {
    mb.append(db);
  }

  main?.querySelector('.whisper-to')?.remove();

  // De-obfuscate name for GM
  if (isGM && cm.getFlag(CONSTANTS.MODULE_NAME, 'obfuscated')) {
    if (token) {
      const name = html.querySelector('.actor .name-box .name');
      if (name) {
        name.textContent = token.name;
      }
      html.classList.add('obfuscated');
    }
  }
}
