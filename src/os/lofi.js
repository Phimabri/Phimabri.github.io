// lofi.fm: a tiny generative lofi radio made with WebAudio (no audio files).
// Rain on the window + vinyl crackle + slow jazzy chords + a soft, lazy beat. Off by default.
export function createLofi() {
  let ctx = null, master = null, timer = null, playing = false, step = 0;

  // Fmaj7 · Em7 · Dm9 · Cmaj7 (midi notes), voiced low and warm
  const CHORDS = [
    [53, 57, 60, 64, 69],
    [52, 55, 59, 62, 67],
    [50, 53, 57, 60, 64],
    [48, 52, 55, 59, 64],
  ];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const BEAT = 60 / 72; // 72 bpm, laid back

  function noiseBuffer(seconds, fill) {
    const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = b.getChannelData(0);
    fill(d);
    return b;
  }

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 3200;
    master.connect(warm).connect(ctx.destination);

    // rain: brown-ish noise, band-limited, gently breathing
    const rainBuf = noiseBuffer(4, (d) => { let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 + w * 0.08; } });
    const rain = ctx.createBufferSource();
    rain.buffer = rainBuf;
    rain.loop = true;
    const rainF = ctx.createBiquadFilter();
    rainF.type = 'bandpass';
    rainF.frequency.value = 900;
    rainF.Q.value = 0.4;
    const rainG = ctx.createGain();
    rainG.gain.value = 0.22;
    rain.connect(rainF).connect(rainG).connect(master);
    rain.start();

    // vinyl crackle: sparse clicks
    const crk = noiseBuffer(3, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0; });
    const crackle = ctx.createBufferSource();
    crackle.buffer = crk;
    crackle.loop = true;
    const crkF = ctx.createBiquadFilter();
    crkF.type = 'highpass';
    crkF.frequency.value = 1800;
    const crkG = ctx.createGain();
    crkG.gain.value = 0.18;
    crackle.connect(crkF).connect(crkG).connect(master);
    crackle.start();
  }

  function chord(notes, t) {
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    out.connect(lp).connect(master);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.09, t + 0.35);
    out.gain.setTargetAtTime(0.0001, t + BEAT * 3.4, 0.6);
    notes.forEach((n, i) => {
      for (const det of [-6, 5]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = hz(n);
        o.detune.value = det + (Math.random() - 0.5) * 4; // a little tape wobble
        o.connect(out);
        o.start(t + i * 0.025); // lazy strum
        o.stop(t + BEAT * 4 + 2);
      }
    });
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.4);
  }

  function hat(t, v = 0.05) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuffer(0.05, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f).connect(g).connect(master);
    s.start(t);
  }

  function schedule() {
    // one bar ahead, beat by beat
    const now = ctx.currentTime;
    while (nextT < now + 1.2) {
      const beat = step % 4;
      if (beat === 0) chord(CHORDS[Math.floor(step / 4) % CHORDS.length], nextT);
      if (beat === 0 || (beat === 2 && Math.random() < 0.6)) kick(nextT);
      hat(nextT + BEAT * 0.5 + 0.03, 0.035); // swung off-beat
      if (beat % 2 === 1) hat(nextT, 0.05);
      nextT += BEAT;
      step++;
    }
  }
  let nextT = 0;

  return {
    get playing() { return playing; },
    async toggle() {
      if (!ctx) setup();
      if (ctx.state === 'suspended') await ctx.resume();
      playing = !playing;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(playing ? 0.55 : 0, t, playing ? 0.8 : 0.4);
      if (playing) {
        nextT = t + 0.1;
        schedule();
        timer = setInterval(schedule, 300);
      } else {
        clearInterval(timer);
      }
      return playing;
    },
  };
}
