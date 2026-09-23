import { AppState } from "../types";

export interface CoachMessage {
  tone: "good" | "ok" | "rest";
  text: string;
}

export function getCoachMessage(state: AppState, isWorking: boolean, remainingSec: number): CoachMessage {
  const done = state.stats.completedToday;
  const pomos = state.stats.pomodorosToday;
  const open = state.tasks.filter((t) => t.column !== "done").length;

  if (isWorking && remainingSec < 60) {
    return { tone: "ok", text: "Son bir dakika. Bitir, sonra kısa bir mola." };
  }
  if (done === 0 && pomos === 0) {
    return { tone: "ok", text: "Güne küçük bir görevle başla. 25 dakika yeter." };
  }
  if (done >= 5 || pomos >= 4) {
    return { tone: "good", text: "Bugün harika gidiyorsun! Ritmini koru." };
  }
  if (open > 8 && done < 2) {
    return { tone: "rest", text: "Liste kalabalık. Bir görevi seç, diğerlerini beklet." };
  }
  if (pomos >= 2 && done === 0) {
    return { tone: "rest", text: "Odak var ama çıktı yok. Görevi küçültmeyi dene." };
  }
  if (isWorking) {
    return { tone: "ok", text: "Odak modundasın. Bildirimleri kapat, tek işe bak." };
  }
  if (done > 0 && done < 3) {
    return { tone: "ok", text: "İyi tempo. Bir sonraki görevi 25 dakikaya sığdır." };
  }
  return { tone: "rest", text: "Biraz yavaşladın. 5 dakika mola vermek ister misin?" };
}
