/** A project folder fans its service sheets toward the pointer. */
const { Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put, reducedMotion, register, rings, seg, solid, tdone, tset, tval, tween } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let spread = value, active = -1;
  const C = Cam(45, 0.5, 1.8);
  fit(C, [[-12, -18, 0], [145, 125, 0], [0, 0, 48], [145, 125, 48]], 200, 166);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  const base = solid(root), tab = solid(root);
  const [br, bi] = rings(0, 0, 133, 105, 7, 1.6);
  const [tr, ti] = rings(0, -11, 47, 9, 4, 1);
  put(tab, prism(P, front, tr, ti, 0, 3));
  put(base, prism(P, front, br, bi, 0, 4));
  const cards = [0, 1, 2].map((i) => {
    const g = mk("g", {}, root), sheet = solid(g), marks = mk("path", { class: "nf lo" }, g);
    return { i, x: 14 + i * 20, y: 15 + i * 7, z: 5 + i * 2.5, sheet, marks, rise: tween(0), last: NaN };
  });
  function draw(card, dz) {
    if (card.last === dz) return;
    card.last = dz;
    const { x, y, z, i } = card, top = z + dz;
    const [r, cr] = rings(x, y, x + 65, y + 72, 4, 1.1);
    put(card.sheet, prism(P, front, r, cr, top, top + 2));
    card.marks.setAttribute("d", seg(P(x + 9, y + 13, top + 2.2), P(x + 41, y + 13, top + 2.2)) +
      seg(P(x + 9, y + 28, top + 2.2), P(x + 51 - i * 4, y + 28, top + 2.2)) +
      seg(P(x + 9, y + 41, top + 2.2), P(x + 45, y + 41, top + 2.2)));
  }
  cards.forEach((card) => draw(card, 0));
  cards[2].sheet.sil.classList.add("hi");
  const loop = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((card) => {
      draw(card, tval(card.rise, now));
      if (!reducedMotion() && !tdone(card.rise, now)) moving = true;
    });
    return moving;
  });
  bag.add(loop.unregister);
  const centers = cards.map((card) => P(card.x + 33, card.y + 34, card.z + 2));
  function hit([x, y]) {
    const nearest = centers.map(([cx, cy], i) => ({ i, d: Math.hypot(x - cx, y - cy) })).sort((a, b) => a.d - b.d)[0];
    return nearest.d < 44 ? nearest.i : -1;
  }
  function choose(index) {
    if (index === active) return;
    const from = index < 0 ? active : index;
    active = index;
    const now = globalThis.performance.now();
    cards.forEach((card) => {
      tset(card.rise, card.i === index ? spread : 0, now, Math.abs(card.i - from) * 40);
      card.sheet.sil.classList.toggle("hi", card.i === (index < 0 ? 2 : index));
    });
    read.textContent = index < 0 ? "rest" : `service ${index + 1}`;
    loop.wake();
  }
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (point) => choose(hit(point)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { spread = clamp(next, 0, 32); }, destroy: bag.dispose };
}

hairline({
  name: "project-folder",
  means: "A parent folder holds service sheets; the service under the pointer rises from the fan.",
  rules: [1, 2, 4, 5, 7, 8, 9],
  range: [0, 18, 32],
  tour: [[183, 168], [197, 183], [211, 199], null],
  mount,
});
