let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}

export function playTimesUpSound(): void {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two-tone descending buzzer
    const frequencies = [440, 330];
    const toneDuration = 0.25;

    frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = freq;

        gain.gain.setValueAtTime(0.3, now + i * toneDuration);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * toneDuration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now + i * toneDuration);
        oscillator.stop(now + (i + 1) * toneDuration);
    });
}
