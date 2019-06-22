import Vector from "Vector";

export default class Unit {
  constructor(position, team) {
    this.assaulting = false;
    this.selected = false;
    this.target = null;
    this.lastTargetAcqisitionTime = 0;
    this.lastShotTime = 0;
    this.shotTimeoutDuration = 300;
    this.maxDamage = 20;
    this.health = 100;
    this.team = team;
    this.radius = 5;
    this.range = 150;
    this.position = new Vector(position);
    this.angularVelocity = 2;
    this.speed = 25;
    this.direction = new Vector(1, 0);
    this.path = [];
  }

  update(dt, game) {
    this.updateTarget(dt, game);
    this.updateDirection(dt, game);
    this.handlePathPointReaching();
    this.flockMove(dt, game);
    this.restoreHealth(dt, game);
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
    const aimingTarget = facingDelta < 0.1;
    const gunLoaded = Date.now() - this.lastShotTime > this.shotTimeoutDuration;
    const shouldShoot = aimingTarget && gunLoaded;

    if (shouldShoot) {
      const distance = toTarget.length;
      const damage = (Math.random() ** (distance / this.range)) * this.maxDamage;
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
    if (this.team === 1) return;
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

  drawPath(paint) {
    paint.path({
      points: [this.position, ...this.path],
      lineWidth: 1,
      stroke: this.assaulting ? 'red' : 'yellow',
      alpha: this.selected ? 1 : 0.2,
    });


    if (this.target) {
      paint.path({
        points: [this.position, this.target.position],
        lineWidth: 2,
        stroke: 'orange',
      });
    }
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