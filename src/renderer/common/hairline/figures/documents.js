/** Three working sheets: CV, project, and job. The sheet beneath the pointer lifts. */
const {
  Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put, reducedMotion,
  register, rings, seg, solid, tdone, tset, tval, tween,
} = HL;

const W = 82, H = 102, X = [0, 35, 70], Y = [0, 4, 8];
const REST = [0, 4, 8], LIFT = 29, TH = 2;
const LABELS = ["CV", "project", "job"];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stagger = value, active = -1;
  const C = Cam(45, 0.5, 1.7);
  fit(C, [[-8, -8, 0], [X[2] + W + 8, Y[2] + H + 8, 0], [0, 0, REST[2] + LIFT + TH], [X[2] + W, H, REST[2] + LIFT + TH]], 200, 165);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);

  const pages = X.map((x, i) => {
    const g = mk("g", {}, root), plate = solid(g);
    const marks = mk("path", { class: "nf" }, g);
    const dots = mk("path", { class: "nf lo" }, g);
    return { x, y: Y[i], g, plate, marks, dots, rise: tween(REST[i]) };
  });

  function draw(i, z) {
    const page = pages[i], { x, y } = page;
    const [outer, inner] = rings(x, y, x + W, y + H, 5, 1.3);
    put(page.plate, prism(P, front, outer, inner, z, z + TH));
    const at = (u, v) => P(x + u, y + v, z + TH + 0.1);
    let rules = "", details = "";
    if (i === 0) {
      // CV: a broad name, short contact line, and three bullets.
      rules += seg(at(11, 15), at(55, 15)) + seg(at(11, 22), at(42, 22));
      rules += seg(at(11, 32), at(70, 32));
      for (let row = 0; row < 3; row++) {
        rules += seg(at(19, 46 + row * 15), at(61 - row * 6, 46 + row * 15));
        details += seg(at(12, 46 + row * 15), at(13.5, 46 + row * 15));
      }
    } else if (i === 1) {
      // Project: an offset folder tab, path rule, and indented source lines.
      rules += seg(at(10, 13), at(28, 13)) + seg(at(28, 13), at(34, 20));
      rules += seg(at(10, 27), at(67, 27));
      for (let row = 0; row < 4; row++) {
        const indent = row % 2 ? 24 : 17;
        rules += seg(at(indent, 43 + row * 12), at(64 - row * 3, 43 + row * 12));
        details += seg(at(11, 43 + row * 12), at(13, 43 + row * 12));
      }
    } else {
      // Job: title, section break, and grouped requirement lines.
      rules += seg(at(11, 15), at(65, 15)) + seg(at(11, 23), at(45, 23));
      rules += seg(at(11, 35), at(70, 35));
      for (let row = 0; row < 3; row++) {
        rules += seg(at(18, 49 + row * 14), at(68 - row * 7, 49 + row * 14));
        details += seg(at(11, 49 + row * 14), at(13, 49 + row * 14));
      }
    }
    page.marks.setAttribute("d", rules);
    page.dots.setAttribute("d", details);
  }

  const loop = register(stage, (_dt, now) => {
    let moving = false;
    pages.forEach((page, i) => {
      if (!reducedMotion() && !tdone(page.rise, now)) moving = true;
      draw(i, tval(page.rise, now));
    });
    return moving;
  });
  bag.add(loop.unregister);

  const centers = pages.map((page, i) => P(page.x + W / 2, page.y + H / 2, REST[i] + TH));
  function hit([sx, sy]) {
    const nearest = centers.map(([x, y], i) => ({ i, d: Math.hypot(sx - x, sy - y) }))
      .sort((a, b) => a.d - b.d)[0];
    return nearest.d < 78 ? nearest.i : -1;
  }
  function choose(index) {
    if (active === index) return;
    const from = index < 0 ? active : index;
    active = index;
    const now = globalThis.performance.now();
    pages.forEach((page, i) => {
      tset(page.rise, REST[i] + (i === index ? LIFT : 0), now, Math.abs(i - from) * stagger);
      page.plate.sil.classList.toggle("hi", i === (index < 0 ? 2 : index));
    });
    read.textContent = index < 0 ? "rest" : LABELS[index];
    loop.wake();
  }
  pages.forEach((page, i) => draw(i, REST[i]));
  pages[2].plate.sil.classList.add("hi");
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (point) => choose(hit(point)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return {
    set: (next) => { stagger = clamp(next, 0, 90); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "documents",
  means: "A CV, a project folder, and a job posting rest as a working stack; the sheet under the pointer lifts into view.",
  rules: [1, 2, 4, 5, 8, 9],
  range: [0, 40, 90],
  tour: [[136, 168], [193, 152], [250, 134], null],
  mount,
});
