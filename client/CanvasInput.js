import Vector from 'vector';

export default class CanvasInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.topics = {};

    canvas.addEventListener(CanvasInput.MOUSE_DOWN, (e) =>
      this.publishEvent(CanvasInput.MOUSE_DOWN, this.getEventCanvasPoint(e), e)
    );

    canvas.addEventListener(CanvasInput.MOUSE_MOVE, (e) =>
      this.publishEvent(CanvasInput.MOUSE_MOVE, this.getEventCanvasPoint(e), e)
    );

    canvas.addEventListener(CanvasInput.MOUSE_LEAVE, (e) =>
      this.publishEvent(CanvasInput.MOUSE_LEAVE, this.getEventCanvasPoint(e), e)
    );

    canvas.addEventListener(CanvasInput.MOUSE_UP, (e) =>
      this.publishEvent(CanvasInput.MOUSE_UP, this.getEventCanvasPoint(e), e)
    );
  }

  static get MOUSE_DOWN() { return 'mousedown' }
  static get MOUSE_UP() { return 'mouseup' }
  static get MOUSE_LEAVE() { return 'mouseleave' }
  static get MOUSE_MOVE() { return 'mousemove' }

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