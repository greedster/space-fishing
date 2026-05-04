import Phaser from 'phaser';
import { gameConfig } from './game/config';
import './styles.css';

if (window.location.hostname === '127.0.0.1') {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.hostname = 'localhost';
  window.location.replace(canonicalUrl);
} else {
  new Phaser.Game(gameConfig);
}
