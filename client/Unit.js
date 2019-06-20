import Vector from "Vector";

export default class Unit {
  constructor(position, team) {
    this.selected = false;
    this.health = 100;
    this.team = team;
    this.radius = 5;
    this.position = new Vector(position);
    this.angularVelocity = 1;
    this.speed = 5;
    this.direction = new Vector(1, 0);
    this.path = [];
    this.lastPathPoint = position.clone();
  }

  update(dt, game) {
    if (this.path.length > 0) {
      this.rotateTowardsNextPathPoint(dt, game);
      this.handlePathPointReaching();
    }

    this.flockMove(dt, game);
  }

  rotateTowardsNextPathPoint(dt, game) {
    const nextPoint = this.path[0];

    const toNextPoint = nextPoint.clone().substract(this.position);
    const facingDelta = toNextPoint.angleBetween(this.direction);
    const shouldRotateTowardsPoint = facingDelta > 0.03;

    if (shouldRotateTowardsPoint) {
      const clockWise = this.direction.clone().normalize().cross(toNextPoint.clone().normalize()) > 0;
      this.direction.lerpAlignFixed(dt * this.angularVelocity, clockWise, toNextPoint);
    } else {
      this.direction.alignWith(toNextPoint);
    }
  }

  flockMove(dt, game) {
    if (this.team === 1) return;
    const nextPoint = this.path[0];
    const closestUnit = this.getClosestUnit(game);
    const shouldAvoid = closestUnit && closestUnit.position.distance(this.position) < this.radius + closestUnit.radius;

    const force = new Vector();
    const avoidForce = shouldAvoid ? this.position.clone().substract(closestUnit.position).toLength(1) : new Vector();
    let seekForce = nextPoint ? nextPoint.clone().substract(this.position).toLength(1) : new Vector();

    force.add(avoidForce);
    force.add(seekForce);

    if (force.length > 0) {
      force.toLength(this.speed);
    }

    this.position.scaledAdd(dt, force);
  }

  getClosestUnit(game) {
    let closestUnit = null;
    let minCandidateDistance = Infinity;

    game.state.units.forEach(unit => {
      if (unit !== this) {
        const distance = unit.position.distanceSq(this.position);
        if (distance < minCandidateDistance) {
          closestUnit = unit;
          minCandidateDistance = distance;
        }
      }
    });

    return closestUnit;
  }

  handlePathPointReaching() {
    const nextPoint = this.path[0];
    const reachDistance = this.radius;
    const pointReached = this.position.distance(nextPoint) < reachDistance;

    if (pointReached) {
      if (this.path.length === 1) {
        this.lastPathPoint = this.path[0].clone();
      }
      this.path.shift();
    }
  }

  drawPath(paint) {
    paint.path({
      points: [this.position, ...this.path],
      lineWidth: 1,
      stroke: 'yellow',
      alpha: this.selected ? 1 : 0.2,
    });
  }

  draw(paint) {
    paint.circle({
      position: this.position,
      radius: this.radius,
      fill: this.selected ? 'grey' : 'black',
    });

    paint.path({
      points: [this.position, this.position.clone().add(this.direction.clone().scale(this.radius + 2))],
      lineWidth: 2,
      stroke: this.team === 0 ? 'blue' : 'red'
    });
  }
}