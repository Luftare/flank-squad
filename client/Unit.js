import Vector from "Vector";
import { isContext } from "vm";

export default class Unit {
  constructor(position, team) {
    this.assaulting = false;
    this.selected = false;
    this.spotted = false;
    this.lastSpottedTime = 0;
    this.target = null;
    this.lastTargetAcqisitionTime = 0;
    this.lastShotTime = 0;
    this.shotTimeoutDuration = 300;
    this.maxDamage = 50;
    this.health = 100;
    this.team = team;
    this.radius = 5;
    this.range = 250;
    this.position = new Vector(position);
    this.angularVelocity = 1;
    this.speed = 10;
    this.direction = new Vector(1, 0);
    this.path = [];
  }

  update(dt, game) {
    this.updateTarget(dt, game);
    this.updateDirection(dt, game);
    this.handlePathPointReaching();
    this.flockMove(dt, game);
    this.restoreHealth(dt, game);
    this.updateVisibility(dt, game);
  }

  setTarget(unit) {
    this.target = unit;
    this.lastTargetAcqisitionTime = Date.now();
  }

  updateTarget(dt, game) {
    if (this.target) {
      this.requestTargetLoss(dt, game);

      if (!this.target) {
        this.requestTarget(dt, game);
      }
    } else {
      const shouldSeekTarget = this.path.length === 0 || this.assaulting;

      if (shouldSeekTarget) {
        this.requestTarget(dt, game);
      }
    }

    if (this.target) {
      this.requestShootTarget(dt, game);
    }
  }

  requestTargetLoss() {
    const targetDead = this.target.health <= 0;
    const targetOutOfRange = this.target.position.distance(this.position) > this.range;
    const shouldRetarget = Date.now() - this.lastTargetAcqisitionTime > 2000;
    const shouldLoseTarget = targetDead || targetOutOfRange || shouldRetarget;

    if (shouldLoseTarget) {
      this.target = null;
    }
  }

  requestTarget(dt, game) {
    let cheapestTarget = null;
    let minTargetCost = Infinity;

    game.state.units.forEach(unit => {
      if (unit.team === this.team) return;
      const cost = this.getTargetCost(unit);

      if (cost < minTargetCost) {
        minTargetCost = cost;
        cheapestTarget = unit;
      }
    });

    if (minTargetCost !== Infinity) {
      this.setTarget(cheapestTarget);
    }
  }

  getTargetCost(unit) {
    if (!unit.spotted) return Infinity;
    const toTarget = unit.position.clone().substract(this.position);
    const distance = toTarget.length;
    if (unit.target === this) return distance * 0.1;
    const withinRange = distance <= this.range;
    if (!withinRange) return Infinity;
    const angle = this.direction.angleBetween(toTarget);
    return angle * 30 + distance;
  }

  requestShootTarget(dt, game) {
    const toTarget = this.target.position.clone().substract(this.position);
    const facingDelta = toTarget.angleBetween(this.direction);
    const aimingTarget = facingDelta < 0.02;
    const gunLoaded = Date.now() - this.lastShotTime > this.shotTimeoutDuration;
    const shouldShoot = aimingTarget && gunLoaded;

    if (shouldShoot) {
      const distance = toTarget.length;
      const distanceFactor = 4 * distance / this.range;
      const damage = this.maxDamage * (Math.random() ** distanceFactor);
      (Math.random() ** (2 * distance / this.range)) * this.maxDamage;
      this.target.health -= damage;
      this.lastShotTime = Date.now();
    }
  }

  updateDirection(dt, game) {
    const targetPoint = this.target && this.target.position || this.path[0];

    if (targetPoint) {
      const toTarget = targetPoint.clone().substract(this.position);
      const facingDelta = toTarget.angleBetween(this.direction);
      const shouldRotateTowardsPoint = facingDelta > 0.03;
      if (shouldRotateTowardsPoint) {
        const clockWise = this.direction.clone().normalize().cross(toTarget.clone().normalize()) > 0;
        this.direction.lerpAlignFixed(dt * this.angularVelocity, clockWise, toTarget);
      } else {
        this.direction.alignWith(toTarget);
      }
    }
  }

  flockMove(dt, game) {
    const nextPoint = this.path[0];
    const closestUnit = this.getClosestUnit(game);
    const shouldAvoid = closestUnit && closestUnit.position.distance(this.position) < this.radius + closestUnit.radius + 5;

    const force = new Vector();
    const avoidForce = shouldAvoid ? this.position.clone().substract(closestUnit.position).toLength(1) : new Vector();
    let seekForce = nextPoint ? nextPoint.clone().substract(this.position).toLength(3) : new Vector();

    force.add(avoidForce);

    if (!this.target) {
      force.add(seekForce);
    }

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
    if (this.path.length === 0) return;
    const nextPoint = this.path[0];
    const reachDistance = this.radius;
    const pointReached = this.position.distance(nextPoint) < reachDistance;

    if (pointReached) {
      this.path.shift();
    }
  }

  restoreHealth(dt) {
    this.health = Math.min(100, this.health + 2 * dt);
  }

  updateVisibility(dt, game) {
    const stationarySpotDistance = 100;
    const movingSpotDistance = 200;
    const shootingSpotDistance = 400;

    this.spotted = game.state.units.filter(unit => unit.team !== this.team).some(unit => {
      const toSelf = this.position.clone().substract(unit.position);
      const isFacingSelf = unit.direction.angleBetween(toSelf) < Math.PI * 0.4;
      if (!isFacingSelf) return false;
      const distance = this.position.distance(unit.position);
      const shotRecently = Date.now() - this.lastShotTime < 1000;

      if (shotRecently && distance < shootingSpotDistance) return true;
      if (this.path.length > 0 && distance < movingSpotDistance) return true;
      if (distance < stationarySpotDistance) return true;
    });

    if (this.spotted) {
      this.lastSpottedTime = Date.now();
    }
  }

  drawPath(paint) {
    paint.path({
      points: [this.position, ...this.path],
      lineWidth: 1,
      stroke: this.assaulting ? 'red' : 'yellow',
      alpha: this.selected ? 1 : 0.2,
    });
  }

  drawFlash(paint) {
    const timeSinceShot = Date.now() - this.lastShotTime;
    const flashDuration = 50;
    const alpha = (flashDuration - timeSinceShot) / flashDuration;

    if (alpha > 0) {
      const position = this.direction.clone().toLength(this.radius + 2).add(this.position);
      paint.circle({
        radius: this.radius + 3,
        fill: 'yellow',
        alpha,
        position
      });
    }
  }

  draw(paint) {
    const sinceLastSpot = Date.now() - this.lastSpottedTime;
    const fadeOutTime = 2000;
    const alpha = Math.max(0.1, (fadeOutTime - sinceLastSpot) / fadeOutTime);

    if (alpha > 0 || this.team === 0) {
      paint.circle({
        position: this.position,
        radius: this.radius,
        fill: this.selected ? 'grey' : 'black',
        alpha: this.team === 0 || this.spotted ? 1 : alpha,
      });

      paint.path({
        points: [this.position, this.position.clone().add(this.direction.clone().scale(this.radius + 2))],
        lineWidth: 2,
        stroke: this.team === 0 ? 'lightblue' : 'hotpink',
      });
    }
  }
}