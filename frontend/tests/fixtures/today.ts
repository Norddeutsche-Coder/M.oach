export const todayScenarios = [
  {
    name: 'regular training', date: '2026-10-16', state: {},
    expected: {
      title: 'Locker · 6 km', subtitle: 'ca. 33 min · 5:13–5:51 /km', readiness: 'Training Readiness 100 von 100',
      training: ['Aufwärmen5 min zügig gehen oder sehr locker traben', 'Hauptteil6 km locker bei 5:13–5:51 /km (ca. 33 min)', 'Abschluss5 min gehen, Waden und Hüftbeuger kurz dehnen', 'Regeneration10 min Mobility nach dem Lauf: Hüftbeuger, Waden und Gesäß je 2 × 45 s.Übungen ansehen ›'],
      stats: ['Geplante Wochen-kmi20 km0 gelaufen · nächste Woche 35', 'TrainingsphaseiRegenerationWoche 1 von 50'],
    },
  },
  {
    name: 'recovery day', date: '2026-10-19', state: {},
    expected: {
      title: 'Recovery-Tag', subtitle: 'Heute zählt Erholung: Mobility, Ernährung, Schlaf.', readiness: 'Training Readiness 100 von 100',
      training: ['Bewegung20–30 min Spaziergang oder lockeres Radeln (RPE ≤ 3), nur wenn es sich gut anfühlt', 'Regeneration15 min Mobility: Hüftbeuger, Waden sowie vordere und hintere Oberschenkel je 2 × 45 s je Seite, Glute Bridge 2 × 12, danach Faszienrolle für Waden und OberschenkelÜbungen ansehen ›'],
      stats: ['Geplante Wochen-kmi35 km0 gelaufen · nächste Woche 51', 'TrainingsphaseiRegenerationWoche 2 von 50'],
    },
  },
  {
    name: 'quality training and strength', date: '2026-12-15', state: {},
    expected: {
      title: 'Hügel · 11 km', subtitle: 'locker, davon 8 × 60 s bergauf kräftig (Trabpause)', readiness: 'Training Readiness 100 von 100',
      training: ['Aufwärmen15 min locker bei 5:05–5:42 /km, dann Lauf-ABC (ca. 8 min) und 3 × 80 m SteigerungÜbungen ansehen ›', 'Hauptteillocker, davon 8 × 60 s bergauf kräftig (Trabpause)', 'Auslaufen10–15 min sehr locker bei 5:42 /km', 'Regeneration10 min Mobility nach dem Lauf: Hüftbeuger, Waden und Gesäß je 2 × 45 s, danach Faszienrolle für Waden und Oberschenkel.Übungen ansehen ›'],
      stats: ['Geplante Wochen-kmi71 km0 gelaufen · nächste Woche 69', 'TrainingsphaseiGrundlagenWoche 10 von 50'],
    },
  },
  {
    name: 'long run', date: '2026-12-20', state: {},
    expected: {
      title: 'Longrun · 20 km', subtitle: '20 km @ 5:04–5:41', readiness: 'Training Readiness 100 von 100',
      training: ['Start5–10 min sehr locker, die ersten 3 km bewusst langsam', 'Hauptteil20 km @ 5:04–5:41', 'Abschluss10 min gehen oder sehr locker traben, danach Beine 10 min hochlegen', 'Regeneration10 min Mobility nach dem Lauf: Hüftbeuger, Waden und Gesäß je 2 × 45 s, danach Beine 10 min hochlegen.Übungen ansehen ›'],
      stats: ['Geplante Wochen-kmi71 km0 gelaufen · nächste Woche 69', 'TrainingsphaseiGrundlagenWoche 10 von 50'],
    },
  },
  {
    name: 'no plan', date: '2026-10-16', state: { noPlan: true },
    expected: {
      title: 'Kein Trainingsplan aktiv', subtitle: 'Deine Läufe und dein Zustand werden trotzdem verfolgt. Im Kalender erstellst du einen neuen Plan.', readiness: 'Training Readiness 100 von 100',
      training: ['HeuteLocker laufen oder bewegen, ganz nach Gefühl. Achte auf deine Training Readiness und deinen Zustand.', 'PlanFür konkrete Einheiten erstellst du im Kalender einen Plan: für ein Rennen oder zum Erhalten deiner Ausdauer.'],
      stats: ['Wochen-kmi0 kmgelaufen · kein Plan', 'TrainingsphaseiKein PlanIm Kalender erstellen'],
    },
  },
  {
    name: 'future plan', date: '2026-10-16', state: { start: '2026-11-01' },
    expected: {
      title: 'Dein Plan startet bald', subtitle: 'Der erste Trainingstag ist der 1. November 2026.', readiness: 'Training Readiness 100 von 100',
      training: ['HeuteLocker laufen oder bewegen, ganz nach Gefühl. Achte auf deine Training Readiness und deinen Zustand.', 'PlanFür konkrete Einheiten erstellst du im Kalender einen Plan: für ein Rennen oder zum Erhalten deiner Ausdauer.'],
      stats: ['Wochen-kmi0 kmgelaufen · kein Plan', 'TrainingsphaseiStartet baldStart 01.11.'],
    },
  },
  {
    name: 'finished plan', date: '2026-10-16', state: { race: '2026-10-01', start: '2026-01-01' },
    expected: {
      title: 'Rennen geschafft', subtitle: 'Gönn dir Erholung: 1–2 Wochen nur locker oder frei. Danach legst du im Kalender einen neuen Plan an.', readiness: 'Training Readiness 100 von 100',
      training: ['HeuteLocker laufen oder bewegen, ganz nach Gefühl. Achte auf deine Training Readiness und deinen Zustand.', 'ErholungNach einem Rennen: 1–2 Wochen nur locker oder frei, dann wieder aufbauen.', 'PlanFür konkrete Einheiten erstellst du im Kalender einen Plan: für ein Rennen oder zum Erhalten deiner Ausdauer.'],
      stats: ['Wochen-kmi0 kmgelaufen · kein Plan', 'TrainingsphaseiAbgeschlossenNeuen Plan erstellen'],
    },
  },
  {
    name: 'race day', date: '2026-10-16', state: { race: '2026-10-16', start: '2026-01-01' },
    expected: {
      title: 'MARATHON', subtitle: 'Renntag! Ziel 2:45:00 (3:55/km). Erste 10 km kontrolliert bei ca. 3:59/km.', readiness: 'Training Readiness 100 von 100',
      training: ['Aufwärmen15–20 min locker, Lauf-ABC 2 × 20 m, 4 × 80–100 m SteigerungÜbungen ansehen ›', 'RennenRenntag! Ziel 2:45:00 (3:55/km). Erste 10 km kontrolliert bei ca. 3:59/km.', 'Danach10–15 min auslaufen, Ergebnis unter „Leistung“ eintragen', 'Regeneration10 min Mobility nach dem Lauf: Hüftbeuger, Waden und Gesäß je 2 × 45 s, danach Beine 10 min hochlegen.Übungen ansehen ›'],
      stats: ['Geplante Wochen-kmi64 km0 gelaufen · nächste Woche 0', 'TrainingsphaseiTaperingWoche 42 von 42'],
    },
  },
  {
    name: 'reduced readiness', date: '2026-10-16', state: { well: { '2026-10-16': { sleep: 4, rd: 40, ctl: 30, atl: 75 } } },
    expected: {
      title: 'Heute Pause', subtitle: 'Heute kein Lauftraining.', readiness: 'Training Readiness 25 von 100',
      training: ['Bewegung20–30 min Spaziergang oder lockeres Radeln (RPE ≤ 3), nur wenn es sich gut anfühlt', 'Regeneration15 min Mobility: Hüftbeuger, Waden sowie vordere und hintere Oberschenkel je 2 × 45 s je Seite, Glute Bridge 2 × 12, danach Faszienrolle für Waden und OberschenkelÜbungen ansehen ›'],
      stats: ['Geplante Wochen-kmi20 km0 gelaufen · nächste Woche 35', 'TrainingsphaseiRegenerationWoche 1 von 50'],
    },
  },
] as const
