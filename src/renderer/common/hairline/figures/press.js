/**
 * Press: a code file and a CV sheet lie side by side on a desk. One at a time
 * a line of code lifts off the file, arcs across and settles into an empty
 * bullet on the CV, where it waits, bright, until the next one lifts; after the
 * fourth the CV clears and the press starts again. The clock never stops. Hovering slows it on a spring, so
 * a line in flight can be followed. The slider is the hover rate.
 *
 * The pattern: ambient time, dilated by the pointer. One spring on the rate,
 * a hit test on the static desk, and one bright line: the one being carried.
 */
const {
  Cam, EASE_LIFT, clamp, facing, fit, lerp, prism, proj, rings, seg, unproj,
  disposer, flatDot, mk, place, pointer, put, reducedMotion, register, solid, spring, stepS,
} = HL;

const W = 64, L = 86, TH = 2, R = 4, GAP = 30;
const CX = 0, VX = W + GAP;                                  // the code file's and the CV's near-left x
const CODE = [[0, 30], [6, 24], [12, 20], [12, 28], [6, 16], [12, 22], [0, 26], [6, 14]];
const ROW = (k) => 12 + k * 9.4;                             // code rows, from the top of the page
const PICK = [1, 3, 5, 6];                                   // the code lines that become evidence
const BUL = [34, 28, 31, 24];                                // the CV's four bullet lengths
const BROW = (j) => 34 + j * 13;
const T = 1.5, CYCLE = PICK.length, LIFT = 6, ARC = 24, BAR = 3.2;
const REST_AT = 2.4 * T;                                     // the pose shown when motion is reduced: a line at the top of its arc

/** Where a carried line sits: its two ends on the desk, x0..x1 at row y. */
const src = (j) => { const [ind, len] = CODE[PICK[j]]; return [CX + 12 + ind, CX + 12 + ind + len, ROW(PICK[j])]; };
const dst = (j) => [VX + 16, VX + 16 + BUL[j], BROW(j)];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let slowTo = value, over = false;

  const C = Cam(45, 0.5, 1.78);
  fit(C, [[CX, 0, 0], [VX + W, L, 0], [VX + W, 0, 0], [CX, L, 0], [W / 2 + GAP / 2, L / 2, TH + LIFT + ARC + 4]], 200, 166);
  const P = proj(C), front = facing(C), at = (x, y, z = TH) => P(x, y, z);
  const g = mk("g", {}, svg);

  /** A sheet: a thin rounded plate, its crease one unit in. */
  function sheet(x0) {
    const [ring, inner] = rings(x0, 0, x0 + W, L, R, 1.2);
    put(solid(g), prism(P, front, ring, inner, 0, TH));
  }

  // the code file, far: a gutter of line marks and eight indented lines
  sheet(CX);
  const code = mk("path", { class: "nf lo" }, g);
  code.setAttribute("d", CODE.map(([ind, len], k) => seg(at(CX + 12 + ind, ROW(k)), at(CX + 12 + ind + len, ROW(k)))).join(""));
  CODE.forEach((_, k) => place(flatDot(g, C, 0.9, "dot off"), at(CX + 6, ROW(k))));

  // the CV, near: a name bar over a rule, and four bullet slots that fill
  sheet(VX);
  const head = mk("path", { class: "nf" }, g);
  head.setAttribute("d", seg(at(VX + 10, 11), at(VX + 42, 11)) + seg(at(VX + 10, 14), at(VX + 42, 14)));
  const sub = mk("path", { class: "nf lo" }, g);
  sub.setAttribute("d", seg(at(VX + 10, 21), at(VX + 34, 21)));
  const slots = BUL.map((_, j) => {
    const [x0, x1, y] = dst(j);
    const line = mk("path", { class: "nf dash" }, g);
    line.setAttribute("d", seg(at(x0, y), at(x1, y)));
    const dot = flatDot(g, C, 1.1, "dot off");
    place(dot, at(VX + 10, y));
    return { line, dot, full: false };
  });

  // the carried line: a slim rounded bar, the only bright thing on the desk
  const bar = solid(g);
  bar.sil.classList.add("hi");

  /** Draws the bar for transfer j at progress p in 0..1. */
  function carry(j, p) {
    const a = src(j), b = dst(j);
    let u = 0, z;
    if (p < 0.15) z = TH + LIFT * EASE_LIFT(p / 0.15);
    else if (p < 0.65) { u = EASE_LIFT((p - 0.15) / 0.5); z = TH + LIFT + ARC * Math.sin(Math.PI * u); }
    else { u = 1; z = TH + LIFT * (1 - EASE_LIFT(Math.min(1, (p - 0.65) / 0.15))); }
    const x0 = lerp(a[0], b[0], u), x1 = lerp(a[1], b[1], u), y = lerp(a[2], b[2], u);
    const [ring, inner] = rings(x0, y - BAR / 2, x1, y + BAR / 2, BAR / 2, 0.6);
    put(bar, prism(P, front, ring, inner, z, z + 1.4));
  }

  let t = 0, last = "";
  const rate = spring(1);
  function draw() {
    const c = (t % (CYCLE * T)) / T, j = Math.floor(c), p = c - j;
    slots.forEach((s, k) => {
      const full = k < j;
      if (full === s.full) return;
      s.full = full;
      s.line.setAttribute("class", full ? "nf" : "nf dash");
      s.dot.setAttribute("class", full ? "dot m" : "dot off");
    });
    carry(j, p);
    const text = over ? "line " + (PICK[j] + 1) : "rest";
    if (text !== last) read.textContent = last = text;
  }

  const B = register(stage, (dt) => {
    if (reducedMotion()) { t = REST_AT; draw(); return false; }
    stepS(rate, dt);
    t += dt * rate.x;
    draw();
    return true;
  });
  bag.add(B.unregister);

  // the desk under both sheets never moves: test the pointer on the ground plane against it
  const onDesk = ([sx, sy]) => {
    const [x, y] = unproj(C, sx, sy, TH);
    return x > CX - 8 && x < VX + W + 8 && y > -8 && y < L + 8;
  };
  bag.add(pointer(stage, {
    move: (pt) => { over = onDesk(pt); rate.t = over ? slowTo : 1; B.wake(); },
    leave: () => { over = false; rate.t = 1; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { slowTo = clamp(v, 0.02, 1); if (over) rate.t = slowTo; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "press",
  means: "A line of code lifts off the file and settles as a bullet on the CV; hovering slows the press so one can be followed.",
  rules: [1, 4, 5, 7, 8],
  range: [0.6, 0.25, 0.06],
  tour: [[150, 150], [215, 110], [275, 190], null],
  mount,
});
