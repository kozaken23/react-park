import { useState } from "react";
import "./App.css";

type Center = {
  name: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
};

const attractionPasses: Record<string, string> = {
  観覧車: "public/img/ferriswheel.png",
  メリーゴーランド: "public/img/merrygoround.png",
  コースター: "public/img/coaster.png",
  フリーフォール: "public/img/freefall.png",
  コーヒーカップ: "public/img/coffeecup.png",
  お化け屋敷: "public/img/ghosthouse.png",
  バイキング: "public/img/viking.png"
};

const attractions = [
  "観覧車",
  "メリーゴーランド",
  "コースター",
  "フリーフォール",
  "コーヒーカップ",
  "お化け屋敷",
  "バイキング",
];

const filenameMap: Record<string, string> = {
  観覧車: "ferriswheel",
  メリーゴーランド: "merrygoround",
  コースター: "coaster",
  フリーフォール: "freefall",
  コーヒーカップ: "coffeecup",
  お化け屋敷: "ghosthouse",
  バイキング: "viking",
};

const attractionSize: Record<string, { w: number; h: number }> = {
  観覧車: { w: 9, h: 3 },
  メリーゴーランド: { w: 2, h: 2 },
  コースター: { w: 13, h: 3 },
  フリーフォール: { w: 1, h: 1 },
  コーヒーカップ: { w: 3, h: 3 },
  お化け屋敷: { w: 5, h: 3 },
  バイキング: { w: 5, h: 2 },
};

const cz: Record<string, number> = {
  観覧車: 0,
  メリーゴーランド: 0,
  コースター: 0,
  フリーフォール: 0,
  コーヒーカップ: 0,
  お化け屋敷: 0,
  バイキング: 0,
};

const rotations = [0, 90, 180, 270];

