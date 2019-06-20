import CanvasInput from "./CanvasInput";
import Loop from 'loop';
import Unit from "./Unit";
import Vector from "Vector";
import Paint from 'paint';

export default class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.canvasInput = new CanvasInput(this.canvas);

    this.selectionRect = {
      position: new Vector(0, 0),
      dimensions: new Vector(0, 0)
    };

    this.canvasInput.on(CanvasInput.MOUSE_DOWN, (point, mouse) => {
      const screenOffset = new Vector(this.canvas.width * 0.5, this.canvas.height * 0.5);
      const gameCoord = point.clone().substract(screenOffset);

      if (mouse.down.right) {
        const selectedUnits = this.state.units.filter(unit => unit.selected);
        if (selectedUnits.length === 0) return;
        const averatePosition = selectedUnits.reduce((sum, unit) => sum.add(unit.position), new Vector()).scale(1 / selectedUnits.length);

        selectedUnits.forEach(unit => {
          const offset = unit.position.clone().substract(averatePosition);
          unit.path = [gameCoord.clone().add(offset)];
        });
      }

      if (mouse.down.left) {
        this.selectionRect.position = gameCoord.clone();
        this.selectionRect.dimensions.zero();
      }
    });

    this.canvasInput.on(CanvasInput.MOUSE_MOVE, (point, mouse) => {
      const screenOffset = new Vector(this.canvas.width * 0.5, this.canvas.height * 0.5);
      const gameCoord = point.clone().substract(screenOffset);

      if (mouse.pressed.right) {
        const selectedUnits = this.state.units.filter(unit => unit.selected);

        if (selectedUnits.length === 0) return;

        const averatePosition = selectedUnits.reduce((sum, unit) => sum.add(unit.position), new Vector()).scale(1 / selectedUnits.length);



        selectedUnits.forEach(unit => {
          const offset = unit.position.clone().substract(averatePosition);
          const lastPoint = unit.path[unit.path.length - 1];
          const newPathPoint = gameCoord.clone().add(offset);
          const shouldPushPoint = !lastPoint || lastPoint.distance(newPathPoint) > 20;

          if (shouldPushPoint) {
            unit.path.push(newPathPoint)
          }
        });
      }

      if (mouse.pressed.left) {
        this.selectionRect.dimensions = gameCoord.clone().substract(this.selectionRect.position);
      }
    });

    this.canvasInput.on(CanvasInput.MOUSE_UP, (point, mouse, e) => {
      if (mouse.released.left) {
        this.state.units.forEach(unit => {
          unit.selected = false;
        });

        const selectedUnits = this.getUnitsInsideSelectionRect().filter(unit => unit.team === 0);

        if (selectedUnits.length > 0) {
          selectedUnits.forEach(unit => {
            unit.selected = true;
          });
        } else {
          const mousePosition = this.selectionRect.position.clone().add(this.selectionRect.dimensions);
          const clickedUnit = this.state.units.find(unit => unit.position.distance(mousePosition) < unit.radius);
          if (clickedUnit && selectedUnit.team === 0) {
            clickedUnit.selected = true;
          }
        }

        this.selectionRect.dimensions.zero();
      }
    });

    this.paint = new Paint(this.canvas);
    this.loop = new Loop({
      onTick: (dtMs) => {
        const dt = Math.min(dtMs / 1000, 0.5);
        this.update(dt);
        this.render();
      }
    });

    this.state = this.getInitState();
  }

  getUnitsInsideSelectionRect() {
    const minX = Math.min(this.selectionRect.position.x, this.selectionRect.position.x + this.selectionRect.dimensions.x);
    const minY = Math.min(this.selectionRect.position.y, this.selectionRect.position.y + this.selectionRect.dimensions.y);
    const maxX = Math.max(this.selectionRect.position.x, this.selectionRect.position.x + this.selectionRect.dimensions.x);
    const maxY = Math.max(this.selectionRect.position.y, this.selectionRect.position.y + this.selectionRect.dimensions.y);

    return this.state.units.filter(unit =>
      unit.position.x > minX
      && unit.position.x < maxX
      && unit.position.y > minY
      && unit.position.y < maxY
    )
  }

  start() {
    this.loop.start();
  }

  getInitState() {
    return {
      units: [
        new Unit(new Vector(0, 0), 0),
        new Unit(new Vector(14, 25), 0),
        new Unit(new Vector(16, 55), 0),
        new Unit(new Vector(85, 66), 0),
        new Unit(new Vector(45, 5), 0),
        new Unit(new Vector(100, -100), 1),
      ],
    }
  }

  update(dt) {
    this.state.units.forEach(unit => unit.update(dt, this));
    this.canvasInput.reset();
  }

  render() {
    const { canvas, ctx } = this;
    canvas.width = canvas.width;

    ctx.translate(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5);

    this.state.units.forEach(unit => unit.drawPath(this.paint));
    this.state.units.forEach(unit => unit.draw(this.paint));

    this.paint.rect({
      position: this.selectionRect.position,
      width: this.selectionRect.dimensions.x,
      height: this.selectionRect.dimensions.y,
      fill: '#fff',
      alpha: 0.3
    })
  }
}