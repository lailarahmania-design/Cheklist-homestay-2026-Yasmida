// Titik masuk game (dimuat terpisah agar Phaser hanya diunduh saat bermain).

import Phaser from 'phaser';
import { WorldScene } from './scenes/world-scene.js';

/**
 * @param {HTMLElement} parent
 * @param {{characterId:string, quest:import('./systems/quest.js').QuestState, hooks:object, freeExplore?:boolean}} opts
 */
export function startGame(parent, opts) {
  const scene = new WorldScene(opts);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    render: { antialias: true, roundPixels: false },
    input: { activePointers: 3 },
    scene: [scene],
    banner: false,
  });
  const ready = () => scene.sys?.isActive() && scene.player;
  return {
    game,
    scene,
    setPaused(p) {
      if (ready()) scene.paused = p;
    },
    setFreeExplore(on) {
      if (ready()) scene.setFreeExplore(on);
    },
    playAnim(name) {
      if (ready()) scene.player.play(name);
    },
    lumi(kind) {
      if (ready()) scene.lumi.react(kind);
    },
    toggleOverview() {
      return ready() ? scene.cameraDirector.toggleOverview() : false;
    },
    destroy() {
      game.destroy(true);
    },
  };
}
