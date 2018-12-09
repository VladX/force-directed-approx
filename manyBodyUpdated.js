export default function() {
  var nodes,
      node,
      alpha,
      iter = 0,
      tree,
      updateClosure,
      updateBH,
      strength = constant(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;

  function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
  }

  function x(d) {
    return d.x;
  }

  function y(d) {
    return d.y;
  }

  updateClosure = function () {
    return function (i) {
      if (i % 13 === 0) {
        return true;
      } else {
        return false;
      }
    };
  }

  function force(_) {
    var i, n = nodes.length;
    if (!tree || updateBH(iter, nodes)) {
      tree = quadtree(nodes, x, y).visitAfter(accumulate);
      nodes.update.push(iter);
    }
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    ++iter;
  }

  function initialize() {
    if (!nodes) return;
    iter = 0;
    nodes.update = [];
    updateBH = updateClosure();
    tree = null;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }

  function accumulate(quad) {
    var strength = 0, q, c, weight = 0, x, y, i;
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          strength += q.value, weight += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    }
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    quad.value = strength;
  }

  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;

    var x = quad.x - node.x,
        y = quad.y - node.y,
        w = x2 - x1,
        l = x * x + y * y;
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) x = jiggle(), l += x * x;
        if (y === 0) y = jiggle(), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    }
    else if (quad.length || l >= distanceMax2) return;

    if (quad.data !== node || quad.next) {
      if (x === 0) x = jiggle(), l += x * x;
      if (y === 0) y = jiggle(), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do if (quad.data !== node) {
      x = quad.data.x - node.x;
      y = quad.data.y - node.y;
      l = x * x + y * y;
      if (x === 0) x = jiggle(), l += x * x;
      if (y === 0) y = jiggle(), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);

      w = strengths[quad.data.index] * alpha / l;

      node.vx += x * w;
      node.vy += y * w;
    } while (quad = quad.next);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
  };

  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  force.update = function(_) {
    return arguments.length ? (updateClosure = _, updateBH = updateClosure(), force) : updateClosure;
  };

  return force;
}
