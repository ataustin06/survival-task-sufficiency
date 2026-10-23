console.log('MAIN.JS LOADED');

import Start from './scenes/Start.js?v=20261023-tree-limbs2';

console.log('START IMPORTED:', Start);

// Use a tall scene on portrait phones so the task can be read without rotating.
// Extra backing pixels preserve crisp text on high-density displays.
const portrait = window.innerHeight > window.innerWidth;
const logicalWidth = portrait ? 720 : 1280;
const logicalHeight = portrait ? 1280 : 720;
const displayScale = Math.min(window.innerWidth / logicalWidth, window.innerHeight / logicalHeight);
const physicalScale = displayScale * (window.devicePixelRatio || 1);
const renderScale = Math.min(2, Math.max(1, Math.ceil(physicalScale * 4) / 4));

const config = {
    type: Phaser.AUTO,

    parent: 'game-container',

    width: logicalWidth * renderScale,
    height: logicalHeight * renderScale,

    backgroundColor: '#ffffff',

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    scene: [Start],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
