/** A CV page whose evidence lines lift one at a time. */
const { Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put, reducedMotion, register, rings, seg, solid, tdone, tset, tval, tween } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, active = -1;
  const C = Cam(45, 0.5, 1.9);
  fit(C, [[-8, -7, 0], [104, 141, 0], [0, 0, 48], [104, 141, 48]], 200, 166);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  const page = solid(root);
  const [outer, inner] = rings(0, 0, 96, 132, 5, 1.3);
  put(page, prism(P, front, outer, inner, 0, 2));
  const at = (x, y) => P(x, y, 2.2);
  mk("path", { class: "nf", d: seg(at(12, 14), at(65, 14)) + seg(at(12, 22), at(51, 22)) + seg(at(12, 34), at(81, 34)) }, root);
  const rows = [49, 74, 99].map((y, i) => {
    const g = mk("g", {}, root), shape = solid(g);
    const mark = mk("path", { class: "nf lo" }, g);
    return { y, i, shape, mark, rise: tween([2.4, 3.8, 2.8][i]), last: NaN };
  });
  function draw(row, z) {
    if (row.last === z) return;
    row.last = z;
    const [ring, crease] = rings(11, row.y, 85, row.y + 16, 3.5, 0.9);
    put(row.shape, prism(P, front, ring, crease, z, z + 1.8));
    row.mark.setAttribute("d", seg(P(24, row.y + 8, z + 2), P(72 - row.i * 7, row.y + 8, z + 2)) + seg(P(17, row.y + 8, z + 2), P(18, row.y + 8, z + 2)));
  }
  rows.forEach((row) => draw(row, tval(row.rise, globalThis.performance.now())));
  rows[0].shape.sil.classList.add("hi");
  const loop = register(stage, (_dt, now) => {
    let moving = false;
    rows.forEach((row) => {
      draw(row, tval(row.rise, now));
      if (!reducedMotion() && !tdone(row.rise, now)) moving = true;
    });
    return moving;
  });
  bag.add(loop.unregister);
  const centers = rows.map((row) => P(48, row.y + 8, 4));
  function hit([x, y]) {
    const nearest = centers.map(([cx, cy], i) => ({ i, d: Math.hypot((x - cx) * 0.85, y - cy) })).sort((a, b) => a.d - b.d)[0];
    return nearest.d < 27 ? nearest.i : -1;
  }
  function choose(index) {
    if (index === active) return;
    active = index;
    const now = globalThis.performance.now();
    rows.forEach((row) => {
      tset(row.rise, [2.4, 3.8, 2.8][row.i] + (row.i === index ? lift : 0), now, Math.abs(row.i - index) * 35);
      row.shape.sil.classList.toggle("hi", row.i === (index < 0 ? 0 : index));
    });
    read.textContent = index < 0 ? "rest" : `line ${index + 1}`;
    loop.wake();
  }
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (point) => choose(hit(point)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { lift = clamp(next, 0, 35); }, destroy: bag.dispose };
}

hairline({
  name: "cv-sheet",
  means: "A CV page holds three evidence lines; the line under the pointer lifts for a closer look.",
  rules: [1, 4, 5, 7, 8, 9],
  range: [0, 18, 35],
  tour: [[213, 187], [180, 204], [146, 221], null],
  mount,
});
