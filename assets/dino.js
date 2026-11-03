/* Chromium Dino, BSD-3-Clause. See third_party/dino/LICENSE. */
(function(){const modules={},cache={};
modules["background_el.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundEl = void 0;
exports.getGlobalConfig = getGlobalConfig;
exports.setGlobalConfig = setGlobalConfig;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const utils_js_1 = require("./utils.js");
/**
 * Background element object config.
 * Real values assigned when game type changes.
 */
let globalConfig = {
    maxBgEls: 0,
    maxGap: 0,
    minGap: 0,
    msPerFrame: 0,
    pos: 0,
    speed: 0,
    yPos: 0,
};
function getGlobalConfig() {
    return globalConfig;
}
function setGlobalConfig(config) {
    globalConfig = config;
}
class BackgroundEl {
    /**
     * Background item.
     * Similar to cloud, without random y position.
     */
    constructor(canvas, spritePos, containerWidth, type, imageSpriteProvider) {
        this.remove = false;
        this.yPos = 0;
        this.animTimer = 0;
        this.switchFrames = false;
        this.canvas = canvas;
        const canvasContext = this.canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.spritePos = spritePos;
        this.imageSpriteProvider = imageSpriteProvider;
        this.xPos = containerWidth;
        this.type = type;
        this.gap = (0, utils_js_1.getRandomNum)(getGlobalConfig().minGap, getGlobalConfig().maxGap);
        const spriteConfig = imageSpriteProvider.getSpriteDefinition().backgroundEl[this.type];
        (0, shims_js_1.assert)(spriteConfig);
        this.spriteConfig = spriteConfig;
        this.init();
    }
    /**
     * Initialise the element setting the y position.
     */
    init() {
        if (this.spriteConfig.fixed) {
            (0, shims_js_1.assert)(this.spriteConfig.fixedXPos);
            this.xPos = this.spriteConfig.fixedXPos;
        }
        this.yPos = getGlobalConfig().yPos - this.spriteConfig.height +
            this.spriteConfig.offset;
        this.draw();
    }
    /**
     * Draw the element.
     */
    draw() {
        this.canvasCtx.save();
        let sourceWidth = this.spriteConfig.width;
        let sourceHeight = this.spriteConfig.height;
        let sourceX = this.spriteConfig.xPos;
        const outputWidth = sourceWidth;
        const outputHeight = sourceHeight;
        const imageSprite = this.imageSpriteProvider.getRunnerImageSprite();
        (0, shims_js_1.assert)(imageSprite);
        if (constants_js_1.IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }
        this.canvasCtx.drawImage(imageSprite, sourceX, this.spritePos.y, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        this.canvasCtx.restore();
    }
    /**
     * Update the background element position.
     */
    update(speed) {
        if (!this.remove) {
            if (this.spriteConfig.fixed) {
                const globalConfig = getGlobalConfig();
                (0, shims_js_1.assert)(globalConfig.msPerFrame);
                this.animTimer += speed;
                if (this.animTimer > globalConfig.msPerFrame) {
                    this.animTimer = 0;
                    this.switchFrames = !this.switchFrames;
                }
                if (this.spriteConfig.fixedYPos1 && this.spriteConfig.fixedYPos2) {
                    this.yPos = this.switchFrames ? this.spriteConfig.fixedYPos1 :
                        this.spriteConfig.fixedYPos2;
                }
            }
            else {
                // Fixed speed, regardless of actual game speed.
                this.xPos -= getGlobalConfig().speed;
            }
            this.draw();
            // Mark as removable if no longer in the canvas.
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }
    /**
     * Check if the element is visible on the stage.
     */
    isVisible() {
        return this.xPos + this.spriteConfig.width > 0;
    }
}
exports.BackgroundEl = BackgroundEl;

};
modules["cloud.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cloud = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const utils_js_1 = require("./utils.js");
class Cloud {
    /**
     * Cloud background item.
     * Similar to an obstacle object but without collision boxes.
     */
    constructor(canvas, spritePos, containerWidth, imageSpriteProvider) {
        this.remove = false;
        this.yPos = 0;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.xPos = containerWidth;
        this.spritePos = spritePos;
        this.imageSpriteProvider = imageSpriteProvider;
        this.gap = (0, utils_js_1.getRandomNum)(Config.MIN_CLOUD_GAP, Config.MAX_CLOUD_GAP);
        this.init();
    }
    /**
     * Initialise the cloud. Sets the Cloud height.
     */
    init() {
        this.yPos = (0, utils_js_1.getRandomNum)(Config.MAX_SKY_LEVEL, Config.MIN_SKY_LEVEL);
        this.draw();
    }
    /**
     * Draw the cloud.
     */
    draw() {
        const runnerImageSprite = this.imageSpriteProvider.getRunnerImageSprite();
        this.canvasCtx.save();
        let sourceWidth = Config.WIDTH;
        let sourceHeight = Config.HEIGHT;
        const outputWidth = sourceWidth;
        const outputHeight = sourceHeight;
        if (constants_js_1.IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        this.canvasCtx.drawImage(runnerImageSprite, this.spritePos.x, this.spritePos.y, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        this.canvasCtx.restore();
    }
    /**
     * Update the cloud position.
     */
    update(speed) {
        if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();
            // Mark as removable if no longer in the canvas.
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }
    /**
     * Check if the cloud is visible on the stage.
     */
    isVisible() {
        return this.xPos + Config.WIDTH > 0;
    }
}
exports.Cloud = Cloud;
/**
 * Cloud object config.
 */
var Config;
(function (Config) {
    Config[Config["HEIGHT"] = 14] = "HEIGHT";
    Config[Config["MAX_CLOUD_GAP"] = 400] = "MAX_CLOUD_GAP";
    Config[Config["MAX_SKY_LEVEL"] = 30] = "MAX_SKY_LEVEL";
    Config[Config["MIN_CLOUD_GAP"] = 100] = "MIN_CLOUD_GAP";
    Config[Config["MIN_SKY_LEVEL"] = 71] = "MIN_SKY_LEVEL";
    Config[Config["WIDTH"] = 46] = "WIDTH";
})(Config || (Config = {}));

};
modules["constants.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DIMENSIONS = exports.FPS = exports.IS_RTL = exports.IS_MOBILE = exports.IS_HIDPI = exports.IS_IOS = void 0;
// TODO(salg): Use preprocessor to filter IOS code at build time.
exports.IS_IOS = /CriOS/.test(window.navigator.userAgent);
exports.IS_HIDPI = window.devicePixelRatio > 1;
exports.IS_MOBILE = /Android/.test(window.navigator.userAgent) || exports.IS_IOS;
exports.IS_RTL = document.documentElement.dir === 'rtl';
// Frames per second.
exports.FPS = 60;
exports.DEFAULT_DIMENSIONS = {
    width: 600,
    height: 150,
};

};
modules["dimensions.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });

};
modules["distance_meter.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistanceMeter = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const utils_js_1 = require("./utils.js");
/**
 * Dimensions of each individual character in pixels.
 */
var Dimensions;
(function (Dimensions) {
    Dimensions[Dimensions["WIDTH"] = 10] = "WIDTH";
    Dimensions[Dimensions["HEIGHT"] = 13] = "HEIGHT";
    Dimensions[Dimensions["DEST_WIDTH"] = 11] = "DEST_WIDTH";
})(Dimensions || (Dimensions = {}));
/**
 * Distance meter config.
 */
var Config;
(function (Config) {
    // Number of digits.
    Config[Config["MAX_DISTANCE_UNITS"] = 5] = "MAX_DISTANCE_UNITS";
    // Distance that causes achievement animation.
    Config[Config["ACHIEVEMENT_DISTANCE"] = 100] = "ACHIEVEMENT_DISTANCE";
    // Used for conversion from pixel distance to a scaled unit.
    Config[Config["COEFFICIENT"] = 0.025] = "COEFFICIENT";
    // Flash duration in milliseconds.
    Config[Config["FLASH_DURATION"] = 250] = "FLASH_DURATION";
    // Flash iterations for achievement animation.
    Config[Config["FLASH_ITERATIONS"] = 3] = "FLASH_ITERATIONS";
    // Padding around the high score hit area.
    Config[Config["HIGH_SCORE_HIT_AREA_PADDING"] = 4] = "HIGH_SCORE_HIT_AREA_PADDING";
})(Config || (Config = {}));
class DistanceMeter {
    /**
     * Handles displaying the distance meter.
     */
    constructor(canvas, spritePos, canvasWidth, imageSpriteProvider) {
        this.achievement = false;
        this.x = 0;
        this.y = 5;
        this.maxScore = 0;
        this.highScore = '0';
        this.digits = [];
        this.defaultString = '';
        this.flashTimer = 0;
        this.flashIterations = 0;
        this.flashingRafId = null;
        this.highScoreBounds = null;
        this.highScoreFlashing = false;
        this.maxScoreUnits = Config.MAX_DISTANCE_UNITS;
        this.canvas = canvas;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.image = imageSpriteProvider.getRunnerImageSprite();
        this.spritePos = spritePos;
        this.canvasWidth = canvasWidth;
        this.init(canvasWidth);
    }
    /**
     * Initialise the distance meter to '00000'.
     * @param width Canvas width in px.
     */
    init(width) {
        let maxDistanceStr = '';
        this.calcXpos(width);
        this.maxScore = this.maxScoreUnits;
        for (let i = 0; i < this.maxScoreUnits; i++) {
            this.draw(i, 0);
            this.defaultString += '0';
            maxDistanceStr += '9';
        }
        this.maxScore = parseInt(maxDistanceStr, 10);
    }
    /**
     * Calculate the xPos in the canvas.
     */
    calcXpos(canvasWidth) {
        this.x = canvasWidth - (Dimensions.DEST_WIDTH * (this.maxScoreUnits + 1));
    }
    /**
     * Draw a digit to canvas.
     * @param digitPos Position of the digit.
     * @param value Digit value 0-9.
     * @param highScore Whether drawing the high score.
     */
    draw(digitPos, value, highScore) {
        let sourceWidth = Dimensions.WIDTH;
        let sourceHeight = Dimensions.HEIGHT;
        let sourceX = Dimensions.WIDTH * value;
        let sourceY = 0;
        const targetX = digitPos * Dimensions.DEST_WIDTH;
        const targetY = this.y;
        const targetWidth = Dimensions.WIDTH;
        const targetHeight = Dimensions.HEIGHT;
        // For high DPI we 2x source values.
        if (constants_js_1.IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }
        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;
        this.canvasCtx.save();
        if (constants_js_1.IS_RTL) {
            const translateX = highScore ?
                this.canvasWidth - (Dimensions.WIDTH * (this.maxScoreUnits + 3)) :
                this.canvasWidth - Dimensions.WIDTH;
            this.canvasCtx.translate(translateX, this.y);
            this.canvasCtx.scale(-1, 1);
        }
        else {
            const highScoreX = this.x - (this.maxScoreUnits * 2) * Dimensions.WIDTH;
            this.canvasCtx.translate(highScore ? highScoreX : this.x, this.y);
        }
        this.canvasCtx.drawImage(this.image, sourceX, sourceY, sourceWidth, sourceHeight, targetX, targetY, targetWidth, targetHeight);
        this.canvasCtx.restore();
    }
    /**
     * Covert pixel distance to a 'real' distance.
     * @param distance Pixel distance ran.
     * @return The 'real' distance ran.
     */
    getActualDistance(distance) {
        return distance ? Math.round(distance * Config.COEFFICIENT) : 0;
    }
    /**
     * Update the distance meter.
     * @return Whether the achievement sound fx should be played.
     */
    update(deltaTime, distance) {
        let paint = true;
        let playSound = false;
        if (!this.achievement) {
            distance = this.getActualDistance(distance);
            // Score has gone beyond the initial digit count.
            if (distance > this.maxScore &&
                this.maxScoreUnits === Config.MAX_DISTANCE_UNITS) {
                this.maxScoreUnits++;
                this.maxScore = parseInt(this.maxScore + '9', 10);
            }
            if (distance > 0) {
                // Achievement unlocked.
                if (distance % Config.ACHIEVEMENT_DISTANCE === 0) {
                    // Flash score and play sound.
                    this.achievement = true;
                    this.flashTimer = 0;
                    playSound = true;
                }
                // Create a string representation of the distance with leading 0.
                const distanceStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
                this.digits = distanceStr.split('');
            }
            else {
                this.digits = this.defaultString.split('');
            }
        }
        else {
            // Control flashing of the score on reaching achievement.
            if (this.flashIterations <= Config.FLASH_ITERATIONS) {
                this.flashTimer += deltaTime;
                if (this.flashTimer < Config.FLASH_DURATION) {
                    paint = false;
                }
                else if (this.flashTimer > Config.FLASH_DURATION * 2) {
                    this.flashTimer = 0;
                    this.flashIterations++;
                }
            }
            else {
                this.achievement = false;
                this.flashIterations = 0;
                this.flashTimer = 0;
            }
        }
        // Draw the digits if not flashing.
        if (paint) {
            for (let i = this.digits.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.digits[i], 10));
            }
        }
        this.drawHighScore();
        return playSound;
    }
    /**
     * Draw the high score.
     */
    drawHighScore() {
        if (this.highScore.length > 0) {
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = .8;
            for (let i = this.highScore.length - 1; i >= 0; i--) {
                const characterToDraw = this.highScore[i];
                // Position of characterToDraw in sprite sheet, digits 0-9 are mapped
                // directly.
                let characterSpritePosition = parseInt(characterToDraw, 10);
                // If characterToDraw is not a digit then they must be part of the label
                // "HI". The position of these characters in the sheet is: H - 10, I
                // - 11.
                if (isNaN(characterSpritePosition)) {
                    switch (characterToDraw) {
                        case 'H':
                            characterSpritePosition = 10;
                            break;
                        case 'I':
                            characterSpritePosition = 11;
                            break;
                        // Any other character is ignored.
                        default:
                            continue;
                    }
                }
                this.draw(i, characterSpritePosition, true);
            }
            this.canvasCtx.restore();
        }
    }
    /**
     * Set the highscore as a string.
     * @param distance Distance ran in pixels.
     */
    setHighScore(distance) {
        distance = this.getActualDistance(distance);
        const highScoreStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
        this.highScore = 'HI ' + highScoreStr;
    }
    /**
     * Whether a clicked is in the high score area.
     * @return Whether the click was in the high score bounds.
     */
    hasClickedOnHighScore(e) {
        let x = 0;
        let y = 0;
        if (e instanceof TouchEvent) {
            // Bounds for touch differ from pointer.
            const canvasBounds = this.canvas.getBoundingClientRect();
            x = e.touches[0].clientX - canvasBounds.left;
            y = e.touches[0].clientY - canvasBounds.top;
        }
        else if (e instanceof MouseEvent) {
            x = e.offsetX;
            y = e.offsetY;
        }
        this.highScoreBounds = this.getHighScoreBounds();
        return x >= this.highScoreBounds.x &&
            x <= this.highScoreBounds.x + this.highScoreBounds.width &&
            y >= this.highScoreBounds.y &&
            y <= this.highScoreBounds.y + this.highScoreBounds.height;
    }
    /**
     * Get the bounding box for the high score.
     */
    getHighScoreBounds() {
        return {
            x: (this.x - (this.maxScoreUnits * 2) * Dimensions.WIDTH) -
                Config.HIGH_SCORE_HIT_AREA_PADDING,
            y: this.y,
            width: Dimensions.WIDTH * (this.highScore.length + 1) +
                Config.HIGH_SCORE_HIT_AREA_PADDING,
            height: Dimensions.HEIGHT + (Config.HIGH_SCORE_HIT_AREA_PADDING * 2),
        };
    }
    /**
     * Animate flashing the high score to indicate ready for resetting.
     * The flashing stops following distanceMeterConfig.FLASH_ITERATIONS x 2
     * flashes.
     */
    flashHighScore() {
        const now = (0, utils_js_1.getTimeStamp)();
        const deltaTime = now - (this.frameTimeStamp || now);
        let paint = true;
        this.frameTimeStamp = now;
        // Reached the max number of flashes.
        if (this.flashIterations > Config.FLASH_ITERATIONS * 2) {
            this.cancelHighScoreFlashing();
            return;
        }
        this.flashTimer += deltaTime;
        if (this.flashTimer < Config.FLASH_DURATION) {
            paint = false;
        }
        else if (this.flashTimer > Config.FLASH_DURATION * 2) {
            this.flashTimer = 0;
            this.flashIterations++;
        }
        if (paint) {
            this.drawHighScore();
        }
        else {
            this.clearHighScoreBounds();
        }
        // Frame update.
        this.flashingRafId = requestAnimationFrame(this.flashHighScore.bind(this));
    }
    /**
     * Draw empty rectangle over high score.
     */
    clearHighScoreBounds() {
        (0, shims_js_1.assert)(this.highScoreBounds);
        this.canvasCtx.save();
        this.canvasCtx.fillStyle = '#fff';
        this.canvasCtx.rect(this.highScoreBounds.x, this.highScoreBounds.y, this.highScoreBounds.width, this.highScoreBounds.height);
        this.canvasCtx.fill();
        this.canvasCtx.restore();
    }
    /**
     * Starts the flashing of the high score.
     */
    startHighScoreFlashing() {
        this.highScoreFlashing = true;
        this.flashHighScore();
    }
    /**
     * Whether high score is flashing.
     */
    isHighScoreFlashing() {
        return this.highScoreFlashing;
    }
    /**
     * Stop flashing the high score.
     */
    cancelHighScoreFlashing() {
        if (this.flashingRafId) {
            cancelAnimationFrame(this.flashingRafId);
        }
        this.flashIterations = 0;
        this.flashTimer = 0;
        this.highScoreFlashing = false;
        this.clearHighScoreBounds();
        this.drawHighScore();
    }
    /**
     * Clear the high score.
     */
    resetHighScore() {
        this.setHighScore(0);
        this.cancelHighScoreFlashing();
    }
    /**
     * Reset the distance meter back to '00000'.
     */
    reset() {
        this.update(0, 0);
        this.achievement = false;
    }
}
exports.DistanceMeter = DistanceMeter;

};
modules["game_config.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });

};
modules["game_over_panel.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameOverPanel = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const utils_js_1 = require("./utils.js");
const RESTART_ANIM_DURATION = 875;
const LOGO_PAUSE_DURATION = 875;
const FLASH_ITERATIONS = 5;
/**
 * Animation frames spec.
 */
const animConfig = {
    frames: [0, 36, 72, 108, 144, 180, 216, 252],
    msPerFrame: RESTART_ANIM_DURATION / 8,
};
/**
 * Dimensions used in the panel.
 */
const defaultPanelDimensions = {
    textX: 0,
    textY: 13,
    textWidth: 191,
    textHeight: 11,
    restartWidth: 36,
    restartHeight: 32,
};
class GameOverPanel {
    /**
     * Game over panel.
     */
    constructor(canvas, textImgPos, restartImgPos, dimensions, imageSpriteProvider, altGameEndImgPos, altGameActive) {
        this.frameTimeStamp = 0;
        this.animTimer = 0;
        this.currentFrame = 0;
        this.gameOverRafId = null;
        this.flashTimer = 0;
        this.flashCounter = 0;
        this.originalText = true;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.canvasDimensions = dimensions;
        this.textImgPos = textImgPos;
        this.restartImgPos = restartImgPos;
        this.imageSpriteProvider = imageSpriteProvider;
        this.altGameEndImgPos = altGameEndImgPos ?? null;
        this.altGameModeActive = altGameActive ?? false;
    }
    /**
     * Update the panel dimensions.
     * @param width New canvas width.
     * @param height Optional new canvas height.
     */
    updateDimensions(width, height) {
        this.canvasDimensions.width = width;
        if (height) {
            this.canvasDimensions.height = height;
        }
        this.currentFrame = animConfig.frames.length - 1;
    }
    drawGameOverText(dimensions, useAltText) {
        const centerX = this.canvasDimensions.width / 2;
        let textSourceX = dimensions.textX;
        let textSourceY = dimensions.textY;
        let textSourceWidth = dimensions.textWidth;
        let textSourceHeight = dimensions.textHeight;
        const textTargetX = Math.round(centerX - (dimensions.textWidth / 2));
        const textTargetY = Math.round((this.canvasDimensions.height - 25) / 3);
        const textTargetWidth = dimensions.textWidth;
        const textTargetHeight = dimensions.textHeight;
        if (constants_js_1.IS_HIDPI) {
            textSourceY *= 2;
            textSourceX *= 2;
            textSourceWidth *= 2;
            textSourceHeight *= 2;
        }
        if (!useAltText) {
            textSourceX += this.textImgPos.x;
            textSourceY += this.textImgPos.y;
        }
        const spriteSource = useAltText ?
            this.imageSpriteProvider.getAltCommonImageSprite() :
            this.imageSpriteProvider.getOrigImageSprite();
        (0, shims_js_1.assert)(spriteSource);
        this.canvasCtx.save();
        if (constants_js_1.IS_RTL) {
            this.canvasCtx.translate(this.canvasDimensions.width, 0);
            this.canvasCtx.scale(-1, 1);
        }
        // Game over text from sprite.
        this.canvasCtx.drawImage(spriteSource, textSourceX, textSourceY, textSourceWidth, textSourceHeight, textTargetX, textTargetY, textTargetWidth, textTargetHeight);
        this.canvasCtx.restore();
    }
    /**
     * Draw additional adornments for alternative game types.
     */
    drawAltGameElements(tRex) {
        const spriteDefinition = this.imageSpriteProvider.getSpriteDefinition();
        // Additional adornments.
        if (this.altGameModeActive && spriteDefinition) {
            (0, shims_js_1.assert)(this.altGameEndImgPos);
            const altGameEndConfig = spriteDefinition.altGameEndConfig;
            (0, shims_js_1.assert)(altGameEndConfig);
            let altGameEndSourceWidth = altGameEndConfig.width;
            let altGameEndSourceHeight = altGameEndConfig.height;
            const altGameEndTargetX = tRex.xPos + altGameEndConfig.xOffset;
            const altGameEndTargetY = tRex.yPos + altGameEndConfig.yOffset;
            if (constants_js_1.IS_HIDPI) {
                altGameEndSourceWidth *= 2;
                altGameEndSourceHeight *= 2;
            }
            const altCommonImageSprite = this.imageSpriteProvider.getAltCommonImageSprite();
            (0, shims_js_1.assert)(altCommonImageSprite);
            this.canvasCtx.drawImage(altCommonImageSprite, this.altGameEndImgPos.x, this.altGameEndImgPos.y, altGameEndSourceWidth, altGameEndSourceHeight, altGameEndTargetX, altGameEndTargetY, altGameEndConfig.width, altGameEndConfig.height);
        }
    }
    /**
     * Draw restart button.
     */
    drawRestartButton() {
        const dimensions = defaultPanelDimensions;
        let framePosX = animConfig.frames[this.currentFrame];
        let restartSourceWidth = dimensions.restartWidth;
        let restartSourceHeight = dimensions.restartHeight;
        const restartTargetX = (this.canvasDimensions.width / 2) - (dimensions.restartHeight / 2);
        const restartTargetY = this.canvasDimensions.height / 2;
        if (constants_js_1.IS_HIDPI) {
            restartSourceWidth *= 2;
            restartSourceHeight *= 2;
            framePosX *= 2;
        }
        this.canvasCtx.save();
        if (constants_js_1.IS_RTL) {
            this.canvasCtx.translate(this.canvasDimensions.width, 0);
            this.canvasCtx.scale(-1, 1);
        }
        const origImageSprite = this.imageSpriteProvider.getOrigImageSprite();
        this.canvasCtx.drawImage(origImageSprite, this.restartImgPos.x + framePosX, this.restartImgPos.y, restartSourceWidth, restartSourceHeight, restartTargetX, restartTargetY, dimensions.restartWidth, dimensions.restartHeight);
        this.canvasCtx.restore();
    }
    /**
     * Draw the panel.
     */
    draw(altGameModeActive, tRex) {
        if (altGameModeActive) {
            this.altGameModeActive = altGameModeActive;
        }
        this.drawGameOverText(defaultPanelDimensions, false);
        this.drawRestartButton();
        if (tRex) {
            this.drawAltGameElements(tRex);
        }
        this.update();
    }
    /**
     * Update animation frames.
     */
    update() {
        const now = (0, utils_js_1.getTimeStamp)();
        const deltaTime = now - (this.frameTimeStamp || now);
        this.frameTimeStamp = now;
        this.animTimer += deltaTime;
        this.flashTimer += deltaTime;
        // Restart Button
        if (this.currentFrame === 0 && this.animTimer > LOGO_PAUSE_DURATION) {
            this.animTimer = 0;
            this.currentFrame++;
            this.drawRestartButton();
        }
        else if (this.currentFrame > 0 && this.currentFrame < animConfig.frames.length) {
            if (this.animTimer >= animConfig.msPerFrame) {
                this.currentFrame++;
                this.drawRestartButton();
            }
        }
        else if (!this.altGameModeActive &&
            this.currentFrame === animConfig.frames.length) {
            this.reset();
            return;
        }
        // Game over text
        if (this.altGameModeActive &&
            offline_sprite_definitions_js_1.spriteDefinitionByType.original.altGameOverTextConfig) {
            const altTextConfig = offline_sprite_definitions_js_1.spriteDefinitionByType.original.altGameOverTextConfig;
            if (altTextConfig.flashing) {
                if (this.flashCounter < FLASH_ITERATIONS &&
                    this.flashTimer > altTextConfig.flashDuration) {
                    this.flashTimer = 0;
                    this.originalText = !this.originalText;
                    this.clearGameOverTextBounds();
                    if (this.originalText) {
                        this.drawGameOverText(defaultPanelDimensions, false);
                        this.flashCounter++;
                    }
                    else {
                        this.drawGameOverText(altTextConfig, true);
                    }
                }
                else if (this.flashCounter >= FLASH_ITERATIONS) {
                    this.reset();
                    return;
                }
            }
            else {
                this.clearGameOverTextBounds(altTextConfig);
                this.drawGameOverText(altTextConfig, true);
            }
        }
        this.gameOverRafId = requestAnimationFrame(this.update.bind(this));
    }
    /**
     * Clear game over text.
     * @param dimensions Game over text config.
     */
    clearGameOverTextBounds(dimensions = defaultPanelDimensions) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(Math.round(this.canvasDimensions.width / 2 - (dimensions.textWidth / 2)), Math.round((this.canvasDimensions.height - 25) / 3), dimensions.textWidth, dimensions.textHeight + 4);
        this.canvasCtx.restore();
    }
    reset() {
        if (this.gameOverRafId) {
            cancelAnimationFrame(this.gameOverRafId);
            this.gameOverRafId = null;
        }
        this.animTimer = 0;
        this.frameTimeStamp = 0;
        this.currentFrame = 0;
        this.flashTimer = 0;
        this.flashCounter = 0;
        this.originalText = true;
    }
}
exports.GameOverPanel = GameOverPanel;

};
modules["game_state_provider.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });

};
modules["generated_sound_fx.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedSoundFx = void 0;
const constants_js_1 = require("./constants.js");
/**
 * Generated sound FX class for audio cues.
 */
class GeneratedSoundFx {
    constructor() {
        this.panner = null;
        this.bgSoundIntervalId = null;
        this.context = new AudioContext();
        if (constants_js_1.IS_IOS) {
            this.context.onstatechange = () => {
                if (this.context.state !== 'running') {
                    this.context.resume();
                }
            };
            this.context.resume();
        }
        this.panner = this.context.createStereoPanner ?
            this.context.createStereoPanner() :
            null;
    }
    stopAll() {
        this.cancelFootSteps();
    }
    /**
     * Play oscillators at certain frequency and for a certain time.
     */
    playNote(frequency, startTime, duration, vol = 0.01, pan = 0) {
        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const volume = this.context.createGain();
        // Set oscillator wave type
        osc1.type = 'triangle';
        osc2.type = 'triangle';
        volume.gain.value = 0.1;
        // Set up node routing
        if (this.panner) {
            this.panner.pan.value = pan;
            osc1.connect(volume).connect(this.panner);
            osc2.connect(volume).connect(this.panner);
            this.panner.connect(this.context.destination);
        }
        else {
            osc1.connect(volume);
            osc2.connect(volume);
            volume.connect(this.context.destination);
        }
        // Detune oscillators for chorus effect
        osc1.frequency.value = frequency + 1;
        osc2.frequency.value = frequency - 2;
        // Fade out
        volume.gain.setValueAtTime(vol, startTime + duration - 0.05);
        volume.gain.linearRampToValueAtTime(0.00001, startTime + duration);
        // Start oscillators
        osc1.start(startTime);
        osc2.start(startTime);
        // Stop oscillators
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
    }
    background() {
        const now = this.context.currentTime;
        this.playNote(493.883, now, 0.116);
        this.playNote(659.255, now + 0.116, 0.232);
        this.loopFootSteps();
    }
    loopFootSteps() {
        if (!this.bgSoundIntervalId) {
            this.bgSoundIntervalId = setInterval(() => {
                this.playNote(73.42, this.context.currentTime, 0.05, 0.16);
                this.playNote(69.30, this.context.currentTime + 0.116, 0.116, 0.16);
            }, 280);
        }
    }
    cancelFootSteps() {
        if (this.bgSoundIntervalId) {
            clearInterval(this.bgSoundIntervalId);
            this.bgSoundIntervalId = null;
            this.playNote(103.83, this.context.currentTime, 0.232, 0.02);
            this.playNote(116.54, this.context.currentTime + 0.116, 0.232, 0.02);
        }
    }
    collect() {
        this.cancelFootSteps();
        const now = this.context.currentTime;
        this.playNote(830.61, now, 0.116);
        this.playNote(1318.51, now + 0.116, 0.232);
    }
    jump() {
        const now = this.context.currentTime;
        this.playNote(659.25, now, 0.116, 0.3, -0.6);
        this.playNote(880, now + 0.116, 0.232, 0.3, -0.6);
    }
}
exports.GeneratedSoundFx = GeneratedSoundFx;

};
modules["horizon.js"]=function(require,exports,module){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Horizon = void 0;
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const shims_js_1 = require("./shims.js");
const background_el_js_1 = require("./background_el.js");
const cloud_js_1 = require("./cloud.js");
const horizon_line_js_1 = require("./horizon_line.js");
const night_mode_js_1 = require("./night_mode.js");
const obstacle_js_1 = require("./obstacle.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const utils_js_1 = require("./utils.js");
/**
 * Horizon background class.
 */
class Horizon {
    constructor(canvas, spritePos, dimensions, gapCoefficient, resourceProvider) {
        this.obstacles = [];
        this.config = horizonConfig;
        this.obstacleHistory = [];
        this.altGameModeActive = false;
        this.obstacleTypes = [];
        // Cloud
        this.clouds = [];
        // Background elements
        this.backgroundEls = [];
        this.lastEl = null;
        // Horizon
        this.horizonLines = [];
        this.canvas = canvas;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.dimensions = dimensions;
        this.gapCoefficient = gapCoefficient;
        this.resourceProvider = resourceProvider;
        this.cloudFrequency = this.config.CLOUD_FREQUENCY;
        this.spritePos = spritePos;
        this.cloudSpeed = this.config.BG_CLOUD_SPEED;
        // Initialise the horizon. Just add the line and a cloud. No obstacles.
        this.obstacleTypes = offline_sprite_definitions_js_1.spriteDefinitionByType.original.obstacles;
        this.addCloud();
        const runnerSpriteDefinition = this.resourceProvider.getSpriteDefinition();
        (0, shims_js_1.assert)(runnerSpriteDefinition);
        // Multiple Horizon lines
        for (let i = 0; i < runnerSpriteDefinition.lines.length; i++) {
            this.horizonLines.push(new horizon_line_js_1.HorizonLine(this.canvas, runnerSpriteDefinition.lines[i], this.resourceProvider));
        }
        this.nightMode = new night_mode_js_1.NightMode(this.canvas, this.spritePos.moon, this.dimensions.height, this.resourceProvider);
    }
    /**
     * Update obstacle definitions based on the speed of the game.
     */
    adjustObstacleSpeed() {
        for (let i = 0; i < this.obstacleTypes.length; i++) {
            if (this.resourceProvider.hasSlowdown) {
                this.obstacleTypes[i].multipleSpeed =
                    this.obstacleTypes[i].multipleSpeed / 2;
                this.obstacleTypes[i].minGap *= 1.5;
                this.obstacleTypes[i].minSpeed = this.obstacleTypes[i].minSpeed / 2;
                // Convert variable y position obstacles to fixed.
                const obstacleYpos = this.obstacleTypes[i].yPos;
                if (Array.isArray(obstacleYpos) && obstacleYpos.length > 1) {
                    this.obstacleTypes[i].yPos = obstacleYpos[0];
                }
            }
        }
    }
    /**
     * Update sprites to correspond to change in sprite sheet.
     */
    enableAltGameMode(spritePos) {
        const runnerSpriteDefinition = this.resourceProvider.getSpriteDefinition();
        (0, shims_js_1.assert)(runnerSpriteDefinition);
        // Clear existing horizon objects.
        this.clouds = [];
        this.backgroundEls = [];
        this.altGameModeActive = true;
        this.spritePos = spritePos;
        this.obstacleTypes = runnerSpriteDefinition.obstacles;
        this.adjustObstacleSpeed();
        (0, obstacle_js_1.setMaxGapCoefficient)(runnerSpriteDefinition.maxGapCoefficient);
        (0, obstacle_js_1.setMaxObstacleLength)(runnerSpriteDefinition.maxObstacleLength);
        (0, background_el_js_1.setGlobalConfig)(runnerSpriteDefinition.backgroundElConfig);
        this.horizonLines = [];
        for (let i = 0; i < runnerSpriteDefinition.lines.length; i++) {
            this.horizonLines.push(new horizon_line_js_1.HorizonLine(this.canvas, runnerSpriteDefinition.lines[i], this.resourceProvider));
        }
        this.reset();
    }
    /**
     * @param updateObstacles Used as an override to prevent
     *     the obstacles from being updated / added. This happens in the
     *     ease in section.
     * @param showNightMode Night mode activated.
     */
    update(deltaTime, currentSpeed, updateObstacles, showNightMode) {
        const runnerSpriteDefinition = this.resourceProvider.getSpriteDefinition();
        (0, shims_js_1.assert)(runnerSpriteDefinition);
        if (this.altGameModeActive) {
            this.updateBackgroundEls(deltaTime);
        }
        for (const line of this.horizonLines) {
            line.update(deltaTime, currentSpeed);
        }
        if (!this.altGameModeActive || runnerSpriteDefinition.hasClouds) {
            this.nightMode.update(showNightMode);
            this.updateClouds(deltaTime, currentSpeed);
        }
        if (updateObstacles) {
            this.updateObstacles(deltaTime, currentSpeed);
        }
    }
    /**
     * Update background element positions. Also handles creating new elements.
     */
    updateBackgroundEl(elSpeed, bgElArray, maxBgEl, bgElAddFunction, frequency) {
        const numElements = bgElArray.length;
        if (!numElements) {
            bgElAddFunction();
            return;
        }
        for (let i = numElements - 1; i >= 0; i--) {
            bgElArray[i].update(elSpeed);
        }
        const lastEl = bgElArray.at(-1);
        // Check for adding a new element.
        if (numElements < maxBgEl &&
            (this.dimensions.width - lastEl.xPos) > lastEl.gap &&
            frequency > Math.random()) {
            bgElAddFunction();
        }
    }
    /**
     * Update the cloud positions.
     */
    updateClouds(deltaTime, speed) {
        const elSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
        this.updateBackgroundEl(elSpeed, this.clouds, this.config.MAX_CLOUDS, this.addCloud.bind(this), this.cloudFrequency);
        // Remove expired elements.
        this.clouds = this.clouds.filter(obj => !obj.remove);
    }
    /**
     * Update the background element positions.
     */
    updateBackgroundEls(deltaTime) {
        this.updateBackgroundEl(deltaTime, this.backgroundEls, (0, background_el_js_1.getGlobalConfig)().maxBgEls, this.addBackgroundEl.bind(this), this.cloudFrequency);
        // Remove expired elements.
        this.backgroundEls = this.backgroundEls.filter(obj => !obj.remove);
    }
    /**
     * Update the obstacle positions.
     */
    updateObstacles(deltaTime, currentSpeed) {
        const updatedObstacles = this.obstacles.slice(0);
        for (const obstacle of this.obstacles) {
            obstacle.update(deltaTime, currentSpeed);
            // Clean up existing obstacles.
            if (obstacle.remove) {
                updatedObstacles.shift();
            }
        }
        this.obstacles = updatedObstacles;
        if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles.at(-1);
            if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                lastObstacle.isVisible() &&
                (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                    this.dimensions.width) {
                this.addNewObstacle(currentSpeed);
                lastObstacle.followingObstacleCreated = true;
            }
        }
        else {
            // Create new obstacles.
            this.addNewObstacle(currentSpeed);
        }
    }
    removeFirstObstacle() {
        this.obstacles.shift();
    }
    /**
     * Add a new obstacle.
     */
    addNewObstacle(currentSpeed) {
        const obstacleCount = this.obstacleTypes[this.obstacleTypes.length - 1].type !==
            'collectable' ||
            (this.resourceProvider.isAltGameModeEnabled() &&
                !this.altGameModeActive ||
                this.altGameModeActive) ?
            this.obstacleTypes.length - 1 :
            this.obstacleTypes.length - 2;
        const obstacleTypeIndex = obstacleCount > 0 ? (0, utils_js_1.getRandomNum)(0, obstacleCount) : 0;
        const obstacleType = this.obstacleTypes[obstacleTypeIndex];
        // Check for multiples of the same type of obstacle.
        // Also check obstacle is available at current speed.
        if ((obstacleCount > 0 && this.duplicateObstacleCheck(obstacleType.type)) ||
            currentSpeed < obstacleType.minSpeed) {
            this.addNewObstacle(currentSpeed);
        }
        else {
            const obstacleSpritePos = this.spritePos[obstacleType.type];
            this.obstacles.push(new obstacle_js_1.Obstacle(this.canvasCtx, obstacleType, obstacleSpritePos, this.dimensions, this.gapCoefficient, currentSpeed, obstacleType.width, this.resourceProvider, this.altGameModeActive));
            this.obstacleHistory.unshift(obstacleType.type);
            if (this.obstacleHistory.length > 1) {
                const maxObstacleDuplicationValue = this.resourceProvider.getConfig().maxObstacleDuplication;
                (0, shims_js_1.assert)(maxObstacleDuplicationValue);
                this.obstacleHistory.splice(maxObstacleDuplicationValue);
            }
        }
    }
    /**
     * Returns whether the previous two obstacles are the same as the next one.
     * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
     */
    duplicateObstacleCheck(nextObstacleType) {
        let duplicateCount = 0;
        for (const obstacle of this.obstacleHistory) {
            duplicateCount = obstacle === nextObstacleType ? duplicateCount + 1 : 0;
        }
        const maxObstacleDuplicationValue = this.resourceProvider.getConfig().maxObstacleDuplication;
        (0, shims_js_1.assert)(maxObstacleDuplicationValue);
        return duplicateCount >= maxObstacleDuplicationValue;
    }
    /**
     * Reset the horizon layer.
     * Remove existing obstacles and reposition the horizon line.
     */
    reset() {
        this.obstacles = [];
        for (let l = 0; l < this.horizonLines.length; l++) {
            this.horizonLines[l].reset();
        }
        this.nightMode.reset();
    }
    /**
     * Update the canvas width and scaling.
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    /**
     * Add a new cloud to the horizon.
     */
    addCloud() {
        this.clouds.push(new cloud_js_1.Cloud(this.canvas, this.spritePos.cloud, this.dimensions.width, this.resourceProvider));
    }
    /**
     * Add a random background element to the horizon.
     */
    addBackgroundEl() {
        const runnerSpriteDefinition = this.resourceProvider.getSpriteDefinition();
        (0, shims_js_1.assert)(runnerSpriteDefinition);
        const backgroundElTypes = Object.keys(runnerSpriteDefinition.backgroundEl);
        if (backgroundElTypes.length > 0) {
            let index = (0, utils_js_1.getRandomNum)(0, backgroundElTypes.length - 1);
            let type = backgroundElTypes[index];
            // Add variation if available.
            while (type === this.lastEl && backgroundElTypes.length > 1) {
                index = (0, utils_js_1.getRandomNum)(0, backgroundElTypes.length - 1);
                type = backgroundElTypes[index];
            }
            this.lastEl = type;
            this.backgroundEls.push(new background_el_js_1.BackgroundEl(this.canvas, this.spritePos.backgroundEl, this.dimensions.width, type, this.resourceProvider));
        }
    }
}
exports.Horizon = Horizon;
/**
 * Horizon config.
 */
const horizonConfig = {
    BG_CLOUD_SPEED: 0.2,
    BUMPY_THRESHOLD: .3,
    CLOUD_FREQUENCY: .5,
    HORIZON_HEIGHT: 16,
    MAX_CLOUDS: 6,
};

};
modules["horizon_line.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorizonLine = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
class HorizonLine {
    /**
     * Horizon Line.
     * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
     */
    constructor(canvas, lineConfig, imageSpriteProvider) {
        this.yPos = 0;
        this.bumpThreshold = 0.5;
        let sourceX = lineConfig.sourceX;
        let sourceY = lineConfig.sourceY;
        if (constants_js_1.IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
        }
        this.spritePos = { x: sourceX, y: sourceY };
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.dimensions = { width: lineConfig.width, height: lineConfig.height };
        this.imageSpriteProvider = imageSpriteProvider;
        this.sourceXPos =
            [this.spritePos.x, this.spritePos.x + this.dimensions.width];
        this.xPos = [0, this.dimensions.width];
        this.yPos = lineConfig.yPos;
        this.sourceDimensions = {
            height: lineConfig.height,
            width: lineConfig.width,
        };
        if (constants_js_1.IS_HIDPI) {
            this.sourceDimensions.width = lineConfig.width * 2;
            this.sourceDimensions.height = lineConfig.height * 2;
        }
        this.draw();
    }
    /**
     * Return the crop x position of a type.
     */
    getRandomType() {
        return Math.random() > this.bumpThreshold ? this.dimensions.width : 0;
    }
    /**
     * Draw the horizon line.
     */
    draw() {
        const runnerImageSprite = this.imageSpriteProvider.getRunnerImageSprite();
        (0, shims_js_1.assert)(runnerImageSprite);
        this.canvasCtx.drawImage(runnerImageSprite, this.sourceXPos[0], this.spritePos.y, this.sourceDimensions.width, this.sourceDimensions.height, this.xPos[0], this.yPos, this.dimensions.width, this.dimensions.height);
        this.canvasCtx.drawImage(runnerImageSprite, this.sourceXPos[1], this.spritePos.y, this.sourceDimensions.width, this.sourceDimensions.height, this.xPos[1], this.yPos, this.dimensions.width, this.dimensions.height);
    }
    /**
     * Update the x position of an individual piece of the line.
     */
    updatexPos(pos, increment) {
        const line1 = pos;
        const line2 = pos === 0 ? 1 : 0;
        this.xPos[line1] -= increment;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.width;
        if (this.xPos[line1] <= -this.dimensions.width) {
            this.xPos[line1] += this.dimensions.width * 2;
            this.xPos[line2] = this.xPos[line1] - this.dimensions.width;
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
    }
    /**
     * Update the horizon line.
     */
    update(deltaTime, speed) {
        const increment = Math.floor(speed * (constants_js_1.FPS / 1000) * deltaTime);
        this.updatexPos(this.xPos[0] <= 0 ? 0 : 1, increment);
        this.draw();
    }
    /**
     * Reset horizon to the starting position.
     */
    reset() {
        this.xPos[0] = 0;
        this.xPos[1] = this.dimensions.width;
    }
}
exports.HorizonLine = HorizonLine;

};
modules["image_sprite_provider.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });

};
modules["night_mode.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.NightMode = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const utils_js_1 = require("./utils.js");
const PHASES = [140, 120, 100, 60, 40, 20, 0];
var Config;
(function (Config) {
    Config[Config["FADE_SPEED"] = 0.035] = "FADE_SPEED";
    Config[Config["HEIGHT"] = 40] = "HEIGHT";
    Config[Config["MOON_SPEED"] = 0.25] = "MOON_SPEED";
    Config[Config["NUM_STARS"] = 2] = "NUM_STARS";
    Config[Config["STAR_SIZE"] = 9] = "STAR_SIZE";
    Config[Config["STAR_SPEED"] = 0.3] = "STAR_SPEED";
    Config[Config["STAR_MAX_Y"] = 70] = "STAR_MAX_Y";
    Config[Config["WIDTH"] = 20] = "WIDTH";
})(Config || (Config = {}));
class NightMode {
    /**
     * Nightmode shows a moon and stars on the horizon.
     */
    constructor(canvas, spritePos, containerWidth, imageSpriteProvider) {
        this.xPos = 0;
        this.yPos = 30;
        this.currentPhase = 0;
        this.opacity = 0;
        this.stars = new Array(Config.NUM_STARS);
        this.drawStars = false;
        this.spritePos = spritePos;
        this.imageSpriteProvider = imageSpriteProvider;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.containerWidth = containerWidth;
        this.placeStars();
    }
    /**
     * Update moving moon, changing phases.
     */
    update(activated) {
        // Moon phase.
        if (activated && this.opacity === 0) {
            this.currentPhase++;
            if (this.currentPhase >= PHASES.length) {
                this.currentPhase = 0;
            }
        }
        // Fade in / out.
        if (activated && (this.opacity < 1 || this.opacity === 0)) {
            this.opacity += Config.FADE_SPEED;
        }
        else if (this.opacity > 0) {
            this.opacity -= Config.FADE_SPEED;
        }
        // Set moon positioning.
        if (this.opacity > 0) {
            this.xPos = this.updateXpos(this.xPos, Config.MOON_SPEED);
            // Update stars.
            if (this.drawStars) {
                for (let i = 0; i < Config.NUM_STARS; i++) {
                    const star = this.stars[i];
                    (0, shims_js_1.assert)(star);
                    star.x = this.updateXpos(star.x, Config.STAR_SPEED);
                }
            }
            this.draw();
        }
        else {
            this.opacity = 0;
            this.placeStars();
        }
        this.drawStars = true;
    }
    updateXpos(currentPos, speed) {
        if (currentPos < -Config.WIDTH) {
            currentPos = this.containerWidth;
        }
        else {
            currentPos -= speed;
        }
        return currentPos;
    }
    draw() {
        let moonSourceWidth = this.currentPhase === 3 ? Config.WIDTH * 2 : Config.WIDTH;
        let moonSourceHeight = Config.HEIGHT;
        const currentPhaseSpritePosition = PHASES[this.currentPhase];
        (0, shims_js_1.assert)(currentPhaseSpritePosition !== undefined);
        let moonSourceX = this.spritePos.x + currentPhaseSpritePosition;
        const moonOutputWidth = moonSourceWidth;
        let starSize = Config.STAR_SIZE;
        let starSourceX = offline_sprite_definitions_js_1.spriteDefinitionByType.original.ldpi.star.x;
        const runnerOrigImageSprite = this.imageSpriteProvider.getOrigImageSprite();
        (0, shims_js_1.assert)(runnerOrigImageSprite);
        if (constants_js_1.IS_HIDPI) {
            moonSourceWidth *= 2;
            moonSourceHeight *= 2;
            moonSourceX = this.spritePos.x + (currentPhaseSpritePosition * 2);
            starSize *= 2;
            starSourceX = offline_sprite_definitions_js_1.spriteDefinitionByType.original.hdpi.star.x;
        }
        this.canvasCtx.save();
        this.canvasCtx.globalAlpha = this.opacity;
        // Stars.
        if (this.drawStars) {
            for (const star of this.stars) {
                this.canvasCtx.drawImage(runnerOrigImageSprite, starSourceX, star.sourceY, starSize, starSize, Math.round(star.x), star.y, Config.STAR_SIZE, Config.STAR_SIZE);
            }
        }
        // Moon.
        this.canvasCtx.drawImage(runnerOrigImageSprite, moonSourceX, this.spritePos.y, moonSourceWidth, moonSourceHeight, Math.round(this.xPos), this.yPos, moonOutputWidth, Config.HEIGHT);
        this.canvasCtx.globalAlpha = 1;
        this.canvasCtx.restore();
    }
    // Do star placement.
    placeStars() {
        const segmentSize = Math.round(this.containerWidth / Config.NUM_STARS);
        for (let i = 0; i < Config.NUM_STARS; i++) {
            const starPosition = {
                x: (0, utils_js_1.getRandomNum)(segmentSize * i, segmentSize * (i + 1)),
                y: (0, utils_js_1.getRandomNum)(0, Config.STAR_MAX_Y),
                sourceY: 0,
            };
            if (constants_js_1.IS_HIDPI) {
                starPosition.sourceY = offline_sprite_definitions_js_1.spriteDefinitionByType.original.hdpi.star.y +
                    Config.STAR_SIZE * 2 * i;
            }
            else {
                starPosition.sourceY =
                    offline_sprite_definitions_js_1.spriteDefinitionByType.original.ldpi.star.y + Config.STAR_SIZE * i;
            }
            this.stars[i] = starPosition;
        }
    }
    reset() {
        this.currentPhase = 0;
        this.opacity = 0;
        this.update(false);
    }
}
exports.NightMode = NightMode;

};
modules["obstacle.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Obstacle = void 0;
exports.setMaxGapCoefficient = setMaxGapCoefficient;
exports.setMaxObstacleLength = setMaxObstacleLength;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const utils_js_1 = require("./utils.js");
/**
 * Coefficient for calculating the maximum gap.
 */
let maxGapCoefficient = 1.5;
/**
 * Maximum obstacle grouping count.
 */
let maxObstacleLength = 3;
function setMaxGapCoefficient(coefficient) {
    maxGapCoefficient = coefficient;
}
function setMaxObstacleLength(length) {
    maxObstacleLength = length;
}
class Obstacle {
    /**
     * Obstacle.
     */
    constructor(canvasCtx, type, spriteImgPos, dimensions, gapCoefficient, speed, xOffset = 0, resourceProvider, isAltGameMode = false) {
        this.collisionBoxes = [];
        this.followingObstacleCreated = false;
        this.gap = 0;
        this.jumpAlerted = false;
        this.remove = false;
        this.width = 0;
        this.yPos = 0;
        this.speedOffset = 0;
        // For animated obstacles.
        this.currentFrame = 0;
        this.timer = 0;
        this.canvasCtx = canvasCtx;
        this.spritePos = spriteImgPos;
        this.typeConfig = type;
        this.resourceProvider = resourceProvider;
        this.gapCoefficient =
            this.resourceProvider.hasSlowdown ? gapCoefficient * 2 : gapCoefficient;
        this.size = (0, utils_js_1.getRandomNum)(1, maxObstacleLength);
        this.xPos = dimensions.width + xOffset;
        this.altGameModeActive = isAltGameMode;
        const imageSprite = this.typeConfig.type === 'collectable' ?
            this.resourceProvider.getAltCommonImageSprite() :
            this.altGameModeActive ?
                this.resourceProvider.getRunnerAltGameImageSprite() :
                this.resourceProvider.getRunnerImageSprite();
        (0, shims_js_1.assert)(imageSprite);
        this.imageSprite = imageSprite;
        this.init(speed);
    }
    /**
     * Initialise the DOM for the obstacle.
     */
    init(speed) {
        this.cloneCollisionBoxes();
        // Only allow sizing if we're at the right speed.
        if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
            this.size = 1;
        }
        this.width = this.typeConfig.width * this.size;
        // Check if obstacle can be positioned at various heights.
        if (Array.isArray(this.typeConfig.yPos)) {
            (0, shims_js_1.assert)(Array.isArray(this.typeConfig.yPosMobile));
            const yPosConfig = constants_js_1.IS_MOBILE ? this.typeConfig.yPosMobile : this.typeConfig.yPos;
            const randomYPos = yPosConfig[(0, utils_js_1.getRandomNum)(0, yPosConfig.length - 1)];
            (0, shims_js_1.assert)(randomYPos);
            this.yPos = randomYPos;
        }
        else {
            this.yPos = this.typeConfig.yPos;
        }
        this.draw();
        // Make collision box adjustments,
        // Central box is adjusted to the size as one box.
        //      ____        ______        ________
        //    _|   |-|    _|     |-|    _|       |-|
        //   | |<->| |   | |<--->| |   | |<----->| |
        //   | | 1 | |   | |  2  | |   | |   3   | |
        //   |_|___|_|   |_|_____|_|   |_|_______|_|
        //
        if (this.size > 1) {
            (0, shims_js_1.assert)(this.collisionBoxes.length >= 3);
            this.collisionBoxes[1].width = this.width -
                this.collisionBoxes[0].width - this.collisionBoxes[2].width;
            this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
        }
        // For obstacles that go at a different speed from the horizon.
        if (this.typeConfig.speedOffset) {
            this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset :
                -this.typeConfig.speedOffset;
        }
        this.gap = this.getGap(this.gapCoefficient, speed);
        // Increase gap for audio cues enabled.
        if (this.resourceProvider.hasAudioCues) {
            this.gap *= 2;
        }
    }
    /**
     * Draw and crop based on size.
     */
    draw() {
        let sourceWidth = this.typeConfig.width;
        let sourceHeight = this.typeConfig.height;
        if (constants_js_1.IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        // X position in sprite.
        let sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) + this.spritePos.x;
        // Animation frames.
        if (this.currentFrame > 0) {
            sourceX += sourceWidth * this.currentFrame;
        }
        this.canvasCtx.drawImage(this.imageSprite, sourceX, this.spritePos.y, sourceWidth * this.size, sourceHeight, this.xPos, this.yPos, this.typeConfig.width * this.size, this.typeConfig.height);
    }
    /**
     * Obstacle frame update.
     */
    update(deltaTime, speed) {
        if (!this.remove) {
            if (this.typeConfig.speedOffset) {
                speed += this.speedOffset;
            }
            this.xPos -= Math.floor((speed * constants_js_1.FPS / 1000) * deltaTime);
            // Update frame
            if (this.typeConfig.numFrames) {
                (0, shims_js_1.assert)(this.typeConfig.frameRate);
                this.timer += deltaTime;
                if (this.timer >= this.typeConfig.frameRate) {
                    this.currentFrame =
                        this.currentFrame === this.typeConfig.numFrames - 1 ?
                            0 :
                            this.currentFrame + 1;
                    this.timer = 0;
                }
            }
            this.draw();
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }
    /**
     * Calculate a random gap size.
     * - Minimum gap gets wider as speed increases
     */
    getGap(gapCoefficient, speed) {
        const minGap = Math.round(this.width * speed + this.typeConfig.minGap * gapCoefficient);
        const maxGap = Math.round(minGap * maxGapCoefficient);
        return (0, utils_js_1.getRandomNum)(minGap, maxGap);
    }
    /**
     * Check if obstacle is visible.
     */
    isVisible() {
        return this.xPos + this.width > 0;
    }
    /**
     * Make a copy of the collision boxes, since these will change based on
     * obstacle type and size.
     */
    cloneCollisionBoxes() {
        const collisionBoxes = this.typeConfig.collisionBoxes;
        for (let i = collisionBoxes.length - 1; i >= 0; i--) {
            this.collisionBoxes[i] = new offline_sprite_definitions_js_1.CollisionBox(collisionBoxes[i].x, collisionBoxes[i].y, collisionBoxes[i].width, collisionBoxes[i].height);
        }
    }
}
exports.Obstacle = Obstacle;

};
modules["offline.js"]=function(require,exports,module){
"use strict";
// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const shims_js_1 = require("./shims.js");
const shims_js_2 = require("./shims.js");
const parent_constants_js_1 = require("./parent_constants.js");
const constants_js_1 = require("./constants.js");
const distance_meter_js_1 = require("./distance_meter.js");
const game_over_panel_js_1 = require("./game_over_panel.js");
const generated_sound_fx_js_1 = require("./generated_sound_fx.js");
const horizon_js_1 = require("./horizon.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const trex_js_1 = require("./trex.js");
const utils_js_1 = require("./utils.js");
var A11yStrings;
(function (A11yStrings) {
    A11yStrings["ARIA_LABEL"] = "dinoGameA11yAriaLabel";
    A11yStrings["DESCRIPTION"] = "dinoGameA11yDescription";
    A11yStrings["GAME_OVER"] = "dinoGameA11yGameOver";
    A11yStrings["HIGH_SCORE"] = "dinoGameA11yHighScore";
    A11yStrings["JUMP"] = "dinoGameA11yJump";
    A11yStrings["STARTED"] = "dinoGameA11yStartGame";
    A11yStrings["SPEED_LABEL"] = "dinoGameA11ySpeedToggle";
})(A11yStrings || (A11yStrings = {}));
const defaultBaseConfig = {
    audiocueProximityThreshold: 190,
    audiocueProximityThresholdMobileA11y: 250,
    bgCloudSpeed: 0.2,
    bottomPad: 10,
    // Scroll Y threshold at which the game can be activated.
    canvasInViewOffset: -10,
    clearTime: 3000,
    cloudFrequency: 0.5,
    fadeDuration: 1,
    flashDuration: 1000,
    gameoverClearTime: 1200,
    initialJumpVelocity: 12,
    invertFadeDuration: 12000,
    maxBlinkCount: 3,
    maxClouds: 6,
    maxObstacleLength: 3,
    maxObstacleDuplication: 2,
    resourceTemplateId: 'audio-resources',
    speed: 6,
    speedDropCoefficient: 3,
    arcadeModeInitialTopPosition: 35,
    arcadeModeTopPositionPercent: 0.1,
};
const normalModeConfig = {
    acceleration: 0.001,
    audiocueProximityThreshold: 190,
    audiocueProximityThresholdMobileA11y: 250,
    gapCoefficient: 0.6,
    invertDistance: 700,
    maxSpeed: 13,
    mobileSpeedCoefficient: 1.2,
    speed: 6,
};
const slowModeConfig = {
    acceleration: 0.0005,
    audiocueProximityThreshold: 170,
    audiocueProximityThresholdMobileA11y: 220,
    gapCoefficient: 0.3,
    invertDistance: 350,
    maxSpeed: 9,
    mobileSpeedCoefficient: 1.5,
    speed: 4.2,
};
/**
 * CSS class names.
 */
var RunnerClasses;
(function (RunnerClasses) {
    RunnerClasses["ARCADE_MODE"] = "arcade-mode";
    RunnerClasses["CANVAS"] = "runner-canvas";
    RunnerClasses["CONTAINER"] = "runner-container";
    RunnerClasses["CRASHED"] = "crashed";
    RunnerClasses["ICON"] = "icon-offline";
    RunnerClasses["ICON_DISABLED"] = "icon-disabled";
    RunnerClasses["INVERTED"] = "inverted";
    RunnerClasses["SNACKBAR"] = "snackbar";
    RunnerClasses["SNACKBAR_SHOW"] = "snackbar-show";
    RunnerClasses["TOUCH_CONTROLLER"] = "controller";
})(RunnerClasses || (RunnerClasses = {}));
/**
 * Sound FX. Reference to the ID of the audio tag on interstitial page.
 */
var RunnerSounds;
(function (RunnerSounds) {
    RunnerSounds["BUTTON_PRESS"] = "offline-sound-press";
    RunnerSounds["HIT"] = "offline-sound-hit";
    RunnerSounds["SCORE"] = "offline-sound-reached";
})(RunnerSounds || (RunnerSounds = {}));
/**
 * Key code mapping.
 */
const runnerKeycodes = {
    jump: [38, 32], // Up, spacebar
    duck: [40], // Down
    restart: [13], // Enter
};
var RunnerEvents;
(function (RunnerEvents) {
    RunnerEvents["ANIM_END"] = "webkitAnimationEnd";
    RunnerEvents["CLICK"] = "click";
    RunnerEvents["KEYDOWN"] = "keydown";
    RunnerEvents["KEYUP"] = "keyup";
    RunnerEvents["POINTERDOWN"] = "pointerdown";
    RunnerEvents["POINTERUP"] = "pointerup";
    RunnerEvents["RESIZE"] = "resize";
    RunnerEvents["TOUCHEND"] = "touchend";
    RunnerEvents["TOUCHSTART"] = "touchstart";
    RunnerEvents["VISIBILITY"] = "visibilitychange";
    RunnerEvents["BLUR"] = "blur";
    RunnerEvents["FOCUS"] = "focus";
    RunnerEvents["LOAD"] = "load";
    RunnerEvents["GAMEPADCONNECTED"] = "gamepadconnected";
})(RunnerEvents || (RunnerEvents = {}));
let runnerInstance = null;
const ARCADE_MODE_URL = 'chrome://dino/';
const RESOURCE_POSTFIX = 'offline-resources-';
/**
 * T-Rex runner.
 */
class Runner {
    // Initialize the singleton instance of Runner. Should only be called once.
    static initializeInstance(outerContainerId, config) {
        (0, shims_js_1.assert)(runnerInstance === null);
        runnerInstance = new Runner(outerContainerId, config);
        if (!runnerInstance.isDisabled) {
            runnerInstance.loadImages();
        }
        return runnerInstance;
    }
    static getInstance() {
        (0, shims_js_1.assert)(runnerInstance);
        return runnerInstance;
    }
    constructor(outerContainerId, configParam) {
        this.containerEl = null;
        // A div to intercept touch events. Only set while (playing && useTouch).
        this.touchController = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.a11yStatusEl = null;
        this.slowSpeedCheckboxLabel = null;
        this.slowSpeedCheckbox = null;
        this.slowSpeedToggleEl = null;
        this.origImageSprite = null;
        this.altCommonImageSprite = null;
        this.altGameImageSprite = null;
        this.imageSprite = null;
        // Logical dimensions of the container.
        this.dimensions = constants_js_1.DEFAULT_DIMENSIONS;
        this.gameType = null;
        this.spriteDefinition = offline_sprite_definitions_js_1.spriteDefinitionByType.original;
        this.spriteDef = null;
        // Alt game mode state.
        this.altGameModeActive = false;
        this.altGameModeFlashTimer = null;
        this.altGameAssetsFailedToLoad = false;
        this.fadeInTimer = 0;
        // UI components.
        this.tRex = null;
        this.distanceMeter = null;
        this.gameOverPanel = null;
        this.horizon = null;
        this.msPerFrame = 1000 / constants_js_1.FPS;
        this.time = 0;
        this.distanceRan = 0;
        this.runningTime = 0;
        this.raqId = 0;
        this.playCount = 0;
        // Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
        this.isDisabled = shims_js_2.loadTimeData.valueExists('disabledEasterEgg');
        // Whether the easter egg has been activated.
        this.activated = false;
        // Whether the game is currently in play state.
        this.playing = false;
        this.playingIntro = false;
        this.crashed = false;
        this.paused = false;
        this.inverted = false;
        this.isDarkMode = false;
        this.updatePending = false;
        this.hasSlowdownInternal = false;
        this.hasAudioCuesInternal = false;
        this.highestScore = 0;
        this.syncHighestScore = false;
        this.invertTimer = 0;
        this.invertTrigger = false;
        this.soundFx = {};
        this.audioContext = null;
        this.generatedSoundFx = null;
        // Gamepad state.
        this.pollingGamepads = false;
        this.previousGamepad = null;
        const outerContainerElement = document.querySelector(outerContainerId);
        (0, shims_js_1.assert)(outerContainerElement);
        this.outerContainerEl = outerContainerElement;
        this.config =
            configParam || Object.assign({}, defaultBaseConfig, normalModeConfig);
        this.currentSpeed = this.config.speed;
        if (this.isDisabled) {
            this.setupDisabledRunner();
            return;
        }
        if (this.isAltGameModeEnabled()) {
            this.initAltGameType();
        }
        window.initializeEasterEggHighScore = this.initializeHighScore.bind(this);
    }
    // GameStateProvider implementation.
    get hasSlowdown() {
        return this.hasSlowdownInternal;
    }
    // GameStateProvider implementation.
    get hasAudioCues() {
        return this.hasAudioCuesInternal;
    }
    /**
     * Whether an alternative game mode is enabled, returns true if the load time
     * data specifies it and its assets loaded successfully. Returns false
     * otherwise.
     * GameStateProvider implementation.
     */
    isAltGameModeEnabled() {
        if (this.altGameAssetsFailedToLoad) {
            return false;
        }
        return shims_js_2.loadTimeData.valueExists('enableAltGameMode');
    }
    // GeneratedSoundFxProvider implementation.
    getGeneratedSoundFx() {
        (0, shims_js_1.assert)(this.generatedSoundFx);
        return this.generatedSoundFx;
    }
    // ImageSpriteProvider implementation.
    getSpriteDefinition() {
        return this.spriteDefinition;
    }
    // ImageSpriteProvider implementation.
    getOrigImageSprite() {
        (0, shims_js_1.assert)(this.origImageSprite);
        return this.origImageSprite;
    }
    // ImageSpriteProvider implementation.
    getRunnerImageSprite() {
        (0, shims_js_1.assert)(this.imageSprite);
        return this.imageSprite;
    }
    // ImageSpriteProvider implementation.
    getRunnerAltGameImageSprite() {
        return this.altGameImageSprite;
    }
    // ImageSpriteProvider implementation.
    getAltCommonImageSprite() {
        return this.altCommonImageSprite;
    }
    // ConfigProvider implementation.
    getConfig() {
        return this.config;
    }
    /**
     * Initialize alternative game type.
     */
    initAltGameType() {
        (0, shims_js_1.assert)(shims_js_2.loadTimeData.valueExists('altGameType'));
        if (offline_sprite_definitions_js_1.GAME_TYPE.length > 0) {
            const parsedValue = Number.parseInt(shims_js_2.loadTimeData.getValue('altGameType'), 10);
            const type = offline_sprite_definitions_js_1.GAME_TYPE[parsedValue - 1];
            this.gameType = type || null;
        }
    }
    /**
     * For disabled instances, set up a snackbar with the disabled message.
     */
    setupDisabledRunner() {
        this.containerEl = document.createElement('div');
        this.containerEl.className = RunnerClasses.SNACKBAR;
        this.containerEl.textContent = shims_js_2.loadTimeData.getValue('disabledEasterEgg');
        this.outerContainerEl.appendChild(this.containerEl);
        // Show notification when the activation key is pressed.
        document.addEventListener(RunnerEvents.KEYDOWN, e => {
            if (runnerKeycodes.jump.includes(e.keyCode)) {
                (0, shims_js_1.assert)(this.containerEl);
                this.containerEl.classList.add(RunnerClasses.SNACKBAR_SHOW);
                const iconElement = document.querySelector('.icon');
                (0, shims_js_1.assert)(iconElement);
                iconElement.classList.add(RunnerClasses.ICON_DISABLED);
            }
        });
    }
    /**
     * Sets individual settings for debugging.
     */
    updateConfigSetting(setting, value) {
        this.config[setting] = value;
    }
    /**
     * Sets individual settings for debugging.
     */
    updateTrexConfigSetting(setting, value) {
        (0, shims_js_1.assert)(this.tRex);
        switch (setting) {
            case 'gravity':
            case 'minJumpHeight':
            case 'speedDropCoefficient':
                this.tRex.config[setting] = value;
                break;
            case 'initialJumpVelocity':
                this.tRex.setJumpVelocity(value);
                break;
            case 'speed':
                this.setSpeed(value);
                break;
            default:
                break;
        }
    }
    /**
     * Creates an on page image element from the base 64 encoded string source.
     * @param resourceName Name in data object,
     * @return The created element.
     */
    createImageElement(resourceName) {
        const imgSrc = shims_js_2.loadTimeData.valueExists(resourceName) ?
            shims_js_2.loadTimeData.getString(resourceName) :
            null;
        if (imgSrc) {
            const el = document.createElement('img');
            el.id = resourceName;
            el.src = imgSrc;
            const resourcesElement = document.getElementById('offline-resources');
            (0, shims_js_1.assert)(resourcesElement);
            resourcesElement.appendChild(el);
            return el;
        }
        return null;
    }
    /**
     * Cache the appropriate image sprite from the page and get the sprite sheet
     * definition.
     */
    loadImages() {
        let scale = '1x';
        this.spriteDef = this.getSpriteDefinition().ldpi;
        if (constants_js_1.IS_HIDPI) {
            scale = '2x';
            this.spriteDef = this.getSpriteDefinition().hdpi;
        }
        const imageSpriteElement = document.querySelector(`#${RESOURCE_POSTFIX + scale}`);
        (0, shims_js_1.assert)(imageSpriteElement);
        this.imageSprite = imageSpriteElement;
        if (this.gameType) {
            this.altGameImageSprite =
                (this.createImageElement('altGameSpecificImage' + scale));
            this.altCommonImageSprite =
                (this.createImageElement('altGameCommonImage' + scale));
        }
        this.origImageSprite = this.getRunnerImageSprite();
        // Disable the alt game mode if the sprites can't be loaded.
        if (!this.getRunnerAltGameImageSprite() === null ||
            this.getAltCommonImageSprite() === null) {
            this.altGameAssetsFailedToLoad = true;
            this.altGameModeActive = false;
        }
        if (this.getRunnerImageSprite().complete) {
            this.init();
        }
        else {
            // If the images are not yet loaded, add a listener.
            this.getRunnerImageSprite().addEventListener(RunnerEvents.LOAD, this.init.bind(this));
        }
    }
    /**
     * Load and decode base 64 encoded sounds.
     */
    loadSounds() {
        if (constants_js_1.IS_IOS) {
            return;
        }
        this.audioContext = new AudioContext();
        const resourceTemplateElement = document.querySelector(`#${this.config.resourceTemplateId}`);
        (0, shims_js_1.assert)(resourceTemplateElement);
        const resourceTemplate = resourceTemplateElement.content;
        for (const sound in RunnerSounds) {
            const audioElement = resourceTemplate.querySelector(`#${RunnerSounds[sound]}`);
            (0, shims_js_1.assert)(audioElement);
            let soundSrc = audioElement.src;
            soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
            const buffer = decodeBase64ToArrayBuffer(soundSrc);
            // Async, so no guarantee of order in array.
            this.audioContext.decodeAudioData(buffer, audioBuffer => {
                this.soundFx = {
                    ...this.soundFx,
                    [sound]: audioBuffer,
                };
            });
        }
    }
    /**
     * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
     */
    setSpeed(newSpeed) {
        const speed = newSpeed || this.currentSpeed;
        // Reduce the speed on smaller mobile screens.
        if (this.dimensions.width < constants_js_1.DEFAULT_DIMENSIONS.width) {
            const mobileSpeed = this.hasSlowdown ? speed :
                speed * this.dimensions.width /
                    constants_js_1.DEFAULT_DIMENSIONS.width * this.config.mobileSpeedCoefficient;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        }
        else if (newSpeed) {
            this.currentSpeed = newSpeed;
        }
    }
    /**
     * Game initialiser.
     */
    init() {
        (0, shims_js_1.assert)(this.spriteDef);
        const iconElement = document.querySelector('.' + RunnerClasses.ICON);
        (0, shims_js_1.assert)(iconElement);
        // Hide the static icon.
        iconElement.style.visibility = 'hidden';
        if (this.isArcadeMode()) {
            document.title =
                document.title + ' - ' + getA11yString(A11yStrings.ARIA_LABEL);
        }
        this.adjustDimensions();
        this.setSpeed();
        const ariaLabel = getA11yString(A11yStrings.ARIA_LABEL);
        this.containerEl = document.createElement('div');
        this.containerEl.setAttribute('role', constants_js_1.IS_MOBILE ? 'button' : 'application');
        this.containerEl.setAttribute('tabindex', '0');
        this.containerEl.setAttribute('title', getA11yString(A11yStrings.DESCRIPTION));
        this.containerEl.setAttribute('aria-label', ariaLabel);
        this.containerEl.className = RunnerClasses.CONTAINER;
        // Player canvas container.
        this.canvas = createCanvas(this.containerEl, this.dimensions.width, this.dimensions.height);
        // Live region for game status updates.
        this.a11yStatusEl = document.createElement('span');
        this.a11yStatusEl.className = 'offline-runner-live-region';
        this.a11yStatusEl.setAttribute('aria-live', 'assertive');
        this.a11yStatusEl.textContent = '';
        // Add checkbox to slow down the game.
        this.slowSpeedCheckboxLabel = document.createElement('label');
        this.slowSpeedCheckboxLabel.className = 'slow-speed-option hidden';
        this.slowSpeedCheckboxLabel.textContent =
            getA11yString(A11yStrings.SPEED_LABEL);
        this.slowSpeedCheckbox = document.createElement('input');
        this.slowSpeedCheckbox.setAttribute('type', 'checkbox');
        this.slowSpeedCheckbox.setAttribute('title', getA11yString(A11yStrings.SPEED_LABEL));
        this.slowSpeedCheckbox.setAttribute('tabindex', '0');
        this.slowSpeedCheckbox.setAttribute('checked', 'checked');
        this.slowSpeedToggleEl = document.createElement('span');
        this.slowSpeedToggleEl.className = 'slow-speed-toggle';
        this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedCheckbox);
        this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedToggleEl);
        if (constants_js_1.IS_IOS) {
            this.outerContainerEl.appendChild(this.a11yStatusEl);
        }
        else {
            this.containerEl.appendChild(this.a11yStatusEl);
        }
        const canvasContext = this.canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.canvasCtx.fillStyle = '#f7f7f7';
        this.canvasCtx.fill();
        updateCanvasScaling(this.canvas);
        // Horizon contains clouds, obstacles and the ground.
        this.horizon = new horizon_js_1.Horizon(this.canvas, this.spriteDef, this.dimensions, this.config.gapCoefficient, /* resourceProvider= */ this);
        // Distance meter
        this.distanceMeter = new distance_meter_js_1.DistanceMeter(this.canvas, this.spriteDef.textSprite, this.dimensions.width, 
        /* imageSpriteProvider= */ this);
        // Draw t-rex
        this.tRex = new trex_js_1.Trex(this.canvas, this.spriteDef.tRex, /* resourceProvider= */ this);
        this.outerContainerEl.appendChild(this.containerEl);
        this.outerContainerEl.appendChild(this.slowSpeedCheckboxLabel);
        this.startListening();
        this.update();
        window.addEventListener(RunnerEvents.RESIZE, this.debounceResize.bind(this));
        // Handle dark mode
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.isDarkMode = darkModeMediaQuery && darkModeMediaQuery.matches;
        darkModeMediaQuery.addListener((e) => {
            this.isDarkMode = e.matches;
        });
    }
    /**
     * Create the touch controller. A div that covers whole screen.
     */
    createTouchController() {
        this.touchController = document.createElement('div');
        this.touchController.className = RunnerClasses.TOUCH_CONTROLLER;
        this.touchController.addEventListener(RunnerEvents.TOUCHSTART, this);
        this.touchController.addEventListener(RunnerEvents.TOUCHEND, this);
        this.outerContainerEl.appendChild(this.touchController);
    }
    /**
     * Debounce the resize event.
     */
    debounceResize() {
        if (this.resizeTimerId === undefined) {
            this.resizeTimerId = setInterval(this.adjustDimensions.bind(this), 250);
        }
    }
    /**
     * Adjust game space dimensions on resize.
     */
    adjustDimensions() {
        clearInterval(this.resizeTimerId);
        this.resizeTimerId = undefined;
        const boxStyles = window.getComputedStyle(this.outerContainerEl);
        const padding = Number(boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2));
        this.dimensions.width = this.outerContainerEl.offsetWidth - padding * 2;
        if (this.isArcadeMode()) {
            this.dimensions.width =
                Math.min(constants_js_1.DEFAULT_DIMENSIONS.width, this.dimensions.width);
            if (this.activated) {
                this.setArcadeModeContainerScale();
            }
        }
        // Redraw the elements back onto the canvas.
        if (this.canvas) {
            (0, shims_js_1.assert)(this.distanceMeter);
            (0, shims_js_1.assert)(this.horizon);
            (0, shims_js_1.assert)(this.tRex);
            (0, shims_js_1.assert)(this.containerEl);
            this.canvas.width = this.dimensions.width;
            this.canvas.height = this.dimensions.height;
            updateCanvasScaling(this.canvas);
            this.distanceMeter.calcXpos(this.dimensions.width);
            this.clearCanvas();
            this.horizon.update(0, 0, true, /*showNightMode = */ false);
            this.tRex.update(0);
            // Outer container and distance meter.
            if (this.playing || this.crashed || this.paused) {
                this.containerEl.style.width = this.dimensions.width + 'px';
                this.containerEl.style.height = this.dimensions.height + 'px';
                this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                this.stop();
            }
            else {
                this.tRex.draw(0, 0);
            }
            // Game over panel.
            if (this.crashed && this.gameOverPanel) {
                this.gameOverPanel.updateDimensions(this.dimensions.width);
                this.gameOverPanel.draw(this.altGameModeActive, this.tRex);
            }
        }
    }
    /**
     * Play the game intro.
     * Canvas container width expands out to the full width.
     */
    playIntro() {
        if (!this.activated && !this.crashed) {
            (0, shims_js_1.assert)(this.tRex);
            (0, shims_js_1.assert)(this.containerEl);
            this.playingIntro = true;
            this.tRex.playingIntro = true;
            // CSS animation definition.
            const keyframes = '@-webkit-keyframes intro { ' +
                'from { width:' + this.tRex.config.width + 'px }' +
                'to { width: ' + this.dimensions.width + 'px }' +
                '}';
            const styleSheet = document.styleSheets[0];
            (0, shims_js_1.assert)(styleSheet);
            styleSheet.insertRule(keyframes, 0);
            this.containerEl.addEventListener(RunnerEvents.ANIM_END, this.startGame.bind(this));
            this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
            this.containerEl.style.width = this.dimensions.width + 'px';
            this.setPlayStatus(true);
            this.activated = true;
        }
        else if (this.crashed) {
            this.restart();
        }
    }
    /**
     * Update the game status to started.
     */
    startGame() {
        (0, shims_js_1.assert)(this.containerEl);
        (0, shims_js_1.assert)(this.tRex);
        if (this.isArcadeMode()) {
            this.setArcadeMode();
        }
        this.toggleSpeed();
        this.runningTime = 0;
        this.playingIntro = false;
        this.tRex.playingIntro = false;
        this.containerEl.style.webkitAnimation = '';
        this.playCount++;
        if (this.hasAudioCuesInternal) {
            this.getGeneratedSoundFx().background();
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.JUMP));
        }
        // Handle tabbing off the page. Pause the current game.
        document.addEventListener(RunnerEvents.VISIBILITY, this.onVisibilityChange.bind(this));
        window.addEventListener(RunnerEvents.BLUR, this.onVisibilityChange.bind(this));
        window.addEventListener(RunnerEvents.FOCUS, this.onVisibilityChange.bind(this));
    }
    clearCanvas() {
        (0, shims_js_1.assert)(this.canvasCtx);
        this.canvasCtx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
    }
    /**
     * Checks whether the canvas area is in the viewport of the browser
     * through the current scroll position.
     */
    isCanvasInView() {
        (0, shims_js_1.assert)(this.containerEl);
        return this.containerEl.getBoundingClientRect().top >
            this.config.canvasInViewOffset;
    }
    /**
     * Enable the alt game mode. Switching out the sprites.
     */
    enableAltGameMode() {
        this.imageSprite = this.getRunnerAltGameImageSprite();
        (0, shims_js_1.assert)(this.gameType);
        (0, shims_js_1.assert)(this.tRex);
        (0, shims_js_1.assert)(this.horizon);
        this.spriteDefinition = offline_sprite_definitions_js_1.spriteDefinitionByType[this.gameType];
        if (constants_js_1.IS_HIDPI) {
            this.spriteDef = this.getSpriteDefinition().hdpi;
        }
        else {
            this.spriteDef = this.getSpriteDefinition().ldpi;
        }
        this.altGameModeActive = true;
        this.tRex.enableAltGameMode(this.spriteDef.tRex);
        this.horizon.enableAltGameMode(this.spriteDef);
        if (this.hasAudioCuesInternal) {
            this.getGeneratedSoundFx()?.background();
        }
    }
    /**
     * Update the game frame and schedules the next one.
     */
    update() {
        (0, shims_js_1.assert)(this.tRex);
        this.updatePending = false;
        const now = (0, utils_js_1.getTimeStamp)();
        let deltaTime = now - (this.time || now);
        // Flashing when switching game modes.
        if (this.altGameModeFlashTimer !== null) {
            if (this.altGameModeFlashTimer <= 0) {
                this.altGameModeFlashTimer = null;
                this.tRex.setFlashing(false);
                this.enableAltGameMode();
            }
            else if (this.altGameModeFlashTimer > 0) {
                this.altGameModeFlashTimer -= deltaTime;
                this.tRex.update(deltaTime);
                deltaTime = 0;
            }
        }
        this.time = now;
        if (this.playing) {
            (0, shims_js_1.assert)(this.distanceMeter);
            (0, shims_js_1.assert)(this.horizon);
            (0, shims_js_1.assert)(this.canvasCtx);
            this.clearCanvas();
            // Additional fade in - Prevents jump when switching sprites
            if (this.altGameModeActive &&
                this.fadeInTimer <= this.config.fadeDuration) {
                this.fadeInTimer += deltaTime / 1000;
                this.canvasCtx.globalAlpha = this.fadeInTimer;
            }
            else {
                this.canvasCtx.globalAlpha = 1;
            }
            if (this.tRex.jumping) {
                this.tRex.updateJump(deltaTime);
            }
            this.runningTime += deltaTime;
            const hasObstacles = this.runningTime > this.config.clearTime;
            // First jump triggers the intro.
            if (this.tRex.jumpCount === 1 && !this.playingIntro) {
                this.playIntro();
            }
            // The horizon doesn't move until the intro is over.
            if (this.playingIntro) {
                this.horizon.update(0, this.currentSpeed, hasObstacles, /* showNightMode = */ false);
            }
            else if (!this.crashed) {
                const showNightMode = this.isDarkMode !== this.inverted;
                deltaTime = !this.activated ? 0 : deltaTime;
                this.horizon.update(deltaTime, this.currentSpeed, hasObstacles, showNightMode);
            }
            const firstObstacle = this.horizon.obstacles[0];
            // Check for collisions.
            let collision = hasObstacles && firstObstacle &&
                this.checkForCollision(firstObstacle, this.tRex);
            // For a11y, audio cues.
            if (this.hasAudioCuesInternal && hasObstacles) {
                (0, shims_js_1.assert)(firstObstacle);
                const jumpObstacle = firstObstacle.typeConfig.type !== 'collectable';
                if (!firstObstacle.jumpAlerted) {
                    const threshold = this.config.audiocueProximityThreshold;
                    const adjProximityThreshold = threshold +
                        (threshold * Math.log10(this.currentSpeed / this.config.speed));
                    if (firstObstacle.xPos < adjProximityThreshold) {
                        if (jumpObstacle) {
                            this.getGeneratedSoundFx().jump();
                        }
                        firstObstacle.jumpAlerted = true;
                    }
                }
            }
            // Activated alt game mode.
            if (this.isAltGameModeEnabled() && collision && firstObstacle &&
                firstObstacle.typeConfig.type === 'collectable') {
                this.horizon.removeFirstObstacle();
                this.tRex.setFlashing(true);
                collision = false;
                this.altGameModeFlashTimer = this.config.flashDuration;
                this.runningTime = 0;
                if (this.hasAudioCuesInternal) {
                    this.getGeneratedSoundFx().collect();
                }
            }
            if (!collision) {
                this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
                if (this.currentSpeed < this.config.maxSpeed) {
                    this.currentSpeed += this.config.acceleration;
                }
            }
            else {
                this.gameOver();
            }
            const playAchievementSound = this.distanceMeter.update(deltaTime, Math.ceil(this.distanceRan));
            if (!this.hasAudioCuesInternal && playAchievementSound) {
                this.playSound(this.soundFx.SCORE);
            }
            // Night mode.
            if (!this.isAltGameModeEnabled()) {
                if (this.invertTimer > this.config.invertFadeDuration) {
                    this.invertTimer = 0;
                    this.invertTrigger = false;
                    this.invert(false);
                }
                else if (this.invertTimer) {
                    this.invertTimer += deltaTime;
                }
                else {
                    const actualDistance = this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));
                    if (actualDistance > 0) {
                        this.invertTrigger = !(actualDistance % this.config.invertDistance);
                        if (this.invertTrigger && this.invertTimer === 0) {
                            this.invertTimer += deltaTime;
                            this.invert(false);
                        }
                    }
                }
            }
        }
        if (this.playing ||
            (!this.activated && this.tRex.blinkCount < this.config.maxBlinkCount)) {
            this.tRex.update(deltaTime);
            this.scheduleNextUpdate();
        }
    }
    handleEvent(e) {
        switch (e.type) {
            case RunnerEvents.KEYDOWN:
            case RunnerEvents.TOUCHSTART:
            case RunnerEvents.POINTERDOWN:
                this.onKeyDown(e);
                break;
            case RunnerEvents.KEYUP:
            case RunnerEvents.TOUCHEND:
            case RunnerEvents.POINTERUP:
                this.onKeyUp(e);
                break;
            case RunnerEvents.GAMEPADCONNECTED:
                this.onGamepadConnected();
                break;
            default:
        }
    }
    /**
     * Initialize audio cues if activated by focus on the canvas element.
     */
    handleCanvasKeyPress(e) {
        if (!this.activated && !this.hasAudioCuesInternal) {
            this.toggleSpeed();
            this.hasAudioCuesInternal = true;
            this.generatedSoundFx = new generated_sound_fx_js_1.GeneratedSoundFx();
            this.config.clearTime *= 1.2;
        }
        else if (e instanceof KeyboardEvent && runnerKeycodes.jump.includes(e.keyCode)) {
            this.onKeyDown(e);
        }
    }
    /**
     * Prevent space key press from scrolling.
     */
    preventScrolling(e) {
        if (e.keyCode === 32) {
            e.preventDefault();
        }
    }
    /**
     * Toggle speed setting if toggle is shown.
     */
    toggleSpeed() {
        if (this.hasAudioCuesInternal) {
            (0, shims_js_1.assert)(this.slowSpeedCheckbox);
            const speedChange = this.hasSlowdown !== this.slowSpeedCheckbox.checked;
            if (speedChange) {
                (0, shims_js_1.assert)(this.horizon);
                (0, shims_js_1.assert)(this.tRex);
                this.hasSlowdownInternal = this.slowSpeedCheckbox.checked;
                const updatedConfig = this.hasSlowdown ? slowModeConfig : normalModeConfig;
                this.config = Object.assign(defaultBaseConfig, updatedConfig);
                this.currentSpeed = updatedConfig.speed;
                this.tRex.enableSlowConfig();
                this.horizon.adjustObstacleSpeed();
            }
            if (this.playing) {
                this.disableSpeedToggle(true);
            }
        }
    }
    /**
     * Show the speed toggle.
     * From focus event or when audio cues are activated.
     */
    showSpeedToggle(e) {
        const isFocusEvent = e && e.type === 'focus';
        if (this.hasAudioCuesInternal || isFocusEvent) {
            (0, shims_js_1.assert)(this.slowSpeedCheckboxLabel);
            this.slowSpeedCheckboxLabel.classList.toggle(parent_constants_js_1.HIDDEN_CLASS, isFocusEvent ? false : !this.crashed);
        }
    }
    /**
     * Disable the speed toggle.
     */
    disableSpeedToggle(disable) {
        (0, shims_js_1.assert)(this.slowSpeedCheckbox);
        if (disable) {
            this.slowSpeedCheckbox.setAttribute('disabled', 'disabled');
        }
        else {
            this.slowSpeedCheckbox.removeAttribute('disabled');
        }
    }
    /**
     * Bind relevant key / mouse / touch listeners.
     */
    startListening() {
        (0, shims_js_1.assert)(this.containerEl);
        (0, shims_js_1.assert)(this.canvas);
        // A11y keyboard / screen reader activation.
        this.containerEl.addEventListener(RunnerEvents.KEYDOWN, this.handleCanvasKeyPress.bind(this));
        if (!constants_js_1.IS_MOBILE) {
            this.containerEl.addEventListener(RunnerEvents.FOCUS, this.showSpeedToggle.bind(this));
        }
        this.canvas.addEventListener(RunnerEvents.KEYDOWN, this.preventScrolling.bind(this));
        this.canvas.addEventListener(RunnerEvents.KEYUP, this.preventScrolling.bind(this));
        // Keys.
        document.addEventListener(RunnerEvents.KEYDOWN, this);
        document.addEventListener(RunnerEvents.KEYUP, this);
        // Touch / pointer.
        this.containerEl.addEventListener(RunnerEvents.TOUCHSTART, this);
        document.addEventListener(RunnerEvents.POINTERDOWN, this);
        document.addEventListener(RunnerEvents.POINTERUP, this);
        if (this.isArcadeMode()) {
            // Gamepad
            window.addEventListener(RunnerEvents.GAMEPADCONNECTED, this);
        }
    }
    /**
     * Process keydown.
     */
    onKeyDown(e) {
        // Prevent native page scrolling whilst tapping on mobile.
        if (constants_js_1.IS_MOBILE && this.playing) {
            e.preventDefault();
        }
        if (this.isCanvasInView()) {
            // Allow toggling of speed toggle.
            if (e instanceof KeyboardEvent &&
                runnerKeycodes.jump.includes(e.keyCode) &&
                e.target === this.slowSpeedCheckbox) {
                return;
            }
            if (!this.crashed && !this.paused) {
                // For a11y, screen reader activation.
                const isMobileMouseInput = constants_js_1.IS_MOBILE && e instanceof PointerEvent &&
                    e.type === RunnerEvents.POINTERDOWN && e.pointerType === 'mouse' &&
                    (e.target === this.containerEl ||
                        (constants_js_1.IS_IOS &&
                            (e.target === this.touchController || e.target === this.canvas)));
                (0, shims_js_1.assert)(this.tRex);
                if ((e instanceof KeyboardEvent &&
                    runnerKeycodes.jump.includes(e.keyCode)) ||
                    e.type === RunnerEvents.TOUCHSTART || isMobileMouseInput) {
                    e.preventDefault();
                    // Starting the game for the first time.
                    if (!this.playing) {
                        // Started by touch so create a touch controller.
                        if (!this.touchController && e.type === RunnerEvents.TOUCHSTART) {
                            this.createTouchController();
                        }
                        if (isMobileMouseInput) {
                            this.handleCanvasKeyPress(e);
                        }
                        this.loadSounds();
                        this.setPlayStatus(true);
                        this.update();
                        if (window.errorPageController) {
                            window.errorPageController.trackEasterEgg();
                        }
                    }
                    // Start jump.
                    if (!this.tRex.jumping && !this.tRex.ducking) {
                        if (this.hasAudioCuesInternal) {
                            this.getGeneratedSoundFx().cancelFootSteps();
                        }
                        else {
                            this.playSound(this.soundFx.BUTTON_PRESS);
                        }
                        this.tRex.startJump(this.currentSpeed);
                    }
                }
                else if (this.playing && e instanceof KeyboardEvent &&
                    runnerKeycodes.duck.includes(e.keyCode)) {
                    e.preventDefault();
                    if (this.tRex.jumping) {
                        // Speed drop, activated only when jump key is not pressed.
                        this.tRex.setSpeedDrop();
                    }
                    else if (!this.tRex.jumping && !this.tRex.ducking) {
                        // Duck.
                        this.tRex.setDuck(true);
                    }
                }
            }
        }
    }
    /**
     * Process key up.
     */
    onKeyUp(e) {
        (0, shims_js_1.assert)(this.tRex);
        const keyCode = ('keyCode' in e) ? e.keyCode : 0;
        const isjumpKey = runnerKeycodes.jump.includes(keyCode) ||
            e.type === RunnerEvents.TOUCHEND || e.type === RunnerEvents.POINTERUP;
        if (this.isRunning() && isjumpKey) {
            this.tRex.endJump();
        }
        else if (runnerKeycodes.duck.includes(keyCode)) {
            this.tRex.speedDrop = false;
            this.tRex.setDuck(false);
        }
        else if (this.crashed) {
            // Check that enough time has elapsed before allowing jump key to restart.
            const deltaTime = (0, utils_js_1.getTimeStamp)() - this.time;
            if (this.isCanvasInView() &&
                (runnerKeycodes.restart.includes(keyCode) ||
                    this.isLeftClickOnCanvas(e) ||
                    (deltaTime >= this.config.gameoverClearTime &&
                        runnerKeycodes.jump.includes(keyCode)))) {
                this.handleGameOverClicks(e);
            }
        }
        else if (this.paused && isjumpKey) {
            // Reset the jump state
            this.tRex.reset();
            this.play();
        }
    }
    /**
     * Process gamepad connected event.
     */
    onGamepadConnected() {
        if (!this.pollingGamepads) {
            this.pollGamepadState();
        }
    }
    /**
     * rAF loop for gamepad polling.
     */
    pollGamepadState() {
        const gamepads = navigator.getGamepads();
        this.pollActiveGamepad(gamepads);
        this.pollingGamepads = true;
        requestAnimationFrame(this.pollGamepadState.bind(this));
    }
    /**
     * Polls for a gamepad with the jump button pressed. If one is found this
     * becomes the "active" gamepad and all others are ignored.
     */
    pollForActiveGamepad(gamepads) {
        for (const [i, gamepad] of gamepads.entries()) {
            if (gamepad && gamepad.buttons.length > 0 &&
                gamepad.buttons[0].pressed) {
                this.gamepadIndex = i;
                this.pollActiveGamepad(gamepads);
                return;
            }
        }
    }
    /**
     * Polls the chosen gamepad for button presses and generates KeyboardEvents
     * to integrate with the rest of the game logic.
     */
    pollActiveGamepad(gamepads) {
        if (this.gamepadIndex === undefined) {
            this.pollForActiveGamepad(gamepads);
            return;
        }
        const gamepad = gamepads[this.gamepadIndex];
        if (!gamepad) {
            this.gamepadIndex = undefined;
            this.pollForActiveGamepad(gamepads);
            return;
        }
        // The gamepad specification defines the typical mapping of physical buttons
        // to button indices: https://w3c.github.io/gamepad/#remapping
        this.pollGamepadButton(gamepad, 0, 38); // Jump
        if (gamepad.buttons.length >= 2) {
            this.pollGamepadButton(gamepad, 1, 40); // Duck
        }
        if (gamepad.buttons.length >= 10) {
            this.pollGamepadButton(gamepad, 9, 13); // Restart
        }
        this.previousGamepad = gamepad;
    }
    /**
     * Generates a key event based on a gamepad button.
     */
    pollGamepadButton(gamepad, buttonIndex, keyCode) {
        const state = gamepad.buttons[buttonIndex]?.pressed || false;
        let previousState = false;
        if (this.previousGamepad) {
            previousState =
                this.previousGamepad.buttons[buttonIndex]?.pressed || false;
        }
        // Generate key events on the rising and falling edge of a button press.
        if (state !== previousState) {
            const e = new KeyboardEvent(state ? RunnerEvents.KEYDOWN : RunnerEvents.KEYUP, { keyCode: keyCode });
            document.dispatchEvent(e);
        }
    }
    /**
     * Handle interactions on the game over screen state.
     * A user is able to tap the high score twice to reset it.
     */
    handleGameOverClicks(e) {
        if (e.target !== this.slowSpeedCheckbox) {
            (0, shims_js_1.assert)(this.distanceMeter);
            e.preventDefault();
            if (this.distanceMeter.hasClickedOnHighScore(e) && this.highestScore) {
                if (this.distanceMeter.isHighScoreFlashing()) {
                    // Subsequent click, reset the high score.
                    this.saveHighScore(0, true);
                    this.distanceMeter.resetHighScore();
                }
                else {
                    // First click, flash the high score.
                    this.distanceMeter.startHighScoreFlashing();
                }
            }
            else {
                this.distanceMeter.cancelHighScoreFlashing();
                this.restart();
            }
        }
    }
    /**
     * Returns whether the event was a left click on canvas.
     * On Windows right click is registered as a click.
     */
    isLeftClickOnCanvas(e) {
        if (!(e instanceof MouseEvent)) {
            return false;
        }
        return e.button != null && e.button < 2 &&
            e.type === RunnerEvents.POINTERUP &&
            (e.target === this.canvas ||
                (constants_js_1.IS_MOBILE && this.hasAudioCuesInternal &&
                    e.target === this.containerEl));
    }
    /**
     * RequestAnimationFrame wrapper.
     */
    scheduleNextUpdate() {
        if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
    }
    /**
     * Whether the game is running.
     */
    isRunning() {
        return !!this.raqId;
    }
    /**
     * Set the initial high score as stored in the user's profile.
     */
    initializeHighScore(highScore) {
        (0, shims_js_1.assert)(this.distanceMeter);
        this.syncHighestScore = true;
        highScore = Math.ceil(highScore);
        if (highScore < this.highestScore) {
            if (window.errorPageController) {
                window.errorPageController.updateEasterEggHighScore(this.highestScore);
            }
            return;
        }
        this.highestScore = highScore;
        this.distanceMeter.setHighScore(this.highestScore);
    }
    /**
     * Sets the current high score and saves to the profile if available.
     * @param distanceRan Total distance ran.
     * @param  resetScore Whether to reset the score.
     */
    saveHighScore(distanceRan, resetScore) {
        (0, shims_js_1.assert)(this.distanceMeter);
        this.highestScore = Math.ceil(distanceRan);
        this.distanceMeter.setHighScore(this.highestScore);
        // Store the new high score in the profile.
        if (this.syncHighestScore && window.errorPageController) {
            if (resetScore) {
                window.errorPageController.resetEasterEggHighScore();
            }
            else {
                window.errorPageController.updateEasterEggHighScore(this.highestScore);
            }
        }
    }
    /**
     * Game over state.
     */
    gameOver() {
        (0, shims_js_1.assert)(this.distanceMeter);
        (0, shims_js_1.assert)(this.tRex);
        (0, shims_js_1.assert)(this.containerEl);
        this.playSound(this.soundFx.HIT);
        vibrate(200);
        this.stop();
        this.crashed = true;
        this.distanceMeter.achievement = false;
        this.tRex.update(100, trex_js_1.Status.CRASHED);
        // Game over panel.
        if (!this.gameOverPanel) {
            const origSpriteDef = constants_js_1.IS_HIDPI ? offline_sprite_definitions_js_1.spriteDefinitionByType.original.hdpi :
                offline_sprite_definitions_js_1.spriteDefinitionByType.original.ldpi;
            if (this.canvas) {
                if (this.isAltGameModeEnabled()) {
                    this.gameOverPanel = new game_over_panel_js_1.GameOverPanel(this.canvas, origSpriteDef.textSprite, origSpriteDef.restart, this.dimensions, /* imageSpriteProvider= */ this, origSpriteDef.altGameEnd, this.altGameModeActive);
                }
                else {
                    this.gameOverPanel = new game_over_panel_js_1.GameOverPanel(this.canvas, origSpriteDef.textSprite, origSpriteDef.restart, this.dimensions, /* imageSpriteProvider= */ this);
                }
            }
        }
        (0, shims_js_1.assert)(this.gameOverPanel);
        this.gameOverPanel.draw(this.altGameModeActive, this.tRex);
        // Update the high score.
        if (this.distanceRan > this.highestScore) {
            this.saveHighScore(this.distanceRan);
        }
        // Reset the time clock.
        this.time = (0, utils_js_1.getTimeStamp)();
        if (this.hasAudioCuesInternal) {
            this.getGeneratedSoundFx().stopAll();
            (0, shims_js_1.assert)(this.containerEl);
            this.announcePhrase(getA11yString(A11yStrings.GAME_OVER)
                .replace('$1', this.distanceMeter.getActualDistance(this.distanceRan)
                .toString()) +
                ' ' +
                getA11yString(A11yStrings.HIGH_SCORE)
                    .replace('$1', this.distanceMeter.getActualDistance(this.highestScore)
                    .toString()));
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.ARIA_LABEL));
        }
        this.showSpeedToggle();
        this.disableSpeedToggle(false);
    }
    stop() {
        this.setPlayStatus(false);
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
        if (this.hasAudioCuesInternal) {
            this.getGeneratedSoundFx().stopAll();
        }
    }
    play() {
        if (!this.crashed) {
            (0, shims_js_1.assert)(this.tRex);
            this.setPlayStatus(true);
            this.paused = false;
            this.tRex.update(0, trex_js_1.Status.RUNNING);
            this.time = (0, utils_js_1.getTimeStamp)();
            this.update();
            if (this.hasAudioCuesInternal) {
                this.getGeneratedSoundFx().background();
            }
        }
    }
    restart() {
        if (!this.raqId) {
            (0, shims_js_1.assert)(this.containerEl);
            (0, shims_js_1.assert)(this.gameOverPanel);
            (0, shims_js_1.assert)(this.tRex);
            (0, shims_js_1.assert)(this.horizon);
            (0, shims_js_1.assert)(this.distanceMeter);
            this.playCount++;
            this.runningTime = 0;
            this.setPlayStatus(true);
            this.toggleSpeed();
            this.paused = false;
            this.crashed = false;
            this.distanceRan = 0;
            this.setSpeed(this.config.speed);
            this.time = (0, utils_js_1.getTimeStamp)();
            this.containerEl.classList.remove(RunnerClasses.CRASHED);
            this.clearCanvas();
            this.distanceMeter.reset();
            this.horizon.reset();
            this.tRex.reset();
            this.playSound(this.soundFx.BUTTON_PRESS);
            this.invert(true);
            this.update();
            this.gameOverPanel.reset();
            if (this.hasAudioCuesInternal) {
                this.getGeneratedSoundFx().background();
            }
            this.containerEl.setAttribute('title', getA11yString(A11yStrings.JUMP));
            this.announcePhrase(getA11yString(A11yStrings.STARTED));
        }
    }
    setPlayStatus(isPlaying) {
        if (this.touchController) {
            this.touchController.classList.toggle(parent_constants_js_1.HIDDEN_CLASS, !isPlaying);
        }
        this.playing = isPlaying;
    }
    /**
     * Whether the game should go into arcade mode.
     */
    isArcadeMode() {
        // In RTL languages the title is wrapped with the left to right mark
        // control characters &#x202A; and &#x202C but are invisible.
        return document.title.startsWith(ARCADE_MODE_URL, constants_js_1.IS_RTL ? 1 : 0);
    }
    /**
     * Hides offline messaging for a fullscreen game only experience.
     */
    setArcadeMode() {
        document.body.classList.add(RunnerClasses.ARCADE_MODE);
        this.setArcadeModeContainerScale();
    }
    /**
     * Sets the scaling for arcade mode.
     */
    setArcadeModeContainerScale() {
        (0, shims_js_1.assert)(this.containerEl);
        const windowHeight = window.innerHeight;
        const scaleHeight = windowHeight / this.dimensions.height;
        const scaleWidth = window.innerWidth / this.dimensions.width;
        const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
        const scaledCanvasHeight = this.dimensions.height * scale;
        // Positions the game container at 10% of the available vertical window
        // height minus the game container height.
        const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
            this.config.arcadeModeInitialTopPosition) *
            this.config.arcadeModeTopPositionPercent)) *
            window.devicePixelRatio;
        const cssScale = constants_js_1.IS_RTL ? -scale + ',' + scale : scale;
        this.containerEl.style.transform =
            'scale(' + cssScale + ') translateY(' + translateY + 'px)';
    }
    /**
     * Pause the game if the tab is not in focus.
     */
    onVisibilityChange(e) {
        if (document.hidden || e.type === 'blur' ||
            document.visibilityState !== 'visible') {
            this.stop();
        }
        else if (!this.crashed) {
            (0, shims_js_1.assert)(this.tRex);
            this.tRex.reset();
            this.play();
        }
    }
    /**
     * Play a sound.
     */
    playSound(soundBuffer) {
        if (soundBuffer) {
            (0, shims_js_1.assert)(this.audioContext);
            const sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = soundBuffer;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(0);
        }
    }
    /**
     * Inverts the current page / canvas colors.
     * @param reset Whether to reset colors.
     */
    invert(reset) {
        const htmlEl = document.firstElementChild;
        (0, shims_js_1.assert)(htmlEl);
        if (reset) {
            htmlEl.classList.toggle(RunnerClasses.INVERTED, false);
            this.invertTimer = 0;
            this.inverted = false;
        }
        else {
            this.inverted =
                htmlEl.classList.toggle(RunnerClasses.INVERTED, this.invertTrigger);
        }
    }
    /**
     * For screen readers make an announcement to the live region.
     * @param phrase Sentence to speak.
     */
    announcePhrase(phrase) {
        if (this.a11yStatusEl) {
            this.a11yStatusEl.textContent = '';
            this.a11yStatusEl.textContent = phrase;
        }
    }
    /**
     * Check for a collision.
     * @param obstacle Obstacle object.
     * @param tRex T-rex object.
     * @param canvasCtx Optional canvas context for drawing collision boxes.
     */
    checkForCollision(obstacle, tRex, canvasCtx) {
        // Adjustments are made to the bounding box as there is a 1 pixel white
        // border around the t-rex and obstacles.
        const tRexBox = new offline_sprite_definitions_js_1.CollisionBox(tRex.xPos + 1, tRex.yPos + 1, tRex.config.width - 2, tRex.config.height - 2);
        const obstacleBox = new offline_sprite_definitions_js_1.CollisionBox(obstacle.xPos + 1, obstacle.yPos + 1, obstacle.typeConfig.width * obstacle.size - 2, obstacle.typeConfig.height - 2);
        // Debug outer box
        if (canvasCtx) {
            drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox);
        }
        // Simple outer bounds check.
        if (boxCompare(tRexBox, obstacleBox)) {
            const collisionBoxes = obstacle.collisionBoxes;
            let tRexCollisionBoxes = [];
            if (this.isAltGameModeEnabled()) {
                const runnerSpriteDefinition = this.getSpriteDefinition();
                (0, shims_js_1.assert)(runnerSpriteDefinition);
                (0, shims_js_1.assert)(runnerSpriteDefinition.tRex);
                tRexCollisionBoxes = runnerSpriteDefinition.tRex.collisionBoxes;
            }
            else {
                tRexCollisionBoxes = tRex.getCollisionBoxes();
            }
            // Detailed axis aligned box check.
            for (const tRexCollisionBox of tRexCollisionBoxes) {
                for (const obstacleCollixionBox of collisionBoxes) {
                    // Adjust the box to actual positions.
                    const adjTrexBox = createAdjustedCollisionBox(tRexCollisionBox, tRexBox);
                    const adjObstacleBox = createAdjustedCollisionBox(obstacleCollixionBox, obstacleBox);
                    const crashed = boxCompare(adjTrexBox, adjObstacleBox);
                    // Draw boxes for debug.
                    if (canvasCtx) {
                        drawCollisionBoxes(canvasCtx, adjTrexBox, adjObstacleBox);
                    }
                    if (crashed) {
                        return [adjTrexBox, adjObstacleBox];
                    }
                }
            }
        }
        return null;
    }
}
exports.Runner = Runner;
/**
 * Updates the canvas size taking into
 * account the backing store pixel ratio and
 * the device pixel ratio.
 *
 * See article by Paul Lewis:
 * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 *
 * @return Whether the canvas was scaled.
 */
