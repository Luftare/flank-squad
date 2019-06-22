import Vector from 'vector';

const mouseButtonNames = ['_', 'left', 'middle', 'right'];

export default class CanvasInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.topics = {};
    this.mouse = {
      pressed: {},
      down: {},
      released: {},
    };

    this.keysDown = {};

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    window.addEventListener('resize', () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });

    window.addEventListener('keydown', ({ key }) => {
      this.keysDown[key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', ({ key }) => {
      this.keysDown[key.toLowerCase()] = false;
    });

    canvas.addEventListener(CanvasInput.MOUSE_DOWN, (e) => {
      const buttonName = mouseButtonNames[e.which];
      this.mouse.down[buttonName] = !this.mouse.pressed[buttonName];
      this.mouse.pressed[buttonName] = true;
      this.publishEvent(CanvasInput.MOUSE_DOWN, this.getEventCanvasPoint(e), this.mouse, e)
    });

    canvas.addEventListener(CanvasInput.MOUSE_MOVE, (e) =>
      this.publishEvent(CanvasInput.MOUSE_MOVE, this.getEventCanvasPoint(e), this.mouse, e)
    );

    canvas.addEventListener(CanvasInput.MOUSE_LEAVE, (e) => {
      this.publishEvent(CanvasInput.MOUSE_LEAVE, this.getEventCanvasPoint(e), this.mouse, e)
    });

    canvas.addEventListener(CanvasInput.MOUSE_UP, (e) => {
      const buttonName = mouseButtonNames[e.which];
      this.mouse.released[buttonName] = true;
      this.mouse.pressed[buttonName] = false;
      this.publishEvent(CanvasInput.MOUSE_UP, this.getEventCanvasPoint(e), this.mouse, e)
    });
  }

  static get MOUSE_DOWN() { return 'mousedown' }
  static get MOUSE_UP() { return 'mouseup' }
  static get MOUSE_LEAVE() { return 'mouseleave' }
  static get MOUSE_MOVE() { return 'mousemove' }

  reset() {
    this.mouse.down = {};
    this.mouse.released = {};
  }

  on(eventName, cb) {
    this.topics[eventName] = this.topics[eventName] || [];
    this.topics[eventName].push(cb);
  }

  publishEvent(eventName, ...args) {
    if (this.topics[eventName]) {
      this.topics[eventName].forEach(cb => cb(...args));
    }
  }

  getEventCanvasPoint(e) {
    const screenPoint = this.getEventPoint(e);
    const canvasOffset = this.getCanvasOffset();
    return screenPoint.substract(canvasOffset);
  }

  getEventPoint({ x, y }) {
    return new Vector(x, y);
  }

  getCanvasOffset() {
    const { top, left } = this.canvas.getBoundingClientRect();
    return new Vector(left, top);
  }
}