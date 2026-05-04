import Phaser from 'phaser';
import { fishRarities, fishTypes, getFishById, type FishRarity, type FishType } from '../data/fish';
import { shipUpgradeDefinitions, type ShipUpgradeDefinition, type ShipUpgradeId } from '../data/shipUpgrades';
import { upgradeDefinitions, type UpgradeDefinition, type UpgradeId } from '../data/upgrades';
import {
  fishingZoneDefinitions,
  getFishingZoneDefinition,
  getZoneNamesForFish,
  type FishingZoneId,
} from '../data/zones';
import { createGameStateForPlatform, createPlatformProvider, type PlatformContext, type PlatformProvider } from '../platform/platformProvider';
import { createGameState, type GameState } from '../state/gameState';
import { LocalStorageSaveProvider } from '../save/localStorageSaveProvider';
import type { SaveProvider } from '../save/saveTypes';
import {
  getBetterLureLevel,
  getCargoCapacity,
  getUpgradeCost,
  getUpgradeLevel,
  buyUpgrade as buyPlayerUpgrade,
  canUpgrade,
} from '../systems/upgradeSystem';
import { addCatchToInventory, getInventoryByRarity } from '../systems/inventorySystem';
import { getCodexEntries, getCodexProgress, hasDiscoveredFish } from '../systems/codexSystem';
import {
  getCatchQuality,
  getDifficultyLabel,
  getFishForZone,
  getRarityWeights,
  isInSafeZone,
  pickFish,
  startFishingSession,
  updateFishingSession,
  widenActiveSafeZone,
} from '../systems/fishingSystem';
import {
  buyShipUpgrade as buySharedShipUpgrade,
  canBuyShipUpgrade,
  getShipUpgradeCost,
  getShipUpgradeLevel,
  isZoneUnlocked,
  switchFishingZone,
} from '../systems/shipSystem';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;
const METER_X = 430;
const METER_WIDTH = 420;
const SHIP_OUTER_WALK_RADIUS = 264;
const SHIP_INNER_WALK_RADIUS = 122;
const FISHING_EDGE_TOLERANCE = 14;
const HELP_SEEN_STORAGE_KEY = 'space-fishing-help-seen-v1';
const FISHING_TIPS_HIDDEN_STORAGE_KEY = 'space-fishing-tips-hidden-v1';
const FISHING_TIP_ATTEMPT_LIMIT = 3;
const FISHING_TIP_CATCH_LIMIT = 2;
const LEGENDARY_WARNING_DURATION_MS = 1600;
const audioKeys = [
  'ui_click',
  'panel_open',
  'panel_close',
  'cast',
  'bite',
  'catch_success',
  'fish_escape',
  'upgrade_purchase',
  'legendary_warning',
] as const;

const font = 'Inter, system-ui, sans-serif';
type ShipPanelKey = 'gear' | 'ship' | 'inventory' | 'codex' | 'scanner' | 'debug' | 'help';
type HelpLanguage = 'en' | 'sr';
type AudioKey = typeof audioKeys[number];

interface CodexEntryCard {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  metaText: Phaser.GameObjects.Text;
  flavorText: Phaser.GameObjects.Text;
}

interface ShipStationInteraction {
  x: number;
  y: number;
  label: string;
  onInteract: () => void;
  compact: boolean;
}

export class MainScene extends Phaser.Scene {
  private readonly platformProvider: PlatformProvider = createPlatformProvider();
  private platformContext: PlatformContext = this.platformProvider.getContext();
  private readonly saveProvider: SaveProvider = new LocalStorageSaveProvider();
  private gameState: GameState = createGameStateForPlatform(this.platformContext);
  private biteTimer?: Phaser.Time.TimerEvent;
  private legendaryWarningTimer?: Phaser.Time.TimerEvent;
  private isReeling = false;

  private stars!: Phaser.GameObjects.Group;
  private backgroundFish!: Phaser.GameObjects.Group;
  private poolGlow!: Phaser.GameObjects.Arc;
  private bobber!: Phaser.GameObjects.Arc;
  private fishShadow!: Phaser.GameObjects.Ellipse;
  private playerAvatar!: Phaser.GameObjects.Container;
  private interactionPrompt!: Phaser.GameObjects.Text;
  private platformDebugContainer!: Phaser.GameObjects.Container;
  private platformDebugBg!: Phaser.GameObjects.Rectangle;
  private platformDebugText!: Phaser.GameObjects.Text;
  private platformDebugCollapsed = false;

  private statusLabel!: Phaser.GameObjects.Text;
  private fishLabel!: Phaser.GameObjects.Text;
  private fishFlavorLabel!: Phaser.GameObjects.Text;
  private coinsLabel!: Phaser.GameObjects.Text;
  private inventoryLabel!: Phaser.GameObjects.Text;
  private zoneSummaryLabel!: Phaser.GameObjects.Text;
  private lastCatchLabel!: Phaser.GameObjects.Text;
  private lastCatchToast!: Phaser.GameObjects.Container;
  private codexToast!: Phaser.GameObjects.Container;
  private helpButton!: Phaser.GameObjects.Container;
  private audioToggleButton!: Phaser.GameObjects.Container;
  private audioToggleBg!: Phaser.GameObjects.Rectangle;
  private audioToggleText!: Phaser.GameObjects.Text;
  private helpControlsText!: Phaser.GameObjects.Text;
  private helpStationsText!: Phaser.GameObjects.Text;
  private helpPrototypeText!: Phaser.GameObjects.Text;
  private helpLanguage: HelpLanguage = 'en';
  private helpLanguageButtonBgs: Partial<Record<HelpLanguage, Phaser.GameObjects.Rectangle>> = {};
  private helpLanguageButtonTexts: Partial<Record<HelpLanguage, Phaser.GameObjects.Text>> = {};
  private tackleBoxLatestCatchText!: Phaser.GameObjects.Text;
  private castButton!: Phaser.GameObjects.Container;
  private castButtonBg!: Phaser.GameObjects.Rectangle;
  private castButtonText!: Phaser.GameObjects.Text;
  private resetSaveButton!: Phaser.GameObjects.Container;
  private resetSaveButtonBg!: Phaser.GameObjects.Rectangle;
  private resetSaveButtonText!: Phaser.GameObjects.Text;
  private inventoryPanelText!: Phaser.GameObjects.Text;
  private codexProgressText!: Phaser.GameObjects.Text;
  private codexRarityText!: Phaser.GameObjects.Text;
  private codexPageText!: Phaser.GameObjects.Text;
  private codexPrevButtonBg!: Phaser.GameObjects.Rectangle;
  private codexPrevButtonText!: Phaser.GameObjects.Text;
  private codexNextButtonBg!: Phaser.GameObjects.Rectangle;
  private codexNextButtonText!: Phaser.GameObjects.Text;
  private codexEntryCards: CodexEntryCard[] = [];
  private codexPage = 0;
  private shipInfoText!: Phaser.GameObjects.Text;
  private shipLogText!: Phaser.GameObjects.Text;
  private zoneInfoText!: Phaser.GameObjects.Text;
  private devRarityButton!: Phaser.GameObjects.Container;
  private devRarityButtonBg!: Phaser.GameObjects.Rectangle;
  private devRarityButtonText!: Phaser.GameObjects.Text;
  private legendaryBanner?: Phaser.GameObjects.Text;
  private legendaryWarningGlow?: Phaser.GameObjects.Arc;
  private isLegendaryWarningActive = false;
  private tensionSafeZone!: Phaser.GameObjects.Rectangle;
  private safeZoneLabel!: Phaser.GameObjects.Text;
  private tensionMarkerGlow!: Phaser.GameObjects.Rectangle;
  private tensionMarker!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private tensionValueLabel!: Phaser.GameObjects.Text;
  private progressValueLabel!: Phaser.GameObjects.Text;
  private warningLabel!: Phaser.GameObjects.Text;
  private fishingTipText!: Phaser.GameObjects.Text;
  private hideFishingTipsButton!: Phaser.GameObjects.Container;
  private meterObjects: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle> = [];
  private panelContainers: Partial<Record<ShipPanelKey, Phaser.GameObjects.Container>> = {};
  private activePanelKey: ShipPanelKey | null = null;
  private upgradeButtons: Partial<Record<UpgradeId, Phaser.GameObjects.Container>> = {};
  private upgradeButtonBgs: Partial<Record<UpgradeId, Phaser.GameObjects.Rectangle>> = {};
  private upgradeButtonTexts: Partial<Record<UpgradeId, Phaser.GameObjects.Text>> = {};
  private upgradeLevelTexts: Partial<Record<UpgradeId, Phaser.GameObjects.Text>> = {};
  private shipUpgradeButtonBgs: Partial<Record<ShipUpgradeId, Phaser.GameObjects.Rectangle>> = {};
  private shipUpgradeButtonTexts: Partial<Record<ShipUpgradeId, Phaser.GameObjects.Text>> = {};
  private shipUpgradeLevelTexts: Partial<Record<ShipUpgradeId, Phaser.GameObjects.Text>> = {};
  private zoneButtonBgs: Partial<Record<FishingZoneId, Phaser.GameObjects.Rectangle>> = {};
  private zoneButtonTexts: Partial<Record<FishingZoneId, Phaser.GameObjects.Text>> = {};
  private forcedRarityMode: FishRarity | null = null;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private stationInteractions: ShipStationInteraction[] = [];
  private nearbyStation: ShipStationInteraction | null = null;
  private fishingHintAttempts = 0;
  private audioMuted = false;

  constructor() {
    super('MainScene');
  }

  preload() {
    audioKeys.forEach((key) => {
      this.load.audio(key, `${import.meta.env.BASE_URL}assets/audio/${key}.wav`);
    });
  }

  create() {
    const savedGame = this.saveProvider.load(this.platformContext);
    if (savedGame) {
      this.gameState = createGameState(savedGame.player, savedGame.ship);
      this.gameState.statusText = 'Save loaded';
    }

    this.createBackground();
    this.createStation();
    this.createFishingCharacters();
    this.createHud();
    this.registerInput();
    this.refreshHud();
    this.initializePlatformContext();
  }