function updateCanvasScaling(canvas, width, height) {
    const context = canvas.getContext('2d');
    (0, shims_js_1.assert)(context);
    // Query the various pixel ratios
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    /** @suppress {missingProperties} */
    const backingStoreRatio = ('webkitBackingStorePixelRatio' in context) ?
        Math.floor(context.webkitBackingStorePixelRatio) :
        1;
    const ratio = devicePixelRatio / backingStoreRatio;
    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
        const oldWidth = width || canvas.width;
        const oldHeight = height || canvas.height;
        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;
        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';
        // Scale the context to counter the fact that we've manually scaled
        // our canvas element.
        context.scale(ratio, ratio);
        return true;
    }
    else if (devicePixelRatio === 1) {
        // Reset the canvas width / height. Fixes scaling bug when the page is
        // zoomed and the devicePixelRatio changes accordingly.
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
    }
    return false;
}
/**
 * Returns a string from loadTimeData data object.
 */
function getA11yString(stringName) {
    return shims_js_2.loadTimeData.valueExists(stringName) ?
        shims_js_2.loadTimeData.getString(stringName) :
        '';
}
/**
 * Vibrate on mobile devices.
 * @param duration Duration of the vibration in milliseconds.
 */
function vibrate(duration) {
    if (constants_js_1.IS_MOBILE && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}
/**
 * Create canvas element.
 * @param container Element to append canvas to.
 */
function createCanvas(container, width, height, classname) {
    const canvas = document.createElement('canvas');
    canvas.className =
        classname ? RunnerClasses.CANVAS + ' ' + classname : RunnerClasses.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    return canvas;
}
/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 */
function decodeBase64ToArrayBuffer(base64String) {
    const len = (base64String.length / 4) * 3;
    const str = atob(base64String);
    const arrayBuffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
}
//******************************************************************************
/**
 * Adjust the collision box.
 * @param box The original box.
 * @param adjustment Adjustment box.
 * @return The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
    return new offline_sprite_definitions_js_1.CollisionBox(box.x + adjustment.x, box.y + adjustment.y, box.width, box.height);
}
/**
 * Draw the collision boxes for debug.
 */
function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
    canvasCtx.save();
    canvasCtx.strokeStyle = '#f00';
    canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);
    canvasCtx.strokeStyle = '#0f0';
    canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y, obstacleBox.width, obstacleBox.height);
    canvasCtx.restore();
}
/**
 * Compare two collision boxes for a collision.
 * @return Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
    const tRexBoxX = tRexBox.x;
    const tRexBoxY = tRexBox.y;
    const obstacleBoxX = obstacleBox.x;
    const obstacleBoxY = obstacleBox.y;
    // Axis-Aligned Bounding Box method.
    if (tRexBoxX < obstacleBoxX + obstacleBox.width &&
        tRexBoxX + tRexBox.width > obstacleBoxX &&
        tRexBoxY < obstacleBoxY + obstacleBox.height &&
        tRexBox.height + tRexBoxY > obstacleBoxY) {
        return true;
    }
    return false;
}

};
modules["offline_sprite_definitions.js"]=function(require,exports,module){
"use strict";
// Copyright 2021 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.spriteDefinitionByType = exports.CollisionBox = exports.GAME_TYPE = void 0;
/*
 * List of alternative game types defined in spriteDefinitionByType.
 */
