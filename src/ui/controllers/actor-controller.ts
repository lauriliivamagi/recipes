import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  Actor,
  AnyActorLogic,
  AnyActorRef,
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

/**
 * Lit ReactiveController that selects a slice of an actor's snapshot.
 * Only triggers host updates when the selected value changes.
 * Mirrors useSelector from @xstate/react.
 */
export class SelectorController<TSelected> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _actorRef: AnyActorRef;
  private _selector: (snapshot: any) => TSelected;
  private _compare: (a: TSelected, b: TSelected) => boolean;
  private _subscription: { unsubscribe(): void } | null = null;

  value: TSelected;

  constructor(
    host: ReactiveControllerHost,
    actorRef: AnyActorRef,
    selector: (snapshot: any) => TSelected,
    compare: (a: TSelected, b: TSelected) => boolean = Object.is,
  ) {
    this._host = host;
    this._actorRef = actorRef;
    this._selector = selector;
    this._compare = compare;
    this.value = selector(actorRef.getSnapshot());
    host.addController(this);
  }

  hostConnected(): void {
    this.value = this._selector(this._actorRef.getSnapshot());
    this._subscription = this._actorRef.subscribe((snapshot: any) => {
      const next = this._selector(snapshot);
      if (!this._compare(this.value, next)) {
        this.value = next;
        this._host.requestUpdate();
      }
    });
  }

  hostDisconnected(): void {
    this._subscription?.unsubscribe();
    this._subscription = null;
  }
}
