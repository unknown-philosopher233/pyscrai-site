const examples = {
  authored: {
    effect: 'Authored effect',
    gate: 'Runtime checks',
    note: 'Rules resolve the effect.',
  },
  assisted: {
    effect: 'Declared gap',
    gate: 'Runtime checks',
    note: 'A model fills an explicitly defined gap.',
  },
  reviewed: {
    effect: 'Generated effect',
    gate: 'Director review',
    note: 'Approval is required before commitment.',
  },
  automatic: {
    effect: 'Generated effect',
    gate: 'Limits check',
    note: 'Authorized effects commit within policy limits.',
  },
};

const controls = document.querySelector('.mode-buttons');
const trace = document.querySelector('.trace');
const effect = document.querySelector('#effect');
const gate = document.querySelector('#gate');
const note = document.querySelector('#mode-note');

for (const button of controls.querySelectorAll('button')) {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    const example = examples[mode];
    for (const option of controls.querySelectorAll('button')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    trace.dataset.mode = mode;
    effect.textContent = example.effect;
    gate.textContent = example.gate;
    note.textContent = example.note;
  });
}
controls.hidden = false;

const canvas = document.querySelector('#system-graph');
const field = canvas.parentElement;
const context = canvas.getContext('2d');

function drawSystemGraph() {
  const {width, height} = field.getBoundingClientRect();
  if (!width || !height) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  context.setTransform(density, 0, 0, density, 0, 0);

  context.strokeStyle = '#7da9ce16';
  context.lineWidth = 1;
  context.beginPath();
  for (let x = 14.5; x < width; x += 26) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = 14.5; y < height; y += 26) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  // Project a synthetic terrain grid behind the session flow.
  const project = (x, y) => {
    const elevation = 1.25 * Math.exp(-((x + .8) ** 2 + (y - 1.1) ** 2) / 7)
      + .64 * Math.sin(.98 * x + .29 * y) * Math.cos(.68 * y)
      + .29 * Math.sin(.72 * (x - y));
    return [
      width * (.51 + (x - y) * .064),
      height * (.56 + (x + y) * .041 - elevation * .16),
    ];
  };

  for (let gridLine = -6; gridLine <= 6; gridLine += .4) {
    context.beginPath();
    for (let point = -6; point <= 6; point += .15) {
      const [x, y] = project(gridLine, point);
      if (point === -6) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = '#52b7d64e';
    context.stroke();

    context.beginPath();
    for (let point = -6; point <= 6; point += .15) {
      const [x, y] = project(point, gridLine);
      if (point === -6) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = '#669dcd39';
    context.stroke();
  }

  const pointFor = (selector) => {
    const node = field.querySelector(selector);
    return [node.offsetLeft, node.offsetTop];
  };

  const scenario = pointFor('.scenario');
  const runtime = pointFor('.runtime');
  const state = pointFor('.state');
  const evidence = pointFor('.evidence');

  function connect(start, end, accented) {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const elbow = (x1 + x2) / 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(elbow, y1);
    context.lineTo(elbow, y2);
    context.lineTo(x2, y2);
    context.lineWidth = 1.5;
    context.strokeStyle = accented ? '#83e4ef' : '#7eb4d6bd';
    context.shadowColor = '#70d8ee';
    context.shadowBlur = accented ? 9 : 0;
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = accented ? '#a0f2ff' : '#82b7d6';
    context.fillRect(elbow - 2, y2 - 2, 4, 4);
  }

  connect(scenario, runtime, true);
  connect(runtime, state, true);
  connect(runtime, evidence, false);
}

if (context) {
  const observer = new ResizeObserver(drawSystemGraph);
  observer.observe(field);
  drawSystemGraph();
}