exports.GAME_TYPE = [];
//******************************************************************************
/**
 * Collision box object.
 */
class CollisionBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
exports.CollisionBox = CollisionBox;
/**
 * T-Rex runner sprite definitions.
 */
exports.spriteDefinitionByType = {
    original: {
        ldpi: {
            backgroundEl: { x: 86, y: 2 },
            cactusLarge: { x: 332, y: 2 },
            cactusSmall: { x: 228, y: 2 },
            obstacle2: { x: 332, y: 2 },
            obstacle: { x: 228, y: 2 },
            cloud: { x: 86, y: 2 },
            horizon: { x: 2, y: 54 },
            moon: { x: 484, y: 2 },
            pterodactyl: { x: 134, y: 2 },
            restart: { x: 2, y: 68 },
            textSprite: { x: 655, y: 2 },
            tRex: { x: 848, y: 2 },
            star: { x: 645, y: 2 },
            collectable: { x: 0, y: 0 },
            altGameEnd: { x: 32, y: 0 },
        },
        hdpi: {
            backgroundEl: { x: 166, y: 2 },
            cactusLarge: { x: 652, y: 2 },
            cactusSmall: { x: 446, y: 2 },
            obstacle2: { x: 652, y: 2 },
            obstacle: { x: 446, y: 2 },
            cloud: { x: 166, y: 2 },
            horizon: { x: 2, y: 104 },
            moon: { x: 954, y: 2 },
            pterodactyl: { x: 260, y: 2 },
            restart: { x: 2, y: 130 },
            textSprite: { x: 1294, y: 2 },
            tRex: { x: 1678, y: 2 },
            star: { x: 1276, y: 2 },
            collectable: { x: 0, y: 0 },
            altGameEnd: { x: 64, y: 0 },
        },
        maxGapCoefficient: 1.5,
        maxObstacleLength: 3,
        hasClouds: true,
        bottomPad: 10,
        obstacles: [
            {
                type: 'cactusSmall',
                width: 17,
                height: 35,
                yPos: 105,
                multipleSpeed: 4,
                minGap: 120,
                minSpeed: 0,
                collisionBoxes: [
                    { x: 0, y: 7, width: 5, height: 27 },
                    { x: 4, y: 0, width: 6, height: 34 },
                    { x: 10, y: 4, width: 7, height: 14 },
                ],
            },
            {
                type: 'cactusLarge',
                width: 25,
                height: 50,
                yPos: 90,
                multipleSpeed: 7,
                minGap: 120,
                minSpeed: 0,
                collisionBoxes: [
                    { x: 0, y: 12, width: 7, height: 38 },
                    { x: 8, y: 0, width: 7, height: 49 },
                    { x: 13, y: 10, width: 10, height: 38 },
                ],
            },
            {
                type: 'pterodactyl',
                width: 46,
                height: 40,
                yPos: [100, 75, 50], // Variable height.
                yPosMobile: [100, 50], // Variable height mobile.
                multipleSpeed: 999,
                minSpeed: 8.5,
                minGap: 150,
                collisionBoxes: [
                    { x: 15, y: 15, width: 16, height: 5 },
                    { x: 18, y: 21, width: 24, height: 6 },
                    { x: 2, y: 14, width: 4, height: 3 },
                    { x: 6, y: 10, width: 4, height: 7 },
                    { x: 10, y: 8, width: 6, height: 9 },
                ],
                numFrames: 2,
                frameRate: 1000 / 6,
                speedOffset: .8,
            },
            {
                type: 'collectable',
                width: 31,
                height: 24,
                yPos: 104,
                multipleSpeed: 1000,
                minGap: 9999,
                minSpeed: 0,
                collisionBoxes: [
                    { x: 0, y: 0, width: 32, height: 25 },
                ],
            },
        ],
        backgroundEl: {
            'CLOUD': {
                height: 14,
                offset: 4,
                width: 46,
                xPos: 1,
                fixed: false,
            },
        },
        backgroundElConfig: {
            maxBgEls: 1,
            maxGap: 400,
            minGap: 100,
            pos: 0,
            speed: 0.5,
            yPos: 125,
        },
        lines: [
            { sourceX: 2, sourceY: 52, width: 600, height: 12, yPos: 127 },
        ],
        altGameOverTextConfig: {
            textX: 32,
            textY: 0,
            textWidth: 246,
            textHeight: 17,
            flashDuration: 1500,
            flashing: false,
        },
    },
};

};
modules["sprite_position.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });

};
modules["trex.js"]=function(require,exports,module){
"use strict";
// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trex = exports.Status = void 0;
const shims_js_1 = require("./shims.js");
const constants_js_1 = require("./constants.js");
const offline_sprite_definitions_js_1 = require("./offline_sprite_definitions.js");
const utils_js_1 = require("./utils.js");
/**
 * T-rex player config.
 */
const defaultTrexConfig = {
    dropVelocity: -5,
    flashOff: 175,
    flashOn: 100,
    height: 47,
    heightDuck: 25,
    introDuration: 1500,
    speedDropCoefficient: 3,
    spriteWidth: 262,
    startXPos: 50,
    width: 44,
    widthDuck: 59,
    invertJump: false,
};
const slowJumpConfig = {
    gravity: 0.25,
    maxJumpHeight: 50,
    minJumpHeight: 45,
    initialJumpVelocity: -20,
};
const normalJumpConfig = {
    gravity: 0.6,
    maxJumpHeight: 30,
    minJumpHeight: 30,
    initialJumpVelocity: -10,
};
/**
 * Used in collision detection.
 */
const collisionBoxes = {
    ducking: [new offline_sprite_definitions_js_1.CollisionBox(1, 18, 55, 25)],
    running: [
        new offline_sprite_definitions_js_1.CollisionBox(22, 0, 17, 16),
        new offline_sprite_definitions_js_1.CollisionBox(1, 18, 30, 9),
        new offline_sprite_definitions_js_1.CollisionBox(10, 35, 14, 8),
        new offline_sprite_definitions_js_1.CollisionBox(1, 24, 29, 5),
        new offline_sprite_definitions_js_1.CollisionBox(5, 30, 21, 4),
        new offline_sprite_definitions_js_1.CollisionBox(9, 34, 15, 4),
    ],
};
var Status;
(function (Status) {
    Status[Status["CRASHED"] = 0] = "CRASHED";
    Status[Status["DUCKING"] = 1] = "DUCKING";
    Status[Status["JUMPING"] = 2] = "JUMPING";
    Status[Status["RUNNING"] = 3] = "RUNNING";
    Status[Status["WAITING"] = 4] = "WAITING";
})(Status || (exports.Status = Status = {}));
/**
 * Blinking coefficient.
 */
const BLINK_TIMING = 7000;
/**
 * Animation config for different states.
 */
const animFrames = {
    [Status.WAITING]: {
        frames: [44, 0],
        msPerFrame: 1000 / 3,
    },
    [Status.RUNNING]: {
        frames: [88, 132],
        msPerFrame: 1000 / 12,
    },
    [Status.CRASHED]: {
        frames: [220],
        msPerFrame: 1000 / 60,
    },
    [Status.JUMPING]: {
        frames: [0],
        msPerFrame: 1000 / 60,
    },
    [Status.DUCKING]: {
        frames: [264, 323],
        msPerFrame: 1000 / 8,
    },
};
class Trex {
    /**
     * T-rex game character.
     */
    constructor(canvas, spritePos, resourceProvider) {
        this.playingIntro = false;
        this.xPos = 0;
        this.yPos = 0;
        this.jumpCount = 0;
        this.ducking = false;
        this.blinkCount = 0;
        this.jumping = false;
        this.speedDrop = false;
        this.xInitialPos = 0;
        // Position when on the ground.
        this.groundYPos = 0;
        this.currentFrame = 0;
        this.currentAnimFrames = [];
        this.blinkDelay = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.msPerFrame = 1000 / constants_js_1.FPS;
        // Current status.
        this.status = Status.WAITING;
        this.jumpVelocity = 0;
        this.reachedMinHeight = false;
        this.altGameModeEnabled = false;
        this.flashing = false;
        const canvasContext = canvas.getContext('2d');
        (0, shims_js_1.assert)(canvasContext);
        this.canvasCtx = canvasContext;
        this.spritePos = spritePos;
        this.resourceProvider = resourceProvider;
        this.config = Object.assign(defaultTrexConfig, normalJumpConfig);
        const runnerDefaultDimensions = constants_js_1.DEFAULT_DIMENSIONS;
        const runnerBottomPadding = this.resourceProvider.getConfig().bottomPad;
        (0, shims_js_1.assert)(runnerDefaultDimensions);
        (0, shims_js_1.assert)(runnerBottomPadding);
        this.groundYPos = runnerDefaultDimensions.height - this.config.height -
            runnerBottomPadding;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.minJumpHeight;
        this.draw(0, 0);
        this.update(0, Status.WAITING);
    }
    /**
     * Assign the appropriate jump parameters based on the game speed.
     */
    enableSlowConfig() {
        const jumpConfig = this.resourceProvider.hasSlowdown ? slowJumpConfig : normalJumpConfig;
        this.config = Object.assign(defaultTrexConfig, jumpConfig);
        this.adjustAltGameConfigForSlowSpeed();
    }
    /**
     * Enables the alternative game. Redefines the dino config.
     * @param spritePos New positioning within image sprite.
     */
    enableAltGameMode(spritePos) {
        this.altGameModeEnabled = true;
        this.spritePos = spritePos;
        const spriteDefinition = this.resourceProvider.getSpriteDefinition();
        (0, shims_js_1.assert)(spriteDefinition);
        const tRexSpriteDefinition = spriteDefinition.tRex;
        (0, shims_js_1.assert)(tRexSpriteDefinition.running1);
        const runnerDefaultDimensions = constants_js_1.DEFAULT_DIMENSIONS;
        // Update animation frames.
        animFrames[Status.RUNNING].frames =
            [tRexSpriteDefinition.running1.x, tRexSpriteDefinition.running2.x];
        animFrames[Status.CRASHED].frames = [tRexSpriteDefinition.crashed.x];
        if (typeof tRexSpriteDefinition.jumping.x === 'object') {
            animFrames[Status.JUMPING].frames = tRexSpriteDefinition.jumping.x;
        }
        else {
            animFrames[Status.JUMPING].frames = [tRexSpriteDefinition.jumping.x];
        }
        animFrames[Status.DUCKING].frames =
            [tRexSpriteDefinition.ducking1.x, tRexSpriteDefinition.ducking2.x];
        // Update Trex config
        this.config.gravity = tRexSpriteDefinition.gravity || this.config.gravity;
        this.config.height = tRexSpriteDefinition.running1.h,
            this.config.initialJumpVelocity = tRexSpriteDefinition.initialJumpVelocity;
        this.config.maxJumpHeight = tRexSpriteDefinition.maxJumpHeight;
        this.config.minJumpHeight = tRexSpriteDefinition.minJumpHeight;
        this.config.width = tRexSpriteDefinition.running1.w;
        this.config.widthCrashed = tRexSpriteDefinition.crashed.w;
        this.config.widthJump = tRexSpriteDefinition.jumping.w;
        this.config.invertJump = tRexSpriteDefinition.invertJump;
        this.adjustAltGameConfigForSlowSpeed(tRexSpriteDefinition.gravity);
        // Adjust bottom horizon placement.
        this.groundYPos = runnerDefaultDimensions.height - this.config.height -
            spriteDefinition.bottomPad;
        this.yPos = this.groundYPos;
        this.reset();
    }
    /**
     * Slow speeds adjustments for the alt game modes.
     */
    adjustAltGameConfigForSlowSpeed(gravityValue) {
        if (this.resourceProvider.hasSlowdown) {
            if (gravityValue) {
                this.config.gravity = gravityValue / 1.5;
            }
            this.config.minJumpHeight *= 1.5;
            this.config.maxJumpHeight *= 1.5;
            this.config.initialJumpVelocity *= 1.5;
        }
    }
    /**
     * Setter whether dino is flashing.
     */
    setFlashing(status) {
        this.flashing = status;
    }
    /**
     * Setter for the jump velocity.
     * The appropriate drop velocity is also set.
     */
    setJumpVelocity(setting) {
        this.config.initialJumpVelocity = -setting;
        this.config.dropVelocity = -setting / 2;
    }
    /**
     * Set the animation status.
     */
    update(deltaTime, status) {
        this.timer += deltaTime;
        // Update the status.
        if (status !== undefined) {
            this.status = status;
            this.currentFrame = 0;
            this.msPerFrame = animFrames[status].msPerFrame;
            this.currentAnimFrames = animFrames[status].frames;
            if (status === Status.WAITING) {
                this.animStartTime = (0, utils_js_1.getTimeStamp)();
                this.setBlinkDelay();
            }
        }
        // Game intro animation, T-rex moves in from the left.
        if (this.playingIntro && this.xPos < this.config.startXPos) {
            this.xPos += Math.round((this.config.startXPos / this.config.introDuration) * deltaTime);
            this.xInitialPos = this.xPos;
        }
        if (this.status === Status.WAITING) {
            this.blink((0, utils_js_1.getTimeStamp)());
        }
        else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }
        // Update the frame position.
        if (!this.flashing && this.timer >= this.msPerFrame) {
            this.currentFrame =
                this.currentFrame === this.currentAnimFrames.length - 1 ?
                    0 :
                    this.currentFrame + 1;
            this.timer = 0;
        }
        // Speed drop becomes duck if the down key is still being pressed.
        if (this.speedDrop && this.yPos === this.groundYPos) {
            this.speedDrop = false;
            this.setDuck(true);
        }
    }
    /**
     * Draw the t-rex to a particular position.
     */
    draw(x, y) {
        let sourceX = x;
        let sourceY = y;
        let sourceWidth = this.ducking && this.status !== Status.CRASHED ?
            this.config.widthDuck :
            this.config.width;
        let sourceHeight = this.config.height;
        const outputHeight = sourceHeight;
        if (this.altGameModeEnabled) {
            (0, shims_js_1.assert)(this.config.widthCrashed);
        }
        const outputWidth = this.altGameModeEnabled && this.status === Status.CRASHED ?
            this.config.widthCrashed :
            this.config.width;
        const runnerImageSprite = this.resourceProvider.getRunnerImageSprite();
        (0, shims_js_1.assert)(runnerImageSprite);
        // Width of sprite can change on jump or crashed.
        if (this.altGameModeEnabled) {
            if (this.jumping && this.status !== Status.CRASHED) {
                (0, shims_js_1.assert)(this.config.widthJump);
                sourceWidth = this.config.widthJump;
            }
            else if (this.status === Status.CRASHED) {
                (0, shims_js_1.assert)(this.config.widthCrashed);
                sourceWidth = this.config.widthCrashed;
            }
        }
        if (constants_js_1.IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
        }
        // Adjustments for sprite sheet position.
        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;
        // Flashing.
        if (this.flashing) {
            if (this.timer < this.config.flashOn) {
                this.canvasCtx.globalAlpha = 0.5;
            }
            else if (this.timer > this.config.flashOff) {
                this.timer = 0;
            }
        }
        // Ducking.
        if (this.ducking && this.status !== Status.CRASHED) {
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, this.config.widthDuck, outputHeight);
        }
        else if (this.altGameModeEnabled && this.jumping &&
            this.status !== Status.CRASHED) {
            (0, shims_js_1.assert)(this.config.widthJump);
            const spriteDefinition = this.resourceProvider.getSpriteDefinition();
            (0, shims_js_1.assert)(spriteDefinition);
            (0, shims_js_1.assert)(spriteDefinition.tRex);
            const jumpOffset = spriteDefinition.tRex.jumping.xOffset * (constants_js_1.IS_HIDPI ? 2 : 1);
            // Jumping with adjustments.
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos - jumpOffset, this.yPos, this.config.widthJump, outputHeight);
        }
        else {
            // Crashed whilst ducking. Trex is standing up so needs adjustment.
            if (this.ducking && this.status === Status.CRASHED) {
                this.xPos++;
            }
            // Standing / running
            this.canvasCtx.drawImage(runnerImageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        }
        this.canvasCtx.globalAlpha = 1;
    }
    /**
     * Sets a random time for the blink to happen.
     */
    setBlinkDelay() {
        this.blinkDelay = Math.ceil(Math.random() * BLINK_TIMING);
    }
    /**
     * Make t-rex blink at random intervals.
     * @param time Current time in milliseconds.
     */
    blink(time) {
        const deltaTime = time - this.animStartTime;
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame === 1) {
                // Set new random delay to blink.
                this.setBlinkDelay();
                this.animStartTime = time;
                this.blinkCount++;
            }
        }
    }
    /**
     * Initialise a jump.
     */
    startJump(speed) {
        if (!this.jumping) {
            this.update(0, Status.JUMPING);
            // Tweak the jump velocity based on the speed.
            this.jumpVelocity = this.config.initialJumpVelocity - (speed / 10);
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
            if (this.config.invertJump) {
                this.minJumpHeight = this.groundYPos + this.config.minJumpHeight;
            }
        }
    }
    /**
     * Jump is complete, falling down.
     */
    endJump() {
        if (this.reachedMinHeight && this.jumpVelocity < this.config.dropVelocity) {
            this.jumpVelocity = this.config.dropVelocity;
        }
    }
    /**
     * Update frame for a jump.
     */
    updateJump(deltaTime) {
        const msPerFrame = animFrames[this.status].msPerFrame;
        const framesElapsed = deltaTime / msPerFrame;
        // Speed drop makes Trex fall faster.
        if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity * this.config.speedDropCoefficient * framesElapsed);
        }
        else if (this.config.invertJump) {
            this.yPos -= Math.round(this.jumpVelocity * framesElapsed);
        }
        else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }
        this.jumpVelocity += this.config.gravity * framesElapsed;
        // Minimum height has been reached.
        if (this.config.invertJump && (this.yPos > this.minJumpHeight) ||
            !this.config.invertJump && (this.yPos < this.minJumpHeight) ||
            this.speedDrop) {
            this.reachedMinHeight = true;
        }
        // Reached max height.
        if (this.config.invertJump && (this.yPos > -this.config.maxJumpHeight) ||
            !this.config.invertJump && (this.yPos < this.config.maxJumpHeight) ||
            this.speedDrop) {
            this.endJump();
        }
        // Back down at ground level. Jump completed.
        if ((this.config.invertJump && (this.yPos < this.groundYPos)) ||
            (!this.config.invertJump && (this.yPos > this.groundYPos))) {
            this.reset();
            this.jumpCount++;
            if (this.resourceProvider.hasAudioCues) {
                const generatedSoundFx = this.resourceProvider.getGeneratedSoundFx();
                (0, shims_js_1.assert)(generatedSoundFx);
                generatedSoundFx.loopFootSteps();
            }
        }
    }
    /**
     * Set the speed drop. Immediately cancels the current jump.
     */
    setSpeedDrop() {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    }
    setDuck(isDucking) {
        if (isDucking && this.status !== Status.DUCKING) {
            this.update(0, Status.DUCKING);
            this.ducking = true;
        }
        else if (this.status === Status.DUCKING) {
            this.update(0, Status.RUNNING);
            this.ducking = false;
        }
    }
    /**
     * Reset the t-rex to running at start of game.
     */
    reset() {
        this.xPos = this.xInitialPos;
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Status.RUNNING);
        this.speedDrop = false;
        this.jumpCount = 0;
    }
    getCollisionBoxes() {
        return this.ducking ? collisionBoxes.ducking : collisionBoxes.running;
    }
}
exports.Trex = Trex;

};
modules["utils.js"]=function(require,exports,module){
"use strict";
// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomNum = getRandomNum;
exports.getTimeStamp = getTimeStamp;
const constants_js_1 = require("./constants.js");
function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Return the current timestamp.
 */
function getTimeStamp() {
    return constants_js_1.IS_IOS ? new Date().getTime() : performance.now();
}

};
modules['shims.js']=function(require,exports){exports.assert=v=>{if(!v)throw new Error('Dino assertion failed')};const values={dinoGameA11yAriaLabel:'Dino',dinoGameA11yDescription:'Press Space or tap Jump to play.',dinoGameA11yGameOver:'Game over',dinoGameA11yHighScore:'High score',dinoGameA11yJump:'Jump',dinoGameA11yStartGame:'Game started',dinoGameA11ySpeedToggle:'Slow mode'};exports.loadTimeData={valueExists:k=>Object.hasOwn(values,k),getString:k=>values[k]||'',getValue:k=>values[k]};};
modules['parent_constants.js']=function(require,exports){exports.HIDDEN_CLASS='hidden'};
function require(name){name=name.replace(/^\.\//,'');if(cache[name])return cache[name].exports;let m={exports:{}};cache[name]=m;if(!modules[name])throw Error('Missing module '+name);modules[name](require,m.exports,m);return m.exports;}
const Runner=require('offline.js').Runner;Runner.prototype.loadSounds=function(){};window.KhromiumDino=Runner;
window.addEventListener('load',()=>{try{window.runner=Runner.initializeInstance('#main-frame-error');document.getElementById('status').textContent='Tap Jump or press Space. Display refresh is limited on e-ink.';}catch(e){document.getElementById('status').textContent='Dino could not start: '+e.message;console.error(e)}});
})();
