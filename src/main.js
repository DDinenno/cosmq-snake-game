import Cosmq, { renderDOM, observe, compute, observableArray } from "cosmq-js";
import { areOverlapping, nodesMatch, addNode } from "./utils.js";

const gridSize = {
  x: Math.floor(window.innerWidth / 30) - 1,
  y: Math.floor(window.innerHeight / 30) - 3,
};

const STATES = {
  running: "running",
  gameover: "gameover",
  paused: "paused",
  win: "win",
};

const getFoodPos = (exclude = []) => {
  const node = {
    x: Math.floor(Math.random() * gridSize.x),
    y: Math.floor(Math.random() * gridSize.y),
  };

  if (exclude.find((e) => nodesMatch(e, node))) {
    return getFoodPos();
  }

  return node;
};

const Component_Food = ({ pos }) => {
  return (
    <span
      className="food"
      style={{
        background: "rgb(80, 67, 128)",
        width: "30px",
        height: "30px",
        position: "absolute",
        left: compute(`${pos.x * 30}px`),
        top: compute(`${pos.y * 30}px`),
        opacity: 0.8,
      }}
    />
  );
};

const Component_App = ({}) => {
  const nodes = observe([]);
  const direction = observe({ x: 1, y: 0 });
  const frame = observe(1);
  const foodPos = observe(getFoodPos());
  const state = observe(STATES.paused);
  const score = observe(0);
  const maxNodes = gridSize.x * gridSize.y;

  const initialLoopTimeout = 150;
  let loopTimeout = initialLoopTimeout;

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (state !== STATES.running) {
      state = STATES.running;
      score = 0;

      nodes = [
        {
          x: 1,
          y: 1,
        },

        {
          x: 0,
          y: 1,
        },
        {
          x: 0,
          y: 0,
        },
      ];

      return;
    }

    let newDirection;
    switch (e.key) {
      case "ArrowUp":
        newDirection = { x: 0, y: -1 };
        break;
      case "ArrowDown":
        newDirection = { x: 0, y: 1 };
        break;
      case "ArrowLeft":
        newDirection = { x: -1, y: 0 };
        break;
      case "ArrowRight":
        newDirection = { x: 1, y: 0 };
        break;
    }

    if (newDirection) {
      const newPos = addNode(nodes[0], newDirection);

      if (nodes.find((n) => nodesMatch(n, newPos))) {
        // prevent moving backwards
        return;
      }

      if (nodesMatch(newDirection, direction)) {
        loopTimeout = loopTimeout * 0.9;
      } else {
        loopTimeout = initialLoopTimeout;
      }

      direction = newDirection;
    }
  });

  const loop = (cb) => {
    setTimeout(() => {
      cb();
      loop(cb);
    }, loopTimeout);
  };

  loop(() => {
    if (state === STATES.win && nodes.length > 0) {
      loopTimeout = 1;
      nodes = nodes.slice(0, nodes.length - 1);

      return;
    } else if (state !== STATES.running) {
      return;
    }

    frame = frame + 1;

    if (nodes.length >= maxNodes) {
      state = STATES.win;
      return;
    }

    let ateFood = false;
    let overlapping = false;

    const newNodes = nodes.map((n, i) => {
      let newPos;

      if (i === 0) {
        newPos = { x: n.x + direction.x, y: n.y + direction.y };
      } else {
        newPos = { x: nodes[i - 1].x, y: nodes[i - 1].y };
      }

      if (newPos.x > gridSize.x) {
        newPos.x = 0;
      }
      if (newPos.x < 0) {
        newPos.x = gridSize.x;
      }
      if (newPos.y > gridSize.y) {
        newPos.y = 0;
      }
      if (newPos.y < 0) {
        newPos.y = gridSize.y;
      }

      if (nodesMatch(foodPos, newPos)) {
        ateFood = true;
      }

      return newPos;
    });

    if (
      newNodes.find((a) =>
        newNodes.find((b) => a !== b && a.x === b.x && a.y === b.y),
      )
    ) {
      state = STATES.gameover;
      return;
    }

    if (ateFood) {
      score = score + 1;
      newNodes.push({ x: -9999, y: -9999 });
      foodPos = getFoodPos(nodes);
    }

    nodes = newNodes;

    nodes.forEach((node) => {
      const match = nodes.find((n) => node !== n && areOverlapping(node, n));
      if (match) {
        overlapping = true;
      }
    });

    if (overlapping) {
      state = STATES.gameover;
    }
  });

  return (
    <div className="container">
      <div
        className="bg"
        style={{
          position: "absolute",
          left: "0px",
          top: "0px",
          width: `${(gridSize.x + 1) * 30}px`,
          height: `${(gridSize.y + 1) * 30}px`,
          backgroundImage: `linear-gradient(to right, rgb(204 204 204 / 26%) 1px, transparent 1px),
                            linear-gradient(to bottom, rgb(204 204 204 / 26%) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          boxSizing: "border-box",
          boxShadow: "inset 0 0 0 2px rgb(204 204 204 / 26%)",
        }}
      ></div>

      {compute(() => {
        if (state === STATES.running) return "";

        return (
          <div>
            <h1>
              {state === STATES.win
                ? "You win, Congrats!"
                : state.toUpperCase()}
            </h1>
            <span className="code">"Press any button to restart."</span>
          </div>
        );
      })}
      {observableArray(
        nodes,
        {
          getKey: (item) => `${item.x}-${item.y}`,
        },

        (item, i) => (
          <span
            className="snake"
            style={{
              background: "rgb(28, 240, 152)",
              width: "30px",
              height: "30px",
              position: "absolute",
              left: compute(`${item.x * 30}px`),
              top: compute(`${item.y * 30}px`),
              opacity: 0.7,
            }}
          />
        ),
      )}

      {compute(
        foodPos ? (
          <span>
            <Component_Food pos={foodPos} />
          </span>
        ) : null,
      )}
      <h4 style={{ position: "fixed", bottom: "20px", right: "20px" }}>
        Score: {score}
      </h4>
    </div>
  );
};

console.time("render app");
renderDOM(<Component_App />, "root");
console.timeEnd("render app");
