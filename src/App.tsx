import { useState } from "react";
import "./App.css";

type Center = {
  name: string;
  x: number;
  y: number;
  rotation: number;
};


const attractionPasses: Record<string, string> = {
  "観覧車": "public/img/ferriswheel.png",
  "メリーゴーランド": "public/img/merrygoround.png",
  "コースター": "public/img/coaster.png",
  "フリーフォール": "public/img/freefall.png",
  "コーヒーカップ": "public/img/coffeecup.png",
  "お化け屋敷": "public/img/ghosthouse.png",
  "バイキング": "public/img/viking.png"
};

const attractions = [
  "観覧車",
  "メリーゴーランド",
  "コースター",
  "フリーフォール",
  "コーヒーカップ",
  "お化け屋敷",
  "バイキング"
];

const filenameMap: Record<string, string> = {
  "観覧車": "ferriswheel",
  "メリーゴーランド": "merrygoround",
  "コースター": "coaster",
  "フリーフォール": "freefall",
  "コーヒーカップ": "coffeecup",
  "お化け屋敷": "ghosthouse",
  "バイキング": "viking"
};

const attractionSize: Record<string, { w: number; h: number }> = {
  "観覧車": { w: 3, h: 9 },
  "メリーゴーランド": { w: 2, h: 2 },
  "コースター": { w: 3, h: 13 },
  "フリーフォール": { w: 1, h: 1 },
  "コーヒーカップ": { w: 3, h: 3 },
  "お化け屋敷": { w: 3, h: 5 },
  "バイキング": { w: 3, h: 7 }
};

const rotations = [0, 90, 180, 270];

export default function App() {
  const [selectedAttraction, setSelectedAttraction] = useState("観覧車");
  const [selectedRotation, setSelectedRotation] = useState(0);

  // 11 × 18 のグリッド
  const [grid, setGrid] = useState(
    Array.from({ length: 11 }, () =>
      Array.from({ length: 18 }, () => ({ name: "", rotation: 0 }))
    )
  );

  // 中心座標を持つ配列
  const [center, setCenter] = useState<Center[]>([]);


  // 中心のみ配置
  // const handleClick = (y: number, x: number) => {
  //   const newGrid = [...grid];
  //   newGrid[y][x] = {
  //     name: selectedAttraction,
  //     rotation: selectedRotation,
  //   };
  //   setGrid(newGrid);
  // };

  const handleClick = (cy: number, cx: number) => {
    const baseSize = attractionSize[selectedAttraction];
    if (!baseSize) return; // サイズデータがなければスルー

    // 回転後の幅・高さを計算
    const w =
      selectedRotation === 90 || selectedRotation === 270
        ? baseSize.h
        : baseSize.w;

    const h =
      selectedRotation === 90 || selectedRotation === 270
        ? baseSize.w
        : baseSize.h;

    // 中心座標計算
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // 重なり判定
    let canPlace = true;
    for (let dy = -halfH; dy <= halfH; dy++){
      for (let dx = -halfW; dx <= halfW; dx++){
        const y = cy + dy;
        const x = cx + dx;

        if (y < 0 || y >= grid.length) {
          canPlace = false;
          break;
        }
        if (x < 0 || x >= grid[0].length) {
          canPlace = false;
          break;
        }
        if (grid[y][x].name !== "") {
          canPlace = false;
          break;
        }
      }
      if(!canPlace){
        break;
      }
    }

    if (!canPlace) {
      alert("ここには配置できません");
      return;
    }


    const newGrid = grid.map((row) => row.slice()); // 深いコピーを作成

    // 範囲を埋める
    for (let dy = -halfH; dy <= halfH; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        const y = cy + dy;
        const x = cx + dx;

        // 画面外チェック
        if (y < 0 || y >= grid.length) continue;
        if (x < 0 || x >= grid[0].length) continue;

        newGrid[y][x] = {
          name: selectedAttraction,
          rotation: selectedRotation,
        };
      }
    }

    setGrid(newGrid);


    // 中心だけ登録
    setCenter((prev) => [
      ...prev.filter((c) => !(c.x === cx && c.y === cy)), // 同じ位置は削除
      {
        name: selectedAttraction,
        x: cx,
        y: cy,
        rotation: selectedRotation
      }
    ]);
  };

  // 座標データをダウンロード
  const handleExport = () => {
    let data = "";

    center.forEach((c) => {
      const filename = filenameMap[c.name] ?? "unkonwn";
      data += `${filename},${c.x},${c.y},${c.rotation}\n`;
    });

    const blob = new Blob([data], { type: "text/plain" }); // Blob(ファイル化できるデータ)に変換するよ
    const url = URL.createObjectURL(blob); // 一時的なダウンロード用のURLを作成するよ

    const a = document.createElement("a");
    a.href = url;
    a.download = "blender_command.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      {/* 上部の表示 */}
      <div className="header">
        <div className="top-bar">
          <img src="/public/img/icon.png" alt="" className="icon"/>
          <p className="title">ParkCraft</p>
        </div>
      </div>

      {/* メインエリア */}
      <div className="main">
        {/* グリッド */}
        <div className="grid">
          {grid.map((row, y) => (
            <div className="row" key={y}>
              {row.map((cell, x) => (
                <button
                  key={x}
                  className="cell"
                  onClick={() => handleClick(y, x)}
                >
                  {cell.name && (
                    <img
                      src={attractionPasses[cell.name]}
                      alt={cell.name}
                      className="attraction"
                      style={{ transform: `rotate(${cell.rotation}deg)` }}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* 右側メニュー */}
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

          <div className="select-attraction-bar">
            <h3>
              選択中のアトラクション
            </h3>
          </div>
          <div className="select-attraction">
            {selectedAttraction}（{selectedRotation}°）
          </div>
          <div className="complete">
            <button onClick={handleExport}>完成</button>
          </div>
        </div>
      </div>
    </div>
  );
}