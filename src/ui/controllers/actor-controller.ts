import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  Actor,
  AnyActorLogic,
  SnapshotFrom,
} from 'xstate';

/**
 * Lit ReactiveController that bridges an XState actor to the Lit update cycle.
 * Subscribes on hostConnected, unsubscribes on hostDisconnected.
 */
export class ActorController<TLogic extends AnyActorLogic> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _actor: Actor<TLogic>;
  private _subscription: { unsubscribe(): void } | null = null;

  snapshot: SnapshotFrom<TLogic>;

  constructor(host: ReactiveControllerHost, actor: Actor<TLogic>) {
    this._host = host;
    this._actor = actor;
    this.snapshot = actor.getSnapshot();
    host.addController(this);
  }

  get send() {
    return this._actor.send.bind(this._actor);
  }

  get actorRef(): Actor<TLogic> {
    return this._actor;
  }

  matches(stateValue: string | Record<string, any>): boolean {
    const snap = this.snapshot as any;
    return typeof snap?.matches === 'function' ? snap.matches(stateValue) : false;
  }

  hostConnected(): void {
    this.snapshot = this._actor.getSnapshot();
    this._subscription = this._actor.subscribe((snapshot) => {
      this.snapshot = snapshot;
      this._host.requestUpdate();
    });
  }

  hostDisconnected(): void {
    this._subscription?.unsubscribe();
    this._subscription = null;
  }
}