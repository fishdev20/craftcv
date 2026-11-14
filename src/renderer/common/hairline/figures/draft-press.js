/** One source line crosses the desk to become a CV line. */
const { Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put, reducedMotion, register, rings, seg, solid, tdone, tset, tval, tween } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let arc = value, active = -1;
  const C = Cam(45, 0.5, 1.55);
  fit(C, [[-10, -10, 0], [196, 117, 0], [0, 0, 42], [196, 117, 42]], 200, 166);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  const source = solid(root), draft = solid(root);
  const [sr, si] = rings(0, 0, 76, 101, 5, 1.2);
  const [dr, di] = rings(113, 0, 189, 101, 5, 1.2);
  put(source, prism(P, front, sr, si, 0, 2));
  put(draft, prism(P, front, dr, di, 0, 2));
  const sourceMarks = mk("path", { class: "nf lo" }, root);
  const targetMarks = mk("path", { class: "nf lo" }, root);
  const line = (x, y, z, length) => seg(P(x, y, z), P(x + length, y, z));
  sourceMarks.setAttribute("d", line(10, 15, 2.2, 45) + line(10, 24, 2.2, 33) + line(10, 44, 2.2, 52) + line(10, 64, 2.2, 46) + line(10, 84, 2.2, 39));
  targetMarks.setAttribute("d", line(123, 15, 2.2, 44) + line(123, 24, 2.2, 32) + line(123, 44, 2.2, 50) + line(123, 64, 2.2, 45) + line(123, 84, 2.2, 38));
  const strip = solid(root), stripMark = mk("path", { class: "nf lo" }, root);
  strip.sil.classList.add("hi");
  const move = tween(0), row = tween(44);
  let lastMove = NaN, lastRow = NaN;
  function draw(progress, sourceY) {
    if (progress === lastMove && sourceY === lastRow) return;
    lastMove = progress; lastRow = sourceY;
    const x = 8 + progress * 113, y = sourceY + progress * (53 - sourceY), z = 3 + Math.sin(progress * Math.PI) * arc;
    const [r, cr] = rings(x, y, x + 55, y + 13, 3, 0.8);
    put(strip, prism(P, front, r, cr, z, z + 2));
    stripMark.setAttribute("d", line(x + 8, y + 7, z + 2.2, 38));
  }
  draw(0, 44);
  const loop = register(stage, (_dt, now) => {
    draw(tval(move, now), tval(row, now));
    return !reducedMotion() && (!tdone(move, now) || !tdone(row, now));
  });
  bag.add(loop.unregister);
  const sources = [P(38, 50, 4), P(38, 70, 4)];
  const target = P(150, 60, 4);
  function hit([x, y]) {
    const options = [...sources, target].map(([cx, cy], i) => ({ i, d: Math.hypot(x - cx, y - cy) })).sort((a, b) => a.d - b.d);
    return options[0].d < 37 ? options[0].i : -1;
  }
  function choose(index) {
    if (index === active) return;
    active = index;
    const now = globalThis.performance.now();
    tset(row, index === 1 ? 64 : 44, now, 0);
    tset(move, index < 0 ? 0 : 1, now, 0);
    read.textContent = index < 0 ? "rest" : index === 2 ? "draft" : `source ${index + 1}`;
    loop.wake();
  }
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (point) => choose(hit(point)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { arc = clamp(next, 0, 28); }, destroy: bag.dispose };
}

hairline({
  name: "draft-press",
  means: "A source line travels from project evidence to the CV draft when the pointer chooses it.",
  rules: [1, 4, 5, 7, 8, 9],
  range: [0, 14, 28],
  tour: [[144, 151], [131, 163], [255, 218], null],
  mount,
});