  update(_time: number, delta: number) {
    this.animateAmbient(delta);
    this.updatePlayerMovement(delta / 1000);
    this.updateStationPrompt();

    if (this.gameState.activeFishing) {
      this.isReeling = this.input.activePointer.isDown || Boolean(this.spaceKey?.isDown);
      this.updateMiniGame(delta / 1000);
    }
  }

  private createBackground() {
    this.cameras.main.setBackgroundColor('#050713');

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x050713, 0x10163a, 0x121833, 0x050713, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.stars = this.add.group();
    this.backgroundFish = this.add.group();

    for (let index = 0; index < 150; index += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.8, 2.2),
        0xffffff,
        Phaser.Math.FloatBetween(0.22, 0.85),
      );
      star.setData('speed', Phaser.Math.FloatBetween(4, 14));
      this.stars.add(star);
    }

    for (let index = 0; index < 14; index += 1) {
      const fish = this.add.ellipse(
        Phaser.Math.Between(70, GAME_WIDTH - 70),
        Phaser.Math.Between(85, GAME_HEIGHT - 160),
        Phaser.Math.Between(34, 78),
        Phaser.Math.Between(12, 24),
        fishTypes[index % fishTypes.length].color,
        0.16,
      );
      fish.setData('speed', Phaser.Math.FloatBetween(10, 30));
      fish.setData('offset', Phaser.Math.FloatBetween(0, Math.PI * 2));
      this.backgroundFish.add(fish);
    }
  }

  private createStation() {
    this.add.circle(CENTER_X, CENTER_Y, 286, 0x101a35, 0.9);
    this.add.circle(CENTER_X, CENTER_Y, 252, 0x1d3152, 0.95);
    this.add.circle(CENTER_X, CENTER_Y, 218, 0x0f1d34, 0.98);

    for (let index = 0; index < 16; index += 1) {
      const angle = (Math.PI * 2 * index) / 16;
      const x = CENTER_X + Math.cos(angle) * 264;
      const y = CENTER_Y + Math.sin(angle) * 264;
      this.add.circle(x, y, 9, 0x7df9ff, 0.24);
    }

    this.add.circle(CENTER_X, CENTER_Y, 116, 0x091222, 0.96);
    this.add.circle(CENTER_X, CENTER_Y, 96, 0x11365a, 0.76);
    this.poolGlow = this.add.circle(CENTER_X, CENTER_Y, 78, 0x7df9ff, 0.28);
    this.add.circle(CENTER_X, CENTER_Y, 44, 0xb8fff5, 0.32);

    this.tweens.add({
      targets: this.poolGlow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.42,
      duration: 2100,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createFishingCharacters() {
    this.bobber = this.add.circle(CENTER_X - 8, CENTER_Y + 18, 10, 0xff7b9c, 0.92);
    this.fishShadow = this.add.ellipse(CENTER_X + 36, CENTER_Y + 34, 82, 28, 0x7df9ff, 0.18);

    this.tweens.add({
      targets: [this.bobber, this.fishShadow],
      y: '+=8',
      duration: 1700,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createHud() {
    this.createPanel(28, 24, 276, 82);
    this.add.text(46, 40, 'Space Fishing', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '23px',
      fontStyle: '700',
    });
    this.statusLabel = this.add.text(47, 73, '', {
      color: '#c9d7ff',
      fontFamily: font,
      fontSize: '15px',
    });

    this.createPanel(968, 24, 284, 98);
    this.coinsLabel = this.add.text(988, 42, '', {
      color: '#ffd166',
      fontFamily: font,
      fontSize: '22px',
      fontStyle: '700',
    });
    this.inventoryLabel = this.add.text(989, 74, '', {
      color: '#c9d7ff',
      fontFamily: font,
      fontSize: '15px',
    });
    this.zoneSummaryLabel = this.add.text(989, 96, '', {
      color: '#9bdfff',
      fontFamily: font,
      fontSize: '14px',
      fontStyle: '700',
    });

    this.createLastCatchToast();
    this.createCodexToast();
    this.createHelpButton();
    this.createAudioToggleButton();
    this.createPlatformDebugOverlay();
    this.createShipStations();
    this.createPlayerAvatar();

    this.fishLabel = this.add.text(CENTER_X, 116, '', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '28px',
      fontStyle: '700',
      stroke: '#071022',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.fishFlavorLabel = this.add.text(CENTER_X, 152, '', {
      color: '#d8e8ff',
      fontFamily: font,
      fontSize: '16px',
      fontStyle: '600',
      align: 'center',
      stroke: '#071022',
      strokeThickness: 4,
      wordWrap: { width: 680 },
    }).setOrigin(0.5);

    this.warningLabel = this.add.text(CENTER_X, 496, '', {
      color: '#ff9fb1',
      fontFamily: font,
      fontSize: '23px',
      fontStyle: '700',
      stroke: '#071022',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.createMeters();
    this.createUpgradePanel();
    this.createShipPanel();
    this.createInventoryPanel();
    this.createCodexPanel();
    this.createScannerPanel();
    this.createDebugPanel();
    this.createHelpPanel();
    this.createCastButton();
    this.createInteractionPrompt();
    this.closePanel(false);
    this.openFirstLaunchHelp();
  }

  private createLastCatchToast() {
    const bg = this.add.rectangle(0, 0, 334, 106, 0x091226, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, 0x9ddcff, 0.32);
    const title = this.add.text(20, 16, 'Last Catch', {
      color: '#9bdfff',
      fontFamily: font,
      fontSize: '15px',
      fontStyle: '700',
    });
    this.lastCatchLabel = this.add.text(20, 42, '', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '15px',
      lineSpacing: 5,
      wordWrap: { width: 292 },
    });

    this.lastCatchToast = this.add.container(918, 144, [bg, title, this.lastCatchLabel]);
    this.lastCatchToast.setVisible(false);
    this.lastCatchToast.setDepth(12);
  }

  private createCodexToast() {
    const bg = this.add.rectangle(0, 0, 286, 70, 0x091226, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, 0xffd166, 0.42);
    const title = this.add.text(18, 14, 'New Codex Entry!', {
      color: '#ffd166',
      fontFamily: font,
      fontSize: '16px',
      fontStyle: '900',
    });
    const body = this.add.text(18, 40, '', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '13px',
      fontStyle: '700',
      wordWrap: { width: 248 },
    });

    this.codexToast = this.add.container(500, 36, [bg, title, body]);
    this.codexToast.setVisible(false);
    this.codexToast.setDepth(18);
  }

  private createHelpButton() {
    const bg = this.add.rectangle(0, 0, 74, 28, 0x233550, 0.9)
      .setStrokeStyle(1, 0x9ddcff, 0.34);
    const label = this.add.text(0, 0, '? Help', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '900',
    }).setOrigin(0.5);

    this.helpButton = this.add.container(354, 44, [bg, label]);
    this.helpButton.setSize(74, 28);
    this.helpButton.setDepth(10);
    this.helpButton.setInteractive({ useHandCursor: true });
    this.helpButton.on('pointerdown', () => {
      this.playSound('ui_click');
      this.openPanel('help');
    });
    this.helpButton.on('pointerover', () => bg.setFillStyle(0x2d466b, 0.96));
    this.helpButton.on('pointerout', () => bg.setFillStyle(0x233550, 0.9));
  }

  private createAudioToggleButton() {
    this.audioToggleBg = this.add.rectangle(0, 0, 78, 28, 0x233550, 0.9)
      .setStrokeStyle(1, 0x9ddcff, 0.34);
    this.audioToggleText = this.add.text(0, 0, '', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '900',
    }).setOrigin(0.5);

    this.audioToggleButton = this.add.container(442, 44, [this.audioToggleBg, this.audioToggleText]);
    this.audioToggleButton.setSize(78, 28);
    this.audioToggleButton.setDepth(10);
    this.audioToggleButton.setInteractive({ useHandCursor: true });
    this.audioToggleButton.on('pointerdown', () => {
      this.audioMuted = !this.audioMuted;
      this.refreshAudioToggleButton();
      this.playSound('ui_click');
    });
    this.audioToggleButton.on('pointerover', () => this.audioToggleBg.setFillStyle(0x2d466b, 0.96));
    this.audioToggleButton.on('pointerout', () => this.refreshAudioToggleButton());
    this.refreshAudioToggleButton();
  }

  private createPlatformDebugOverlay() {
    this.platformDebugBg = this.add.rectangle(0, 0, 306, 74, 0x050914, 0.72)
      .setOrigin(0)
      .setStrokeStyle(1, 0x7df9ff, 0.22);
    this.platformDebugText = this.add.text(10, 8, '', {
      color: '#b9cfff',
      fontFamily: font,
      fontSize: '10px',
      lineSpacing: 3,
    });

    this.platformDebugContainer = this.add.container(12, 634, [this.platformDebugBg, this.platformDebugText]);
    this.platformDebugContainer.setSize(306, 74);
    this.platformDebugContainer.setDepth(28);
    this.platformDebugContainer.setInteractive({ useHandCursor: true });
    this.platformDebugContainer.on('pointerdown', () => {
      this.platformDebugCollapsed = !this.platformDebugCollapsed;
      this.updatePlatformDebugOverlay();
    });
    this.updatePlatformDebugOverlay();
  }

  private createShipStations() {
    this.createStationButton(CENTER_X - 240, CENTER_Y - 50, 'Gear Bench', 'Player upgrades', () => this.openPanel('gear'), 0xffd166);
    this.createStationButton(CENTER_X + 228, CENTER_Y - 54, 'Reactor Console', 'Shared ship upgrades', () => this.openPanel('ship'), 0xff9fb1);
    this.createStationButton(CENTER_X - 190, CENTER_Y + 154, 'Tackle Box', 'Personal fish inventory', () => this.openPanel('inventory'), 0x8fffdc);
    this.createStationButton(CENTER_X + 12, CENTER_Y + 210, 'Codex', 'Research log', () => this.openPanel('codex'), 0xb8fff5);
    this.createStationButton(CENTER_X + 208, CENTER_Y + 152, 'Deep Space Scanner', 'Fishing zones', () => this.openPanel('scanner'), 0xb7a4ff);
    this.createStationButton(CENTER_X - 96, CENTER_Y + 236, 'DEV', 'Testing tools', () => this.openPanel('debug'), 0xffd166, true);
  }

  private createStationButton(
    x: number,
    y: number,
    labelText: string,
    description: string,
    onClick: () => void,
    color: number,
    compact = false,
  ) {
    const radius = compact ? 24 : 34;
    const glow = this.add.circle(0, 0, radius + 9, color, 0.13);
    const orb = this.add.circle(0, 0, radius, color, 0.26)
      .setStrokeStyle(2, color, 0.58);
    const label = this.add.text(0, compact ? 0 : 48, labelText, {
      align: 'center',
      color: compact ? '#ffd166' : '#eef6ff',
      fontFamily: font,
      fontSize: compact ? '12px' : '13px',
      fontStyle: '800',
      stroke: '#071022',
      strokeThickness: 4,
      wordWrap: { width: compact ? 70 : 128 },
    }).setOrigin(0.5);
    const hint = compact ? undefined : this.add.text(0, 68, description, {
      align: 'center',
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '10px',
      stroke: '#071022',
      strokeThickness: 3,
      wordWrap: { width: 150 },
    }).setOrigin(0.5);
    const children = hint ? [glow, orb, label, hint] : [glow, orb, label];
    const station = this.add.container(x, y, children);
    station.setSize(compact ? 86 : 160, compact ? 58 : 112);
    station.setInteractive({ useHandCursor: true });
    station.on('pointerdown', () => {
      this.playSound('ui_click');
      onClick();
    });
    station.on('pointerover', () => {
      orb.setFillStyle(color, 0.44);
      glow.setAlpha(0.28);
    });
    station.on('pointerout', () => {
      orb.setFillStyle(color, 0.26);
      glow.setAlpha(0.13);
    });

    this.stationInteractions.push({
      x,
      y,
      label: labelText,
      onInteract: onClick,
      compact,
    });
  }

  private createPlayerAvatar() {
    const shadow = this.add.ellipse(0, 13, 32, 12, 0x030713, 0.36);
    const glow = this.add.circle(0, 0, 20, 0x7df9ff, 0.18);
    const body = this.add.circle(0, 0, 12, 0xf4f7ff, 0.98)
      .setStrokeStyle(2, 0x8ae8ff, 0.88);
    const visor = this.add.rectangle(0, -3, 17, 6, 0x102846, 0.9)
      .setStrokeStyle(1, 0x9bdfff, 0.75);

    this.playerAvatar = this.add.container(CENTER_X, CENTER_Y - 168, [shadow, glow, body, visor]);
    this.playerAvatar.setDepth(9);
  }

  private createInteractionPrompt() {
    this.interactionPrompt = this.add.text(CENTER_X, 646, '', {
      align: 'center',
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '15px',
      fontStyle: '800',
      stroke: '#071022',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.interactionPrompt.setDepth(11);
    this.interactionPrompt.setVisible(false);
  }

  private createModalPanel(key: ShipPanelKey, titleText: string, x: number, y: number, width: number, height: number) {
    const bg = this.add.rectangle(0, 0, width, height, 0x091226, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, 0x9ddcff, 0.42);
    const title = this.add.text(22, 18, titleText, {
      color: '#9bdfff',
      fontFamily: font,
      fontSize: '19px',
      fontStyle: '800',
    });
    const closeBg = this.add.rectangle(0, 0, 30, 30, 0x233550, 0.94)
      .setStrokeStyle(1, 0x9ddcff, 0.26);
    const closeText = this.add.text(0, -1, 'X', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '15px',
      fontStyle: '900',
    }).setOrigin(0.5);
    const closeButton = this.add.container(0, 0, [closeBg, closeText]);
    closeButton.setSize(44, 44);
    closeButton.setPosition(width - 28, 28);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.closePanel());

    const panel = this.add.container(x, y, [bg, title, closeButton]);
    panel.setDepth(30);
    panel.setVisible(false);
    this.panelContainers[key] = panel;

    return panel;
  }

  private createSmallModalButton(x: number, y: number, width: number, height: number, text: string, onClick: () => void) {
    const bg = this.add.rectangle(0, 0, width, height, 0x233550, 0.94)
      .setStrokeStyle(1, 0x9ddcff, 0.28);
    const label = this.add.text(0, 0, text, {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '800',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.playSound('ui_click');
      onClick();
    });

    return { container, bg, label };
  }

  private openPanel(key: ShipPanelKey) {
    if (this.activePanelKey !== key) {
      this.playSound('panel_open');
    }

    (Object.keys(this.panelContainers) as ShipPanelKey[]).forEach((panelKey) => {
      this.panelContainers[panelKey]?.setVisible(panelKey === key);
    });
    this.activePanelKey = key;
  }

  private closePanel(playAudio = true) {
    const hadPanel = Boolean(this.activePanelKey);

    if (this.activePanelKey === 'help') {
      this.markHelpSeen();
    }

    (Object.keys(this.panelContainers) as ShipPanelKey[]).forEach((panelKey) => {
      this.panelContainers[panelKey]?.setVisible(false);
    });
    this.activePanelKey = null;
    if (playAudio && hadPanel) {
      this.playSound('panel_close');
    }
  }

  private createMeters() {
    const tensionLabel = this.add.text(362, 580, 'Tension', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '18px',
      fontStyle: '700',
    }).setOrigin(0, 0.5);
    const tensionBg = this.add.rectangle(CENTER_X, 580, METER_WIDTH, 24, 0x071024, 0.86)
      .setStrokeStyle(1, 0x9ddcff, 0.2);
    this.tensionSafeZone = this.add.rectangle(CENTER_X, 580, 100, 24, 0xff6b8a, 0.48)
      .setStrokeStyle(1, 0xffb3c2, 0.42);
    this.safeZoneLabel = this.add.text(CENTER_X, 552, 'Safe zone', {
      color: '#ffb3c2',
      fontFamily: font,
      fontSize: '13px',
      fontStyle: '700',
      stroke: '#071022',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.tensionMarkerGlow = this.add.rectangle(METER_X, 580, 18, 48, 0x7df9ff, 0.22);
    this.tensionMarker = this.add.rectangle(METER_X, 580, 10, 42, 0x7df9ff, 0.98)
      .setStrokeStyle(2, 0xeef6ff, 0.9);
    this.tensionValueLabel = this.add.text(872, 580, '0%', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '18px',
      fontStyle: '700',
    }).setOrigin(0, 0.5);

    const catchLabel = this.add.text(362, 618, 'Catch', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '18px',
      fontStyle: '700',
    }).setOrigin(0, 0.5);
    const catchBg = this.add.rectangle(CENTER_X, 618, METER_WIDTH, 24, 0x071024, 0.86)
      .setStrokeStyle(1, 0x9ddcff, 0.2);
    this.progressFill = this.add.rectangle(METER_X, 618, 1, 18, 0xffd166, 0.95).setOrigin(0, 0.5);
    this.progressValueLabel = this.add.text(872, 618, '0%', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '18px',
      fontStyle: '700',
    }).setOrigin(0, 0.5);
    this.fishingTipText = this.add.text(CENTER_X, 528, this.getFishingTipText(), {
      align: 'center',
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '14px',
      fontStyle: '700',
      stroke: '#071022',
      strokeThickness: 4,
      wordWrap: { width: 620 },
    }).setOrigin(0.5);
    this.hideFishingTipsButton = this.createFishingTipsHideButton();

    this.meterObjects = [
      tensionLabel,
      tensionBg,
      this.tensionSafeZone,
      this.safeZoneLabel,
      this.tensionMarkerGlow,
      this.tensionMarker,
      this.tensionValueLabel,
      catchLabel,
      catchBg,
      this.progressFill,
      this.progressValueLabel,
      this.fishingTipText,
    ];

    this.resetMeters();

    this.tweens.add({
      targets: this.tensionSafeZone,
      alpha: 0.68,
      duration: 920,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createFishingTipsHideButton() {
    const bg = this.add.rectangle(0, 0, 76, 24, 0x233550, 0.88)
      .setStrokeStyle(1, 0x9ddcff, 0.24);
    const label = this.add.text(0, 0, 'Hide tips', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '11px',
      fontStyle: '800',
    }).setOrigin(0.5);
    const button = this.add.container(950, 528, [bg, label]);
    button.setSize(76, 24);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.hideFishingTips());

    return button;
  }

  private createCastButton() {
    this.castButtonBg = this.add.rectangle(0, 0, 208, 56, 0x7df9ff, 0.95);
    this.castButtonText = this.add.text(0, 0, 'Cast', {
      color: '#061022',
      fontFamily: font,
      fontSize: '24px',
      fontStyle: '800',
    }).setOrigin(0.5);

    this.castButton = this.add.container(CENTER_X, 674, [this.castButtonBg, this.castButtonText]);
    this.castButton.setSize(208, 56);
    this.castButton.setInteractive({ useHandCursor: true });
    this.castButton.on('pointerdown', () => {
      if (this.gameState.castState === 'reeling') {
        this.isReeling = true;
        return;
      }

      this.startCast();
    });
    this.castButton.on('pointerover', () => this.castButtonBg.setFillStyle(0xffd166, 0.98));
    this.castButton.on('pointerout', () => this.refreshCastButton());
  }

  private createInventoryPanel() {
    const panel = this.createModalPanel('inventory', 'Tackle Box', 846, 154, 384, 430);
    this.tackleBoxLatestCatchText = this.add.text(24, 62, '', {
      color: '#ffd166',
      fontFamily: font,
      fontSize: '13px',
      fontStyle: '700',
      lineSpacing: 4,
      wordWrap: { width: 336 },
    });
    this.inventoryPanelText = this.add.text(24, 132, '', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '14px',
      lineSpacing: 5,
      wordWrap: { width: 336 },
    });
    panel.add([this.tackleBoxLatestCatchText, this.inventoryPanelText]);
  }

  private createCodexPanel() {
    const panel = this.createModalPanel('codex', 'My Fish Codex', 430, 46, 436, 628);
    const subtitle = this.add.text(24, 58, 'Personal research log', {
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '700',
    });
    this.codexProgressText = this.add.text(24, 80, '', {
      color: '#ffd166',
      fontFamily: font,
      fontSize: '14px',
      fontStyle: '800',
    });
    this.codexRarityText = this.add.text(24, 104, '', {
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '10px',
      wordWrap: { width: 372 },
    });

    for (let index = 0; index < 4; index += 1) {
      const y = 146 + index * 96;
      const bg = this.add.rectangle(0, 0, 388, 84, 0x101a35, 0.88)
        .setOrigin(0)
        .setStrokeStyle(1, 0x9ddcff, 0.22);
      const nameText = this.add.text(14, 10, '', {
        color: '#eef6ff',
        fontFamily: font,
        fontSize: '15px',
        fontStyle: '800',
        wordWrap: { width: 240 },
      });
      const metaText = this.add.text(286, 12, '', {
        align: 'right',
        color: '#ffd166',
        fontFamily: font,
        fontSize: '11px',
        fontStyle: '800',
        wordWrap: { width: 86 },
      });
      const flavorText = this.add.text(14, 36, '', {
        color: '#c9d7ff',
        fontFamily: font,
        fontSize: '11px',
        lineSpacing: 2,
        wordWrap: { width: 356 },
      });
      const container = this.add.container(24, y, [bg, nameText, metaText, flavorText]);

      this.codexEntryCards.push({ container, bg, nameText, metaText, flavorText });
      panel.add(container);
    }

    const prevButton = this.createSmallModalButton(104, 558, 94, 30, 'Prev', () => {
      this.codexPage = Math.max(0, this.codexPage - 1);
      this.refreshCodexPanel();
    });
    this.codexPrevButtonBg = prevButton.bg;
    this.codexPrevButtonText = prevButton.label;
    this.codexPageText = this.add.text(218, 558, '', {
      align: 'center',
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '800',
    }).setOrigin(0.5);
    const nextButton = this.createSmallModalButton(332, 558, 94, 30, 'Next', () => {
      const maxPage = this.getCodexMaxPage();
      this.codexPage = Math.min(maxPage, this.codexPage + 1);
      this.refreshCodexPanel();
    });
    this.codexNextButtonBg = nextButton.bg;
    this.codexNextButtonText = nextButton.label;

    panel.add([subtitle, this.codexProgressText, this.codexRarityText, prevButton.container, this.codexPageText, nextButton.container]);
  }

  private createShipPanel() {
    const panel = this.createModalPanel('ship', 'Reactor Console', 42, 146, 392, 360);
    this.shipInfoText = this.add.text(24, 62, '', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '14px',
      lineSpacing: 3,
      wordWrap: { width: 330 },
    });
    this.shipLogText = this.add.text(24, 112, '', {
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '12px',
      wordWrap: { width: 330 },
    });
    panel.add([this.shipInfoText, this.shipLogText]);

    shipUpgradeDefinitions.forEach((definition, index) => {
      const y = 174 + index * 54;
      const name = this.add.text(24, y - 18, definition.name, {
        color: '#eef6ff',
        fontFamily: font,
        fontSize: '15px',
        fontStyle: '700',
      });
      const effect = this.add.text(24, y + 2, definition.effectDescription, {
        color: '#aebbd8',
        fontFamily: font,
        fontSize: '11px',
        wordWrap: { width: 214 },
      });
      this.shipUpgradeLevelTexts[definition.id] = this.add.text(220, y - 18, '', {
        color: '#ffd166',
        fontFamily: font,
        fontSize: '13px',
        fontStyle: '700',
      });

      const bg = this.add.rectangle(0, 0, 84, 32, 0x7df9ff, 0.95);
      const label = this.add.text(0, 0, '', {
        color: '#061022',
        fontFamily: font,
        fontSize: '12px',
        fontStyle: '800',
      }).setOrigin(0.5);
      const button = this.add.container(328, y, [bg, label]);
      button.setSize(84, 32);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.buyShipUpgrade(definition));

      this.shipUpgradeButtonBgs[definition.id] = bg;
      this.shipUpgradeButtonTexts[definition.id] = label;
      panel.add([name, effect, this.shipUpgradeLevelTexts[definition.id]!, button]);
    });
  }

  private createScannerPanel() {
    const panel = this.createModalPanel('scanner', 'Deep Space Scanner', 846, 142, 384, 310);
    this.zoneInfoText = this.add.text(24, 66, '', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '14px',
      lineSpacing: 4,
      wordWrap: { width: 326 },
    });
    panel.add(this.zoneInfoText);

    fishingZoneDefinitions.forEach((zone, index) => {
      const bg = this.add.rectangle(0, 0, 150, 36, 0x233550, 0.92)
        .setStrokeStyle(1, 0x9ddcff, 0.24);
      const label = this.add.text(0, 0, zone.name, {
        color: '#d9ecff',
        fontFamily: font,
        fontSize: '12px',
        fontStyle: '800',
      }).setOrigin(0.5);
      const button = this.add.container(100 + index * 164, 238, [bg, label]);
      button.setSize(150, 36);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.switchZone(zone.id));

      this.zoneButtonBgs[zone.id] = bg;
      this.zoneButtonTexts[zone.id] = label;
      panel.add(button);
    });
  }

  private createUpgradePanel() {
    const panel = this.createModalPanel('gear', 'Gear Bench', 42, 146, 392, 300);

    upgradeDefinitions.forEach((definition, index) => {
      const y = 84 + index * 66;
      const name = this.add.text(24, y - 18, definition.name, {
        color: '#eef6ff',
        fontFamily: font,
        fontSize: '17px',
        fontStyle: '700',
      });
      const description = this.add.text(24, y + 4, definition.description, {
        color: '#aebbd8',
        fontFamily: font,
        fontSize: '13px',
      });

      this.upgradeLevelTexts[definition.id] = this.add.text(214, y - 18, '', {
        color: '#ffd166',
        fontFamily: font,
        fontSize: '14px',
        fontStyle: '700',
      });

      const bg = this.add.rectangle(0, 0, 82, 34, 0x7df9ff, 0.95);
      const label = this.add.text(0, 0, '', {
        color: '#061022',
        fontFamily: font,
        fontSize: '13px',
        fontStyle: '800',
      }).setOrigin(0.5);
      const button = this.add.container(320, y, [bg, label]);
      button.setSize(82, 34);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.buyUpgrade(definition));

      this.upgradeButtons[definition.id] = button;
      this.upgradeButtonBgs[definition.id] = bg;
      this.upgradeButtonTexts[definition.id] = label;
      panel.add([name, description, this.upgradeLevelTexts[definition.id]!, button]);
    });
  }

  private createDebugPanel() {
    const panel = this.createModalPanel('debug', 'Dev / Test Tools', 42, 454, 350, 178);
    const note = this.add.text(22, 60, 'Development-only controls hidden from the main ship view.', {
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '12px',
      wordWrap: { width: 296 },
    });

    this.devRarityButtonBg = this.add.rectangle(0, 0, 210, 34, 0x233550, 0.92)
      .setStrokeStyle(1, 0xffd166, 0.42);
    this.devRarityButtonText = this.add.text(0, 0, '', {
      color: '#ffd166',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '800',
    }).setOrigin(0.5);
    this.devRarityButton = this.add.container(128, 110, [this.devRarityButtonBg, this.devRarityButtonText]);
    this.devRarityButton.setSize(210, 34);
    this.devRarityButton.setInteractive({ useHandCursor: true });
    this.devRarityButton.on('pointerdown', () => {
      this.cycleForcedRarity();
      this.refreshHud();
    });

    this.resetSaveButtonBg = this.add.rectangle(0, 0, 116, 32, 0x233550, 0.92)
      .setStrokeStyle(1, 0xff9fb1, 0.42);
    this.resetSaveButtonText = this.add.text(0, 0, 'Reset Save', {
      color: '#ffcfda',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '800',
    }).setOrigin(0.5);
    this.resetSaveButton = this.add.container(280, 110, [this.resetSaveButtonBg, this.resetSaveButtonText]);
    this.resetSaveButton.setSize(116, 32);
    this.resetSaveButton.setInteractive({ useHandCursor: true });
    this.resetSaveButton.on('pointerdown', () => this.resetSave());

    panel.add([note, this.devRarityButton, this.resetSaveButton]);
  }

  private createHelpPanel() {
    const panel = this.createModalPanel('help', 'Help / Controls', 380, 58, 520, 596);
    const englishButton = this.createHelpLanguageButton(358, 33, 'EN', 'en');
    const serbianButton = this.createHelpLanguageButton(408, 33, 'SR', 'sr');

    this.helpControlsText = this.add.text(24, 72, '', {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '14px',
      lineSpacing: 8,
      wordWrap: { width: 462 },
    });

    this.helpStationsText = this.add.text(24, 264, '', {
      color: '#eef6ff',
      fontFamily: font,
      fontSize: '14px',
      lineSpacing: 8,
      wordWrap: { width: 462 },
    });

    this.helpPrototypeText = this.add.text(24, 432, '', {
      color: '#aebbd8',
      fontFamily: font,
      fontSize: '13px',
      lineSpacing: 7,
      wordWrap: { width: 462 },
    });

    const gotIt = this.createSmallModalButton(422, 548, 76, 34, 'Got it', () => this.closePanel());

    panel.add([
      englishButton.container,
      serbianButton.container,
      this.helpControlsText,
      this.helpStationsText,
      this.helpPrototypeText,
      gotIt.container,
    ]);
    this.setHelpLanguage('en');
  }

  private createHelpLanguageButton(x: number, y: number, labelText: string, language: HelpLanguage) {
    const bg = this.add.rectangle(0, 0, 42, 26, 0x233550, 0.92)
      .setStrokeStyle(1, 0x9ddcff, 0.24);
    const label = this.add.text(0, 0, labelText, {
      color: '#d9ecff',
      fontFamily: font,
      fontSize: '12px',
      fontStyle: '900',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, label]);
    container.setSize(42, 26);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.playSound('ui_click');
      this.setHelpLanguage(language);
    });

    this.helpLanguageButtonBgs[language] = bg;
    this.helpLanguageButtonTexts[language] = label;

    return { container, bg, label };
  }

  private setHelpLanguage(language: HelpLanguage) {
    this.helpLanguage = language;
    const copy = this.getHelpCopy(language);
    this.helpControlsText.setText(copy.controls.join('\n'));
    this.helpStationsText.setText(copy.stations.join('\n'));
    this.helpPrototypeText.setText(copy.prototype.join('\n'));

    (['en', 'sr'] as HelpLanguage[]).forEach((buttonLanguage) => {
      const selected = buttonLanguage === language;
      this.helpLanguageButtonBgs[buttonLanguage]?.setFillStyle(selected ? 0x7df9ff : 0x233550, selected ? 0.95 : 0.92);
      this.helpLanguageButtonTexts[buttonLanguage]?.setColor(selected ? '#061022' : '#d9ecff');
    });
  }

  private getHelpCopy(language: HelpLanguage) {
    if (language === 'sr') {
      return {
        controls: [
          'Kontrole',
          '',
          'WASD / strelice: kretanje po brodu',
          'E: interakcija sa stanicama / zabacivanje kod rupe za pecanje',
          'Space ili miš: drži zategnutost strune tokom pecanja',
          'Priđi unutrašnjoj ivici rupe za pecanje da bi mogao da zabaciš',
        ],
        stations: [
          'Stanice',
          '',
          'Gear Bench: unapređenja opreme',
          'Reactor: unapređenja broda',
          'Scanner: zone za pecanje',
          'Tackle Box: lični inventar riba',
          'Codex: dnevnik otkrivenih riba',
        ],
        prototype: [
          'Napomene za prototip',
          '',
          'Čuvanje je trenutno samo lokalno.',
          'Vizuali su privremeni.',
          'Ekonomija je privremena.',
          'Mobilne/touch kontrole još nisu potpuno podržane.',
          'Discord/multiplayer još nije implementiran.',
        ],
      };
    }

    return {
      controls: [
        'Controls',
        '',
        'WASD / Arrow Keys: move around the ship',
        'E: interact with stations / cast at the fishing hole',
        'Space or Mouse: hold fishing tension during the minigame',
        'Walk to the inner edge of the fishing hole to cast',
      ],
      stations: [
        'Stations',
        '',
        'Gear Bench: player upgrades',
        'Reactor: ship upgrades',
        'Scanner: zones',
        'Tackle Box: personal fish inventory',
        'Codex: discovered fish log',
      ],
      prototype: [
        'Prototype Notes',
        '',
        'Local save only.',
        'Visuals are placeholder.',
        'Economy is temporary.',
        'Mobile/touch controls are not fully supported yet.',
        'Discord/multiplayer is not implemented yet.',
      ],
    };
  }

  private openFirstLaunchHelp() {
    if (window.localStorage.getItem(HELP_SEEN_STORAGE_KEY) === 'true') {
      return;
    }

    this.openPanel('help');
  }

  private markHelpSeen() {
    window.localStorage.setItem(HELP_SEEN_STORAGE_KEY, 'true');
  }

  private createPanel(x: number, y: number, width: number, height: number) {
    this.add.rectangle(x, y, width, height, 0x091226, 0.76)
      .setOrigin(0)
      .setStrokeStyle(1, 0x9ddcff, 0.24);
  }

  private playSound(key: AudioKey, config: Phaser.Types.Sound.SoundConfig = {}) {
    if (this.audioMuted || !this.cache.audio.exists(key)) {
      return;
    }

    try {
      this.sound.play(key, {
        volume: 0.35,
        ...config,
      });
    } catch {
      // Placeholder audio should never block gameplay if browser audio is locked or a file is missing.
    }
  }

  private async initializePlatformContext() {
    this.platformContext = this.platformProvider.getContext();
    this.updatePlatformDebugOverlay();
    this.platformContext = await this.platformProvider.initialize();
    this.updatePlatformDebugOverlay();
  }

  private updatePlatformDebugOverlay() {
    if (!this.platformDebugText || !this.platformDebugBg) {
      return;
    }

    const player = `${this.platformContext.playerName} (${this.platformContext.playerId})`;
    const guild = this.platformContext.guildId ?? this.platformContext.serverId;
    const ready = this.platformContext.discordReadyStatus;
    const error = this.platformContext.discordError ? `\n${this.truncateDebugValue(this.platformContext.discordError)}` : '';
    const text = this.platformDebugCollapsed
      ? `Platform: ${this.platformContext.platform} / ${ready}`
      : [
        'TEMP PLATFORM DEBUG',
        `platform: ${this.platformContext.platform} / ready: ${ready}`,
        `player: ${this.truncateDebugValue(player)}`,
        `server/guild: ${this.truncateDebugValue(guild)}`,
        `channel: ${this.platformContext.channelId ?? 'n/a'}`,
      ].join('\n') + error;

    this.platformDebugText.setText(text);
    this.platformDebugBg.setDisplaySize(this.platformDebugCollapsed ? 210 : 306, this.platformDebugCollapsed ? 28 : 74);
    this.platformDebugContainer.setSize(this.platformDebugCollapsed ? 210 : 306, this.platformDebugCollapsed ? 28 : 74);
  }

  private truncateDebugValue(value: string) {
    return value.length > 36 ? `${value.slice(0, 33)}...` : value;
  }

  private refreshAudioToggleButton() {
    this.audioToggleBg.setFillStyle(this.audioMuted ? 0x233550 : 0x7df9ff, this.audioMuted ? 0.9 : 0.95);
    this.audioToggleText.setColor(this.audioMuted ? '#d9ecff' : '#061022');
    this.audioToggleText.setText(this.audioMuted ? 'Muted' : 'Sound');
  }

  private registerInput() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.moveKeys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key> | undefined;
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState.castState !== 'reeling') {
        return;
      }

      this.isReeling = true;
    });

    this.input.on('pointerup', () => {
      this.isReeling = false;
    });

    this.input.keyboard?.on('keydown-L', () => {
      this.forcedRarityMode = 'Legendary';
      this.gameState.statusText = 'DEV TEST: all hooked fish forced to Legendary';
      this.refreshHud();
    });

    this.input.keyboard?.on('keydown-E', () => {
      if (this.activePanelKey) {
        return;
      }

      if (this.isTouchingFishingEdge()) {
        this.startCast();
        return;
      }

      this.nearbyStation?.onInteract();
    });

    window.addEventListener('blur', () => {
      this.isReeling = false;
    });

    window.addEventListener('pagehide', () => {
      this.saveProgress();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveProgress();
      }
    });
  }

  private updatePlayerMovement(delta: number) {
    if (!this.playerAvatar || this.activePanelKey || this.isFishingMovementLocked()) {
      return;
    }

    const left = this.cursors?.left?.isDown || this.moveKeys?.a.isDown;
    const right = this.cursors?.right?.isDown || this.moveKeys?.d.isDown;
    const up = this.cursors?.up?.isDown || this.moveKeys?.w.isDown;
    const down = this.cursors?.down?.isDown || this.moveKeys?.s.isDown;
    const moveX = Number(Boolean(right)) - Number(Boolean(left));
    const moveY = Number(Boolean(down)) - Number(Boolean(up));

    if (moveX === 0 && moveY === 0) {
      return;
    }

    const direction = new Phaser.Math.Vector2(moveX, moveY).normalize();
    this.playerAvatar.x += direction.x * 210 * delta;
    this.playerAvatar.y += direction.y * 210 * delta;
    this.constrainPlayerToShip();
  }

  private constrainPlayerToShip() {
    const offsetX = this.playerAvatar.x - CENTER_X;
    const offsetY = this.playerAvatar.y - CENTER_Y;
    const distance = Math.hypot(offsetX, offsetY);

    if (distance > SHIP_OUTER_WALK_RADIUS) {
      const scale = SHIP_OUTER_WALK_RADIUS / distance;
      this.playerAvatar.x = CENTER_X + offsetX * scale;
      this.playerAvatar.y = CENTER_Y + offsetY * scale;
      return;
    }

    if (distance < SHIP_INNER_WALK_RADIUS) {
      const fallbackX = offsetX === 0 && offsetY === 0 ? 0 : offsetX;
      const fallbackY = offsetX === 0 && offsetY === 0 ? -1 : offsetY;
      const fallbackDistance = Math.hypot(fallbackX, fallbackY);
      const scale = SHIP_INNER_WALK_RADIUS / fallbackDistance;
      this.playerAvatar.x = CENTER_X + fallbackX * scale;
      this.playerAvatar.y = CENTER_Y + fallbackY * scale;
    }
  }

  private updateStationPrompt() {
    if (!this.interactionPrompt || !this.playerAvatar) {
      return;
    }

    this.nearbyStation = this.getNearbyStation();
    const canShowPrompt = (Boolean(this.nearbyStation) || this.isTouchingFishingEdge()) && !this.activePanelKey;
    this.interactionPrompt.setVisible(canShowPrompt);
    this.interactionPrompt.setText(this.getInteractionPromptText());
    this.refreshCastButton();
  }

  private getNearbyStation() {
    const nearbyStations = this.stationInteractions
      .map((station) => ({
        station,
        distance: Phaser.Math.Distance.Between(
          this.playerAvatar.x,
          this.playerAvatar.y,
          station.x,
          station.y,
        ),
      }))
      .filter(({ station, distance }) => distance <= (station.compact ? 66 : 92))
      .sort((left, right) => left.distance - right.distance);

    return nearbyStations[0]?.station ?? null;
  }

  private getPlayerDistanceFromShipCenter() {
    return Phaser.Math.Distance.Between(
      this.playerAvatar.x,
      this.playerAvatar.y,
      CENTER_X,
      CENTER_Y,
    );
  }

  private isTouchingFishingEdge() {
    return Math.abs(this.getPlayerDistanceFromShipCenter() - SHIP_INNER_WALK_RADIUS) <= FISHING_EDGE_TOLERANCE;
  }

  private isFishingMovementLocked() {
    return this.gameState.castState === 'waiting' || this.gameState.castState === 'reeling';
  }

  private getInteractionPromptText() {
    if (this.isTouchingFishingEdge()) {
      return this.gameState.castState === 'ready' || this.gameState.castState === 'result'
        ? 'Press E to Cast'
        : 'Fishing in progress';
    }

    if (!this.nearbyStation) {
      return '';
    }

    return `Press E to open ${this.nearbyStation.label}`;
  }

  private startCast() {
    if (this.gameState.castState !== 'ready' && this.gameState.castState !== 'result') {
      return;
    }

    if (!this.isTouchingFishingEdge()) {
      this.gameState.statusText = 'Move near the Fishing Hole to cast';
      this.refreshHud();
      return;
    }

    this.closePanel();
    this.playSound('cast', { volume: 0.28 });
    this.gameState.castState = 'waiting';
    this.gameState.statusText = 'Waiting for bite...';
    this.warningLabel.setText('');
    this.refreshHud();

    this.tweens.add({
      targets: this.bobber,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 420,
      yoyo: true,
      ease: 'Sine.inOut',
    });

    this.biteTimer?.remove();
    this.biteTimer = this.time.delayedCall(Phaser.Math.Between(1000, 4000), () => {
      this.startMiniGame(this.pickNextFish());
    });
  }

  private startMiniGame(fish: FishType) {
    if (fish.rarity === 'Legendary') {
      this.startLegendaryWarning(fish);
      return;
    }

    this.beginFishingFight(fish);
  }

  private startLegendaryWarning(fish: FishType) {
    this.gameState.castState = 'reeling';
    this.gameState.statusText = 'Something massive is pulling...';
    this.gameState.activeFishing = null;
    this.isReeling = false;
    this.isLegendaryWarningActive = true;
    this.playSound('legendary_warning', { volume: 0.42 });

    this.resetMeters();
    this.fishLabel.setText('Legendary presence detected...');
    this.fishFlavorLabel.setText('Something massive is pulling...');
    this.warningLabel.setText('Brace yourself.');
    this.warningLabel.setVisible(true);
    this.fishShadow.setFillStyle(fish.color, 0.26);
    this.fishShadow.setScale(1.36);
    this.showLegendaryWarningEffects(fish);
    this.refreshHud();

    this.legendaryWarningTimer?.remove();
    this.legendaryWarningTimer = this.time.delayedCall(LEGENDARY_WARNING_DURATION_MS, () => {
      this.legendaryWarningTimer = undefined;
      this.beginFishingFight(fish);
    });
  }

  private beginFishingFight(fish: FishType) {
    this.isLegendaryWarningActive = false;
    this.gameState.castState = 'reeling';
    this.gameState.statusText = fish.rarity === 'Legendary' ? 'Legendary bite! Hold to reel' : 'Bite! Hold to reel';
    this.gameState.activeFishing = startFishingSession(this.gameState.player, fish);
    this.fishingHintAttempts += 1;
    if (fish.rarity !== 'Legendary') {
      this.playSound('bite', { volume: 0.32 });
    }

    this.fishShadow.setFillStyle(fish.color, 0.34);
    this.fishShadow.setScale(1.24);
    this.updateMeters(this.gameState.activeFishing, fish, isInSafeZone(this.gameState.activeFishing), 'In the red zone');
    this.refreshHud();
  }

  private showLegendaryWarningEffects(fish: FishType) {
    this.legendaryWarningGlow?.destroy();
    this.legendaryWarningGlow = this.add.circle(CENTER_X, CENTER_Y, 76, fish.color, 0.22)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: this.legendaryWarningGlow,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: LEGENDARY_WARNING_DURATION_MS,
      ease: 'Sine.out',
      onComplete: () => {
        this.legendaryWarningGlow?.destroy();
        this.legendaryWarningGlow = undefined;
      },
    });

    this.tweens.add({
      targets: [this.poolGlow, this.bobber],
      scaleX: 1.72,
      scaleY: 1.72,
      duration: 260,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.inOut',
    });

    this.cameras.main.shake(520, 0.004);
  }

  private updateMiniGame(delta: number) {
    const session = this.gameState.activeFishing;
    if (!session) {
      return;
    }

    const fish = this.getActiveFish(session.fishId);
    if (!fish) {
      this.finishMiniGame(false, 'Fish escaped.');
      return;
    }

    const result = updateFishingSession(session, fish, this.isReeling, delta);
    this.updateMeters(result.session, fish, result.inSafeZone, result.warning);

    if (result.finished) {
      this.finishMiniGame(result.success, result.failedStatus);
    }
  }

  private updateMeters(session: NonNullable<GameState['activeFishing']>, fish: FishType, inSafeZone: boolean, warning: string) {
    const safeWidth = METER_WIDTH * (session.safeMax - session.safeMin);
    const safeX = METER_X + METER_WIDTH * session.safeMin + safeWidth / 2;
    const markerX = METER_X + METER_WIDTH * session.tension;
    const progressWidth = Math.max(1, METER_WIDTH * session.progress);

    this.tensionSafeZone.setPosition(safeX, 580);
    this.tensionSafeZone.setDisplaySize(safeWidth, 24);
    this.safeZoneLabel.setPosition(safeX, 552);
    this.safeZoneLabel.setVisible(true);
    this.tensionMarkerGlow.setPosition(markerX, 580);
    this.tensionMarker.setPosition(markerX, 580);
    this.progressFill.setScale(progressWidth, 1);
    this.tensionValueLabel.setText(`${Math.round(session.tension * 100)}%`);
    this.progressValueLabel.setText(`${Math.round(session.progress * 100)}%`);

    this.tensionMarkerGlow.setAlpha(inSafeZone ? 0.36 : 0.18);
    this.progressFill.setFillStyle(inSafeZone ? 0x8fffdc : 0xffd166, 0.95);

    this.warningLabel.setText(warning);
    this.warningLabel.setVisible(warning.length > 0);

    this.fishLabel.setText(`${fish.name} - ${fish.rarity} - ${fish.value}c - ${getDifficultyLabel(fish)}`);
    this.fishFlavorLabel.setText(this.getHookMessage(fish));
    this.fishShadow.x = CENTER_X + 36 + Math.sin(session.elapsed * 4) * 30;
    this.fishShadow.y = CENTER_Y + 34 + Math.cos(session.elapsed * 3) * 14;
  }

  private finishMiniGame(success: boolean, failedStatus = '') {
    const session = this.gameState.activeFishing;
    if (!session) {
      return;
    }

    const fish = this.getActiveFish(session.fishId);
    this.gameState.activeFishing = null;
    this.gameState.castState = 'result';
    this.isReeling = false;
    this.fishLabel.setText('');
    this.fishFlavorLabel.setText('');
    this.warningLabel.setText('');
    this.resetMeters();
    this.fishShadow.setFillStyle(0x7df9ff, 0.18);
    this.fishShadow.setScale(1);

    const caughtFish = success ? fish : undefined;
    const isNewCodexEntry = Boolean(fish && !hasDiscoveredFish(this.gameState.player, fish.id));

    if (success && fish) {
      const quality = getCatchQuality(session);
      this.gameState.lastCatch = addCatchToInventory(this.gameState.player, fish, quality);
      this.gameState.statusText = this.getCatchResultStatus(fish, this.gameState.lastCatch.value);
      this.playSound('catch_success', { volume: fish.rarity === 'Legendary' ? 0.46 : 0.34 });
      this.showCatchBurst(fish.color);
      if (fish.rarity === 'Legendary') {
        this.showLegendaryCatchMessage(fish, this.gameState.lastCatch.value);
      }
      if (!this.saveProgress()) {
        this.gameState.statusText = `${this.gameState.statusText} - save failed`;
      }
    } else {
      this.playSound('fish_escape', { volume: 0.28 });
      this.gameState.statusText = failedStatus;
    }

    this.updateFishingTipsLearnedState();
    this.refreshHud();
    this.updateFishingTipVisibility();
    if (caughtFish) {
      this.showLastCatchToast();
      if (isNewCodexEntry) {
        this.showCodexToast(caughtFish.name);
      }
    }
  }

  private showCatchBurst(color: number) {
    for (let index = 0; index < 24; index += 1) {
      const sparkle = this.add.circle(CENTER_X, CENTER_Y, Phaser.Math.Between(3, 7), color, 0.9);
      this.tweens.add({
        targets: sparkle,
        x: sparkle.x + Phaser.Math.Between(-130, 130),
        y: sparkle.y + Phaser.Math.Between(-110, 110),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1200),
        ease: 'Sine.out',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private showLastCatchToast() {
    this.lastCatchToast.setVisible(true);
    this.lastCatchToast.setAlpha(1);
    this.tweens.killTweensOf(this.lastCatchToast);
    this.time.delayedCall(4200, () => {
      this.tweens.add({
        targets: this.lastCatchToast,
        alpha: 0,
        duration: 450,
        ease: 'Sine.inOut',
        onComplete: () => this.lastCatchToast.setVisible(false),
      });
    });
  }

  private showCodexToast(fishName: string) {
    const body = this.codexToast.getAt(2) as Phaser.GameObjects.Text;
    body.setText(fishName);
    this.codexToast.setVisible(true);
    this.codexToast.setAlpha(1);
    this.tweens.killTweensOf(this.codexToast);
    this.time.delayedCall(3600, () => {
      this.tweens.add({
        targets: this.codexToast,
        alpha: 0,
        duration: 420,
        ease: 'Sine.inOut',
        onComplete: () => this.codexToast.setVisible(false),
      });
    });
  }

  private refreshHud() {
    const { player } = this.gameState;
    const currentZone = getFishingZoneDefinition(this.gameState.ship.currentZone);
    const showMeters = this.gameState.castState === 'reeling' && Boolean(this.gameState.activeFishing);
    const showHookText = showMeters || this.isLegendaryWarningActive;

    this.statusLabel.setText(this.gameState.statusText);
    this.coinsLabel.setText(`${player.coins} coins`);
    player.cargoCapacity = getCargoCapacity(player);
    this.inventoryLabel.setText(`${player.caughtFish.length}/${player.cargoCapacity} cargo slots`);
    this.zoneSummaryLabel.setText(`Zone: ${currentZone?.name ?? this.gameState.ship.currentZone}`);
    this.lastCatchLabel.setText(this.getLastCatchText());
    this.tackleBoxLatestCatchText.setText(this.getTackleBoxLatestCatchText());
    this.inventoryPanelText.setText(this.getInventoryPanelText());
    this.refreshCodexPanel();
    this.shipInfoText.setText(this.getShipInfoText());
    this.shipLogText.setText(this.getShipLogText());
    this.zoneInfoText.setText(this.getZoneInfoText());
    this.devRarityButtonText.setText(this.getDevRarityButtonText());
    this.refreshCastButton();
    this.refreshUpgradeButtons();
    this.refreshShipUpgradeButtons();
    this.refreshZoneButtons();
    this.meterObjects.forEach((object) => object.setVisible(showMeters));
    this.updateFishingTipVisibility();
    this.fishLabel.setVisible(showHookText);
    this.fishFlavorLabel.setVisible(showHookText);
    this.warningLabel.setVisible(showHookText && this.warningLabel.text.length > 0);
  }

  private resetMeters() {
    this.tensionSafeZone.setPosition(CENTER_X, 580);
    this.tensionSafeZone.setDisplaySize(110, 24);
    this.safeZoneLabel.setPosition(CENTER_X, 552);
    this.safeZoneLabel.setVisible(false);
    this.tensionMarkerGlow.setPosition(METER_X, 580);
    this.tensionMarkerGlow.setAlpha(0.18);
    this.tensionMarker.setPosition(METER_X, 580);
    this.progressFill.setScale(1, 1);
    this.progressFill.setFillStyle(0xffd166, 0.95);
    this.tensionValueLabel.setText('0%');
    this.progressValueLabel.setText('0%');
    this.meterObjects.forEach((object) => object.setVisible(false));
    this.hideFishingTipsButton.setVisible(false);
  }

  private updateFishingTipVisibility() {
    const showTips = this.shouldShowFishingTips();
    this.fishingTipText.setVisible(showTips);
    this.hideFishingTipsButton.setVisible(showTips);
  }

  private shouldShowFishingTips() {
    return (
      this.gameState.castState === 'reeling'
      && Boolean(this.gameState.activeFishing)
      && window.localStorage.getItem(FISHING_TIPS_HIDDEN_STORAGE_KEY) !== 'true'
      && this.fishingHintAttempts <= FISHING_TIP_ATTEMPT_LIMIT
      && this.gameState.player.caughtFish.length < FISHING_TIP_CATCH_LIMIT
    );
  }

  private getFishingTipText() {
    return 'Tip: Hold Space or Mouse to raise tension. Release to let it fall. Keep the marker in the safe zone.';
  }

  private hideFishingTips() {
    window.localStorage.setItem(FISHING_TIPS_HIDDEN_STORAGE_KEY, 'true');
    this.updateFishingTipVisibility();
  }

  private updateFishingTipsLearnedState() {
    if (
      this.fishingHintAttempts >= FISHING_TIP_ATTEMPT_LIMIT
      || this.gameState.player.caughtFish.length >= FISHING_TIP_CATCH_LIMIT
    ) {
      window.localStorage.setItem(FISHING_TIPS_HIDDEN_STORAGE_KEY, 'true');
    }
  }

  private refreshCastButton() {
    const readyToCast = this.gameState.castState === 'ready' || this.gameState.castState === 'result';
    const touchingFishingEdge = this.isTouchingFishingEdge();
    const enabled = readyToCast && touchingFishingEdge;
    const visible = touchingFishingEdge || !readyToCast;
    this.castButton.setVisible(visible);
    if (visible) {
      this.castButton.setInteractive({ useHandCursor: true });
    } else {
      this.castButton.disableInteractive();
    }
    this.castButtonBg.setFillStyle(enabled ? 0x7df9ff : 0x233550, enabled ? 0.95 : 0.86);
    this.castButtonText.setColor(enabled ? '#061022' : '#aebbd8');
    this.castButtonText.setText(readyToCast ? 'Cast' : 'Fishing...');
  }

  private buyUpgrade(definition: UpgradeDefinition) {
    if (!canUpgrade(this.gameState.player, definition)) {
      return;
    }

    buyPlayerUpgrade(this.gameState.player, definition);
    this.playSound('upgrade_purchase', { volume: 0.34 });
    this.gameState.statusText = `${definition.name} upgraded to level ${getUpgradeLevel(this.gameState.player, definition.id)}`;
    if (!this.saveProgress()) {
      this.gameState.statusText = `${definition.name} upgraded, but save failed`;
    }

    if (this.gameState.activeFishing && definition.id === 'strongerLine') {
      widenActiveSafeZone(this.gameState.activeFishing);
      const fish = this.getActiveFish(this.gameState.activeFishing.fishId);
      if (fish) {
        this.updateMeters(
          this.gameState.activeFishing,
          fish,
          isInSafeZone(this.gameState.activeFishing),
          'In the red zone',
        );
      }
    }

    this.refreshHud();
  }

  private refreshUpgradeButtons() {
    upgradeDefinitions.forEach((definition) => {
      const cost = getUpgradeCost(this.gameState.player, definition);
      const level = getUpgradeLevel(this.gameState.player, definition.id);
      const canBuy = canUpgrade(this.gameState.player, definition);
      const bg = this.upgradeButtonBgs[definition.id];
      const label = this.upgradeButtonTexts[definition.id];
      const levelText = this.upgradeLevelTexts[definition.id];

      bg?.setFillStyle(canBuy ? 0x7df9ff : 0x233550, canBuy ? 0.95 : 0.86);
      label?.setColor(canBuy ? '#061022' : '#aebbd8');
      label?.setText(cost === null ? 'Max' : `${cost}c`);
      levelText?.setText(`Lv ${level}`);
    });
  }

  private buyShipUpgrade(definition: ShipUpgradeDefinition) {
    if (!canBuyShipUpgrade(this.gameState.player, this.gameState.ship, definition)) {
      return;
    }

    if (!buySharedShipUpgrade(this.gameState.player, this.gameState.ship, definition)) {
      return;
    }

    this.playSound('upgrade_purchase', { volume: 0.34 });
    this.gameState.statusText = `${definition.name} upgraded for ${this.gameState.ship.shipName}`;
    if (!this.saveProgress()) {
      this.gameState.statusText = `${definition.name} upgraded, but save failed`;
    }

    this.refreshHud();
  }

  private refreshShipUpgradeButtons() {
    shipUpgradeDefinitions.forEach((definition) => {
      const cost = getShipUpgradeCost(this.gameState.ship, definition);
      const level = getShipUpgradeLevel(this.gameState.ship, definition.id);
      const canBuy = canBuyShipUpgrade(this.gameState.player, this.gameState.ship, definition);
      const bg = this.shipUpgradeButtonBgs[definition.id];
      const label = this.shipUpgradeButtonTexts[definition.id];
      const levelText = this.shipUpgradeLevelTexts[definition.id];

      bg?.setFillStyle(canBuy ? 0x7df9ff : 0x233550, canBuy ? 0.95 : 0.86);
      label?.setColor(canBuy ? '#061022' : '#aebbd8');
      label?.setText(cost === null ? 'Max' : `${cost}c`);
      levelText?.setText(`Lv ${level}`);
    });
  }

  private switchZone(zoneId: FishingZoneId) {
    if (!switchFishingZone(this.gameState.ship, zoneId)) {
      const zone = getFishingZoneDefinition(zoneId);
      this.gameState.statusText = zone?.unlockRequirement?.label ?? 'Zone locked';
      this.refreshHud();
      return;
    }

    const zone = getFishingZoneDefinition(zoneId);
    this.playSound('ui_click', { volume: 0.24 });
    this.gameState.statusText = `Fishing zone set to ${zone?.name ?? zoneId}`;
    if (!this.saveProgress()) {
      this.gameState.statusText = `${this.gameState.statusText}, but save failed`;
    }

    this.refreshHud();
  }

  private refreshZoneButtons() {
    fishingZoneDefinitions.forEach((zone) => {
      const unlocked = isZoneUnlocked(this.gameState.ship, zone.id);
      const selected = this.gameState.ship.currentZone === zone.id;
      const bg = this.zoneButtonBgs[zone.id];
      const label = this.zoneButtonTexts[zone.id];

      bg?.setFillStyle(selected ? 0xffd166 : unlocked ? 0x7df9ff : 0x233550, selected || unlocked ? 0.95 : 0.86);
      label?.setColor(selected ? '#061022' : unlocked ? '#061022' : '#aebbd8');
      label?.setText(unlocked ? zone.name : 'Locked');
    });
  }

  private refreshCodexPanel() {
    const entries = getCodexEntries(this.gameState.player);
    const progress = getCodexProgress(this.gameState.player);
    const maxPage = this.getCodexMaxPage();
    this.codexPage = Phaser.Math.Clamp(this.codexPage, 0, maxPage);

    this.codexProgressText.setText(`Discovered ${progress.discovered}/${progress.total}`);
    this.codexRarityText.setText(progress.byRarity
      .map((entry) => `${entry.rarity} ${entry.discovered}/${entry.total}`)
      .join('   '));
    this.codexPageText.setText(`Page ${this.codexPage + 1}/${maxPage + 1}`);

    const pageEntries = entries.slice(this.codexPage * 4, this.codexPage * 4 + 4);
    this.codexEntryCards.forEach((card, index) => {
      const entry = pageEntries[index];
      if (!entry) {
        card.container.setVisible(false);
        return;
      }

      card.container.setVisible(true);
      if (entry.discovered) {
        card.bg.setFillStyle(0x101f39, 0.94);
        card.bg.setStrokeStyle(1, entry.fish.color, 0.48);
        card.nameText.setColor('#eef6ff');
        card.metaText.setColor('#ffd166');
        card.flavorText.setColor('#c9d7ff');
        card.nameText.setText(entry.fish.name);
        card.metaText.setText(`${entry.fish.rarity}\nx${entry.quantityCaught}  ${entry.fish.value}c`);
        card.flavorText.setText(`${entry.fish.flavorText}\n${this.getFishZoneLabel(entry.fish)}`);
      } else {
        card.bg.setFillStyle(0x0b1122, 0.72);
        card.bg.setStrokeStyle(1, 0x52617d, 0.24);
        card.nameText.setColor('#71809d');
        card.metaText.setColor('#71809d');
        card.flavorText.setColor('#8794ad');
        card.nameText.setText('???');
        card.metaText.setText(entry.fish.rarity);
        card.flavorText.setText(this.getCodexHint(entry.fish));
      }
    });

    const canGoBack = this.codexPage > 0;
    const canGoForward = this.codexPage < maxPage;
    this.codexPrevButtonBg.setFillStyle(canGoBack ? 0x233550 : 0x111a2d, canGoBack ? 0.94 : 0.72);
    this.codexPrevButtonText.setColor(canGoBack ? '#d9ecff' : '#64718d');
    this.codexNextButtonBg.setFillStyle(canGoForward ? 0x233550 : 0x111a2d, canGoForward ? 0.94 : 0.72);
    this.codexNextButtonText.setColor(canGoForward ? '#d9ecff' : '#64718d');
  }

  private getCodexMaxPage() {
    return Math.max(0, Math.ceil(fishTypes.length / 4) - 1);
  }

  private getLastCatchText() {
    if (!this.gameState.lastCatch) {
      return 'No catch yet';
    }

    return `${this.gameState.lastCatch.name} - ${this.gameState.lastCatch.rarity}\n+${this.gameState.lastCatch.value} coins - ${this.gameState.lastCatch.quality}\n${this.gameState.lastCatch.flavorText}`;
  }

  private getTackleBoxLatestCatchText() {
    if (!this.gameState.lastCatch) {
      return 'Freshest catch\nNo fish caught yet.';
    }

    return `Freshest catch\n${this.gameState.lastCatch.name} - ${this.gameState.lastCatch.rarity} - +${this.gameState.lastCatch.value}c`;
  }

  private getInventoryPanelText() {
    const groups = getInventoryByRarity(this.gameState.player);
    const populatedGroups = groups.filter((group) => group.quantity > 0);

    if (populatedGroups.length === 0) {
      return 'No fish caught yet.';
    }

    return populatedGroups.map((group) => {
      const fishLines = group.fish.slice(0, 3).map((fish) => {
        return `  ${fish.name} (${fish.rarity}) x${fish.quantity} - ${fish.totalValue}c`;
      });
      const hiddenCount = group.fish.length - fishLines.length;
      const moreLine = hiddenCount > 0 ? [`  +${hiddenCount} more`] : [];

      return [
        `${group.rarity}: ${group.quantity} fish - ${group.totalValue}c`,
        ...fishLines,
        ...moreLine,
      ].join('\n');
    }).join('\n\n');
  }

  private getCodexHint(fish: FishType) {
    if (fish.rarity === 'Legendary') {
      return 'A legend waits in deep cosmic currents.';
    }

    if (fish.rarity === 'Epic') {
      return 'Rare signals spike when the line fights back.';
    }

    if (fish.rarity === 'Rare') {
      return 'Better odds reveal stranger silhouettes.';
    }

    if (fish.rarity === 'Uncommon') {
      return 'Keep casting; this one is not too far from home.';
    }

    return 'Common around the ship pool.';
  }

  private getFishZoneLabel(fish: FishType) {
    const zones = getZoneNamesForFish(fish.id);

    if (zones.length === 0) {
      return 'Zones: Unknown';
    }

    return `Zones: ${zones.join(', ')}`;
  }

  private getShipInfoText() {
    const { ship } = this.gameState;

    return [
      `${ship.shipName} - Lv ${ship.level}`,
      `Shared contributions: ${ship.sharedCoins}c`,
    ].join('\n');
  }

  private getShipLogText() {
    const latest = this.gameState.ship.contributionLog[0];

    if (!latest) {
      return 'No ship contributions yet';
    }

    return `Latest: +${latest.amount}c to ${latest.upgradeName}`;
  }

  private getZoneInfoText() {
    const current = getFishingZoneDefinition(this.gameState.ship.currentZone);
    const currentZoneFish = getFishForZone(this.gameState.ship.currentZone);
    const discoveredInZone = currentZoneFish
      .filter((fish) => hasDiscoveredFish(this.gameState.player, fish.id))
      .length;
    const uniqueFishCount = currentZoneFish
      .filter((fish) => getZoneNamesForFish(fish.id).length === 1)
      .length;
    const lockedZones = fishingZoneDefinitions
      .filter((zone) => !isZoneUnlocked(this.gameState.ship, zone.id))
      .map((zone) => zone.unlockRequirement?.label)
      .filter(Boolean);
    const baseInfo = [
      `Current zone: ${current?.name ?? this.gameState.ship.currentZone}`,
      current?.description ?? '',
      `Fish discovered here: ${discoveredInZone}/${currentZoneFish.length}`,
      uniqueFishCount > 0 ? `${uniqueFishCount} fish unique to this zone` : 'Shared starter fish live here',
    ].filter(Boolean);

    if (lockedZones.length === 0) {
      return [...baseInfo, 'All zones unlocked'].join('\n');
    }

    return [...baseInfo, lockedZones.join(', ')].join('\n');
  }

  private getActiveFish(fishId: string) {
    return getFishById(fishId);
  }

  private getHookMessage(fish: FishType) {
    if (fish.rarity === 'Legendary') {
      return `Legendary bite! ${fish.flavorText}`;
    }

    if (fish.rarity === 'Epic') {
      return `Epic bite! ${fish.flavorText}`;
    }

    return fish.flavorText;
  }

  private getCatchResultStatus(fish: FishType, valueEarned: number) {
    const prefix = fish.rarity === 'Legendary' ? 'LEGENDARY CATCH' : 'Caught';

    return `${prefix}: ${fish.name} - ${fish.rarity} - +${valueEarned} coins`;
  }

  private showLegendaryCatchMessage(fish: FishType, valueEarned: number) {
    this.legendaryBanner?.destroy();
    this.legendaryBanner = this.add.text(CENTER_X, 236, `LEGENDARY CATCH\n${fish.name}\n+${valueEarned} coins`, {
      align: 'center',
      color: '#fff4bd',
      fontFamily: font,
      fontSize: '34px',
      fontStyle: '900',
      stroke: '#2b1028',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: this.legendaryBanner,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0,
      duration: 2600,
      ease: 'Sine.inOut',
      onComplete: () => {
        this.legendaryBanner?.destroy();
        this.legendaryBanner = undefined;
      },
    });
  }

  private pickNextFish() {
    const currentZone = this.gameState.ship.currentZone;

    if (!this.forcedRarityMode) {
      return pickFish(getBetterLureLevel(this.gameState.player), Math.random, currentZone);
    }

    const rarity = this.forcedRarityMode;
    const zoneFish = getFishForZone(currentZone);
    const candidates = this.getZoneFishCandidatesForRarity(zoneFish, rarity);

    return candidates[Phaser.Math.Between(0, Math.max(0, candidates.length - 1))]
      ?? pickFish(getBetterLureLevel(this.gameState.player), Math.random, currentZone);
  }

  private getZoneFishCandidatesForRarity(zoneFish: FishType[], rarity: FishRarity) {
    const directCandidates = zoneFish.filter((fish) => fish.rarity === rarity);

    if (directCandidates.length > 0) {
      return directCandidates;
    }

    const rarityIndex = fishRarities.indexOf(rarity);
    for (let offset = 1; offset < fishRarities.length; offset += 1) {
      const candidates = [
        ...zoneFish.filter((fish) => fish.rarity === fishRarities[rarityIndex - offset]),
        ...zoneFish.filter((fish) => fish.rarity === fishRarities[rarityIndex + offset]),
      ];

      if (candidates.length > 0) {
        return candidates;
      }
    }

    return zoneFish;
  }

  private cycleForcedRarity() {
    if (!this.forcedRarityMode) {
      this.forcedRarityMode = fishRarities[0];
    } else {
      const currentIndex = fishRarities.indexOf(this.forcedRarityMode);
      this.forcedRarityMode = fishRarities[currentIndex + 1] ?? null;
    }

    this.gameState.statusText = this.forcedRarityMode
      ? `DEV TEST: all hooked fish forced to ${this.forcedRarityMode}`
      : 'DEV TEST: normal fish odds restored';
  }

  private getDevRarityButtonText() {
    const lureLevel = getBetterLureLevel(this.gameState.player);
    const legendaryChance = getRarityWeights(lureLevel, this.gameState.ship.currentZone)
      .find((entry) => entry.rarity === 'Legendary')?.chance ?? 0;
    const mode = this.forcedRarityMode ?? 'Normal';

    return `DEV rarity: ${mode} (${(legendaryChance * 100).toFixed(2)}% L)`;
  }

  private saveProgress() {
    if (!this.hasPlayerProgress()) {
      return true;
    }

    return this.saveProvider.save(this.gameState.player, this.gameState.ship, this.platformContext);
  }

  private hasPlayerProgress() {
    const { player } = this.gameState;

    return (
      player.coins > 0
      || player.caughtFish.length > 0
      || upgradeDefinitions.some((definition) => getUpgradeLevel(player, definition.id) > 0)
      || this.gameState.ship.sharedCoins > 0
      || shipUpgradeDefinitions.some((definition) => getShipUpgradeLevel(this.gameState.ship, definition.id) > 0)
      || this.gameState.ship.currentZone !== 'cosmicPool'
    );
  }

  private resetSave() {
    this.biteTimer?.remove();
    this.legendaryWarningTimer?.remove();
    this.legendaryWarningTimer = undefined;
    this.isLegendaryWarningActive = false;
    this.legendaryWarningGlow?.destroy();
    this.legendaryWarningGlow = undefined;
    const resetSucceeded = this.saveProvider.reset(this.platformContext);
    this.gameState = createGameStateForPlatform(this.platformContext);
    this.gameState.statusText = resetSucceeded ? 'Save reset' : 'Could not reset save';
    this.isReeling = false;
    this.fishLabel.setText('');
    this.fishFlavorLabel.setText('');
    this.warningLabel.setText('');
    this.resetMeters();
    this.fishShadow.setFillStyle(0x7df9ff, 0.18);
    this.fishShadow.setScale(1);
    this.refreshHud();
  }

  private animateAmbient(delta: number) {
    this.stars.getChildren().forEach((child) => {
      const star = child as Phaser.GameObjects.Arc;
      star.y += (star.getData('speed') as number) * (delta / 1000);

      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });

    this.backgroundFish.getChildren().forEach((child) => {
      const fish = child as Phaser.GameObjects.Ellipse;
      const offset = fish.getData('offset') as number;
      fish.x += (fish.getData('speed') as number) * (delta / 1000);
      fish.y += Math.sin(this.time.now / 900 + offset) * 0.12;

      if (fish.x > GAME_WIDTH + 80) {
        fish.x = -80;
        fish.y = Phaser.Math.Between(85, GAME_HEIGHT - 160);
      }
    });
  }
}
