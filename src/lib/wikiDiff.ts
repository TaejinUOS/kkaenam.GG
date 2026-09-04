/**
 * 편집 차이 계산 — 초록·빨강 형광펜의 근거이자, 즉시 반영 판정의 근거.
 *
 * **클라이언트와 서버가 같은 함수를 쓴다.** 편집기는 타이핑할 때마다 이 결과로 색을
 * 칠하고, 서버는 저장 시점에 같은 함수로 "지운 것이 있는가"를 다시 판정한다. 둘이
 * 어긋나면 화면에 초록만 보이는데 검토 대기로 가는 일이 생긴다. 그래서 `server-only`를
 * import하지 않는다 — 이 파일만은 양쪽에 실려야 한다.
 *
 * 판정 규칙은 `docs/WIKI_MODEL.md` "편집에는 두 갈래가 있다"에 있다.
 */

export type DiffOp = {
  type: "equal" | "add" | "remove";
  text: string;
};

/**
 * 낱말 단위로 자른다. 공백 덩어리도 하나의 토큰이라 이어 붙이면 원문이 그대로 나온다 —
 * 형광펜을 칠하려면 원문을 한 글자도 잃지 않고 복원할 수 있어야 한다.
 *
 * 글자 단위로 자르지 않는 것은 결과를 읽을 수 있게 하기 위해서다. `12초`를 `13초`로
 * 고쳤을 때 `2`만 빨갛고 `3`만 초록이면 무엇이 바뀌었는지 오히려 보이지 않는다.
 */
function tokenize(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? [];
}

/**
 * LCS 표의 크기 상한. 본문이 4000자라 토큰은 많아야 4000개이고, 최악의 경우
 * 4000×4000 = 1600만 칸(64MB)이 된다. Worker 한 요청에 그만한 배열을 잡을 수 없다.
 *
 * 상한을 넘으면 가운데를 통째로 "지우고 다시 씀"으로 본다. **안전한 쪽으로 틀린다** —
 * 검토 대기로 보내지, 검토 없이 반영해 버리지 않는다.
 */
const MAX_CELLS = 1_500_000;

/** 같은 종류가 이어지면 한 덩어리로 합친다. 형광펜이 토막나 보이지 않게. */
function append(ops: DiffOp[], type: DiffOp["type"], text: string): void {
  if (!text) return;
  const last = ops[ops.length - 1];
  if (last && last.type === type) last.text += text;
  else ops.push({ type, text });
}

function lcsDiff(a: string[], b: string[]): DiffOp[] {
  const ops: DiffOp[] = [];
  const n = a.length;
  const m = b.length;

  if (n === 0 || m === 0) {
    append(ops, "remove", a.join(""));
    append(ops, "add", b.join(""));
    return ops;
  }

  // table[i][j] = a[i..], b[j..]의 최장 공통 부분수열 길이. 뒤에서부터 채워야
  // 앞에서부터 되짚으며 원문 순서대로 연산을 뽑을 수 있다.
  const width = m + 1;
  const table = new Int32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? table[(i + 1) * width + (j + 1)] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + (j + 1)]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      append(ops, "equal", a[i]);
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + (j + 1)]) {
      append(ops, "remove", a[i]);
      i++;
    } else {
      append(ops, "add", b[j]);
      j++;
    }
  }
  while (i < n) append(ops, "remove", a[i++]);
  while (j < m) append(ops, "add", b[j++]);

  return ops;
}

/**
 * `before`를 `after`로 바꾸는 데 필요한 연산 목록.
 *
 * `equal`과 `remove`의 텍스트를 이으면 `before`가, `equal`과 `add`를 이으면 `after`가
 * 정확히 복원된다. 편집기의 왼쪽·오른쪽 화면이 이 성질에 기대고 있다.
 */
export function diffWords(before: string, after: string): DiffOp[] {
  const a = tokenize(before);
  const b = tokenize(after);

  /*
   * 앞뒤로 같은 부분을 먼저 떼어 낸다. "글 끝에 한 문단 덧붙이기"처럼 가장 흔한
   * 편집에서는 이것만으로 가운데가 비어 LCS 표를 아예 만들지 않게 된다.
   */
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;

  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }

  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);

  const ops: DiffOp[] = [];
  append(ops, "equal", a.slice(0, head).join(""));

  if (midA.length * midB.length > MAX_CELLS) {
    append(ops, "remove", midA.join(""));
    append(ops, "add", midB.join(""));
  } else {
    for (const op of lcsDiff(midA, midB)) append(ops, op.type, op.text);
  }

  append(ops, "equal", a.slice(a.length - tail).join(""));
  return ops;
}

/**
 * 빨간 형광펜이 하나라도 있는가 — 즉시 반영과 검토 대기를 가르는 판정이다.
 *
 * **공백만 지운 것은 지운 것으로 보지 않는다.** 줄바꿈을 넣거나 띄어쓰기를 고치는 일은
 * 글을 지우는 일이 아닌데, 그것까지 검토로 보내면 문단을 나누기만 해도 며칠을 기다리게
 * 된다. 그래서 사라진 조각에 글자가 남아 있을 때만 지운 것으로 센다.
 */
export function hasRemoval(ops: DiffOp[]): boolean {
  return ops.some((op) => op.type === "remove" && op.text.trim() !== "");
}

/** 더하기만 한 편집인가. 서버의 즉시 반영 판정이 이 함수 하나로 끝난다. */
export function isAdditionOnly(before: string, after: string): boolean {
  return !hasRemoval(diffWords(before, after));
}

export type DiffStats = {
  /** 늘어난 글자 수. 공백은 세지 않는다 — 사람이 "얼마나 썼는지"로 읽는 숫자다. */
  added: number;
  removed: number;
};

export function diffStats(ops: DiffOp[]): DiffStats {
  let added = 0;
  let removed = 0;
  for (const op of ops) {
    const length = op.text.replace(/\s+/g, "").length;
    if (op.type === "add") added += length;
    else if (op.type === "remove") removed += length;
  }
  return { added, removed };
}
