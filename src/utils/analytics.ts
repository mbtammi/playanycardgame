// Lightweight analytics wrapper allowing swap between providers (Firebase, GA4, custom)
// Avoids runtime errors if provider not initialized.

type AnalyticsEventParams = Record<string, any>;

interface AnalyticsBackend {
  log(eventName: string, params?: AnalyticsEventParams): void;
}

class ConsoleBackend implements AnalyticsBackend {
  log(eventName: string, params?: AnalyticsEventParams) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${eventName}`, params || {});
    }
  }
}

let backend: AnalyticsBackend = new ConsoleBackend();

export function setAnalyticsBackend(custom: AnalyticsBackend) {
  backend = custom;
}

export function track(eventName: string, params?: AnalyticsEventParams) {
  try {
    backend.log(eventName, { ts: Date.now(), ...(params || {}) });
  } catch (e) {
    // Swallow errors to avoid breaking UX
  }
}

// Semantic helpers
export const analytics = {
  gameCreationAttempt(source: 'simple' | 'advanced', generic: boolean) {
    track('game_create_attempt', { source, generic });
  },
  gameCreationSuccess(id: string, name: string) {
    track('game_create_success', { id, name });
  },
  gameCreationFailure(reason: string) {
    track('game_create_failure', { reason });
  },
  gameStarted(id: string, playerCount: number, asymmetric: boolean) {
    track('game_start', { id, playerCount, asymmetric });
  },
  actionPerformed(gameId: string, action: string, playerId: string, phase: string) {
    track('game_action', { gameId, action, playerId, phase });
  },
  winDetected(gameId: string, playerId: string, condition: string) {
    track('game_win', { gameId, playerId, condition });
  },
  forcedDraw(gameId: string, playerId: string) {
    track('game_forced_draw', { gameId, playerId });
  },
  deadlockMitigated(gameId: string) {
    track('game_deadlock_mitigated', { gameId });
  },
  socialProofImpression(source: string = 'landing_hero') {
    track('social_proof_impression', { source });
  }
};