export default function App() {
  const [selectedAttraction, setSelectedAttraction] = useState("観覧車");
  const [selectedRotation, setSelectedRotation] = useState(0);

  const [mode, setMode] = useState<"place" | "select">("place");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null); // 何これ

  const [grid, setGrid] = useState(
    Array.from({ length: 11 }, () =>
      Array.from({ length: 19 }, () => ({ name: "", rotation: 0 }))
    )
  );

  const [center, setCenter] = useState<Center[]>([]);

  // ★ 上書き保存用ファイルハンドル
  const [fileHandle, setFileHandle] =
    useState<FileSystemFileHandle | null>(null);

  const handlePlace = (cy: number, cx: number) => {
    const baseSize = attractionSize[selectedAttraction];
    if (!baseSize) return;

    const w =
      selectedRotation === 90 || selectedRotation === 270
        ? baseSize.h
        : baseSize.w;
    const h =
      selectedRotation === 90 || selectedRotation === 270
        ? baseSize.w
        : baseSize.h;

    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    for (let dy = -halfH; dy <= halfH; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        const y = cy + dy;
        const x = cx + dx;
        if (
          y < 0 ||
          y >= grid.length ||
          x < 0 ||
          x >= grid[0].length ||
          grid[y][x].name !== ""
        ) {
          alert("ここには配置できません");
          return;
        }
      }
    }

    const newGrid = grid.map((row) => row.slice());

    for (let dy = -halfH; dy <= halfH; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        const y = cy + dy;
        const x = cx + dx;
        newGrid[y][x] = {
          name: selectedAttraction,
          rotation: selectedRotation,
        };
      }
    }

    setGrid(newGrid);

    setCenter((prev) => [
      ...prev.filter((c) => !(c.x === cx && c.y === cy)),
      {
        name: selectedAttraction,
        x: cx,
        y: cy,
        z: cz[selectedAttraction] ?? 0,
        rotation: selectedRotation,
      },
    ]);
  };

  const handleSelect = (y: number, x: number) => {
    const cell = grid[y][x];
    if (!cell.name) {
      setSelectedCenter(null);
      return;
    }

    // クリックしたセルが含まれる「中心」を探索
    const target = center.find((c) => {
      const baseSize = attractionSize[c.name];
      if (!baseSize) return false;

      const w = c.rotation === 90 || c.rotation === 270 ? baseSize.h : baseSize.w;
      const h = c.rotation === 90 || c.rotation === 270 ? baseSize.w : baseSize.h;

      const halfW = Math.floor(w / 2);
      const halfH = Math.floor(h / 2);

      return (
        x >= c.x - halfW &&
        x <= c.x + halfW &&
        y >= c.y - halfH &&
        y <= c.y + halfH
      );
    });

    setSelectedCenter(target ?? null);
  };

  const handleDelete = () => {
    if (!selectedCenter) return;

    const c = selectedCenter;
    const baseSize = attractionSize[c.name];
    if (!baseSize) return;

    const w = c.rotation === 90 || c.rotation === 270 ? baseSize.h : baseSize.w;
    const h = c.rotation === 90 || c.rotation === 270 ? baseSize.w : baseSize.h;

    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // gridから削除
    const newGrid = grid.map((row) => row.slice());
    for (let dy = -halfH; dy <= halfH; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        const y = c.y + dy;
        const x = c.x + dx;
        if (y < 0 || y >= newGrid.length) continue;
        if (x < 0 || x >= newGrid[0].length) continue;

        newGrid[y][x] = { name: "", rotation: 0 };
      }
    }
    setGrid(newGrid);

    // centerからも削除
    setCenter((prev) => prev.filter((p) => !(p.x === c.x && p.y === c.y)));

    setSelectedCenter(null);
    setMode("place");
  }

  // ★ 本当の「上書き保存」
  const handleExport = async () => {
    let data = "";

    // アトラクション中心座標
    center.forEach((c) => {
      const filename = filenameMap[c.name] ?? "unknown";
      data += `${filename},${c.x},${-c.y},${c.z},${c.rotation}\n`;
    });

    // empty マスを配列に集める
    const emptyCells: { x: number; y: number }[] = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x].name === "") {
          emptyCells.push({ x, y });
        }
      }
    }

    // シャッフル（Fisher–Yates）
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }

    // 先頭 10 個を使用（足りなければある分だけ）
    const selectedEmpty = emptyCells.slice(0, 10);

    data += "\n# random_empty_cells\n";
    selectedEmpty.forEach((cell) => {
      data += `empty,${cell.x},${-cell.y},0,0\n`;
    });

    // ブラウザ対応チェック
    if (!("showSaveFilePicker" in window)) {
      alert("このブラウザは上書き保存に対応していません（Chrome推奨）");
      return;
    }

    let handle = fileHandle;

    try {
      if (!handle) {
        handle = await (window as any).showSaveFilePicker({
          suggestedName: "blender_command.txt",
          types: [
            {
              description: "Text File",
              accept: { "text/plain": [".txt"] },
            },
          ],
        });
        setFileHandle(handle);
      }

      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (e) {
      console.log("保存がキャンセルされました", e);
    }
  };

  // 選択中かどうかの判定
  const isSelectedCell = (y: number, x: number) => {
    if (!selectedCenter) return false;

    const c = selectedCenter;
    const baseSize = attractionSize[c.name];
    if (!baseSize) return false;

    const w = c.rotation === 90 || c.rotation === 270 ? baseSize.h : baseSize.w;
    const h = c.rotation === 90 || c.rotation === 270 ? baseSize.w : baseSize.h;

    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    return (
      x >= c.x - halfW &&
      x <= c.x + halfW &&
      y >= c.y - halfH &&
      y <= c.y + halfH
    );
  };


  return (
    <div className="app">
      <div className="header">
        <div className="top-bar">
          <img src="/public/img/icon.png" alt="" className="icon" />
          <p className="title">ParkCraft</p>
        </div>
      </div>

      <div className="main">
        <div className="grid">
          {grid.map((row, y) => (
            <div className="row" key={y}>
              {row.map((cell, x) => (
                <button
                  key={x}
                  className={`cell ${isSelectedCell(y, x) ? "selected" : ""}`}
                  onClick={() => (mode === "place" ? handlePlace(y, x) : handleSelect(y, x))}
                >
                  {cell.name && (
                    <img
                      src={attractionPasses[cell.name]}
                      alt={cell.name}
                      className="attraction"
                      style={{
                        transform: `rotate(${cell.rotation}deg)`,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="menu">
          <h3>アトラクション</h3>
          <select
            value={selectedAttraction}
            onChange={(e) => setSelectedAttraction(e.target.value)}
          >
            {attractions.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <h3>向き</h3>
          <select
            value={selectedRotation}
            onChange={(e) => setSelectedRotation(Number(e.target.value))}
          >
            {rotations.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <h3>編集</h3>
          <button
            className="btn"
            onClick={() => { setMode(mode === "place" ? "select" : "place"); setSelectedCenter(null); }}>
            {mode === "place" ? "削除するアトラクションを選択" : "配置モードに戻る"}
          </button>

          <button
            className="btn"
            onClick={handleDelete}
            disabled={!selectedCenter}
            style={{ marginTop: 8 }}
          >
            選択中を削除
          </button>

          {selectedCenter && (
            <div style={{ marginTop: 8 }}>
              選択中： {selectedCenter.name}({selectedCenter.rotation}°) <br></br>
              座標：({selectedCenter.x},{selectedCenter.y})
            </div>
          )}


          <div className="complete">
            <button
              className="btn"
              onClick={handleExport}>完成（上書き保存）</button>
          </div>
        </div>
      </div>
    </div>
  );
}