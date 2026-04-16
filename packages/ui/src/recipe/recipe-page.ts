import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { cache } from 'lit/directives/cache.js';
import { createActor, type Actor } from 'xstate';
import { ContextProvider } from '@lit/context';
import { recipeMachine } from '../state/recipe-machine.js';
import type { RecipeContext } from '../state/recipe-machine.js';
import { ActorController } from '../controllers/actor-controller.js';
import { animatedSend } from '../state/animated-send.js';
import type { Recipe } from '@recipe/domain/recipe/types.js';
import type { Phase, ScheduleMode } from '@recipe/domain/schedule/types.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import { i18nContext, scaleFactorContext, recipeMachineContext } from '../contexts/recipe-contexts.js';
import { loadState } from '../state/persistence.js';
import './recipe-header.js';
import './servings-adjuster.js';
import './view-tabs.js';
import '../overview/overview-view.js';
import '../cooking/cooking-view.js';
import '../auth/hob-atproto-publish.js';

@customElement('recipe-page')
export class RecipePage extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host {
        display: block;
        background: var(--bg);
        min-height: 100dvh;
      }

      .loading-placeholder {
        margin: 16px;
        padding: 24px;
        background: var(--card);
        border-radius: var(--radius);
        text-align: center;
        color: var(--text-dim);
        font-size: var(--text-base);
      }
    `,
  ];

  @property({ attribute: false }) recipe!: Recipe;
  @property({ attribute: false }) scheduleRelaxed: Phase[] = [];
  @property({ attribute: false }) scheduleOptimized: Phase[] = [];
  @property({ attribute: false }) i18n: Record<string, any> = {};

  private _ctrl?: ActorController<typeof recipeMachine>;
  private _actor?: Actor<typeof recipeMachine>;
  private _i18nProvider = new ContextProvider(this, { context: i18nContext, initialValue: {} });
  private _scaleFactorProvider = new ContextProvider(this, { context: scaleFactorContext, initialValue: 1 });

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('i18n')) {
      this._i18nProvider.setValue(this.i18n);
    }
    if (
      this.recipe &&
      !this._actor &&
      (changed.has('recipe') || changed.has('scheduleRelaxed') || changed.has('scheduleOptimized'))
    ) {
      this._startMachine();
    }
  }

  private _startMachine(): void {
    const recipe = this.recipe;
    const persisted = loadState();
    const slug = recipe.meta.slug;
    const savedServings = persisted.servings?.[slug];
    const savedStep = persisted.currentStep?.[slug];

    const totalSteps = this.scheduleRelaxed.reduce(
      (sum, phase) => sum + phase.operations.length,
      0,
    );

    const actor = createActor(recipeMachine, {
      input: {
        recipe,
        scheduleModes: {
          relaxed: this.scheduleRelaxed,
          optimized: this.scheduleOptimized,
        },
        mode: persisted.mode ?? 'relaxed' as ScheduleMode,
        servings: savedServings ?? recipe.meta.servings,
        originalServings: recipe.meta.servings,
        totalSteps,
        currentStep: savedStep !== undefined ? Math.min(savedStep, totalSteps) : undefined,
      },
    });

    this._actor = actor;
    this._ctrl = new ActorController(this, actor);

    // ContextProvider auto-registers on `this` — no ref needed to keep alive.
    new ContextProvider(this, {
      context: recipeMachineContext,
      initialValue: actor,
    });

    actor.subscribe((snapshot) => {
      const ctx = snapshot.context;
      this._scaleFactorProvider.setValue(ctx.servings / ctx.originalServings);
    });

    actor.start();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._actor?.stop();
  }

  // -- Event handlers (thin: just forward to machine) ----------------------

  private _onAdjustServings(e: CustomEvent<{ delta: number }>) {
    this._ctrl?.send({ type: 'ADJUST_SERVINGS', delta: e.detail.delta });
  }

  private _onSwitchView(e: CustomEvent<{ view: 'overview' | 'cooking' }>) {
    if (this._ctrl) {
      animatedSend(this._ctrl.actorRef, { type: 'SWITCH_VIEW', view: e.detail.view });
    }
  }

  private _onSetMode(e: CustomEvent<{ mode: ScheduleMode }>) {
    if (this._ctrl) {
      animatedSend(this._ctrl.actorRef, { type: 'SET_MODE', mode: e.detail.mode });
    }
  }

  private _onNextStep() {
    if (this._ctrl) {
      animatedSend(this._ctrl.actorRef, { type: 'NEXT_STEP' });
    }
  }

  private _onPrevStep() {
    if (this._ctrl) {
      animatedSend(this._ctrl.actorRef, { type: 'PREV_STEP' });
    }
  }

  private _onStartTimer(e: CustomEvent<{ opId: string; seconds: number }>) {
    this._ctrl?.send({ type: 'START_TIMER', opId: e.detail.opId, seconds: e.detail.seconds });
  }

  private _onCancelTimer(e: CustomEvent<{ opId: string }>) {
    this._ctrl?.send({ type: 'CANCEL_TIMER', opId: e.detail.opId });
  }

  // -- Derived data --------------------------------------------------------

  private _buildTimerPills(ctx: RecipeContext) {
    const pills: { opId: string; remaining: number; action: string }[] = [];
    for (const [opId, timer] of ctx.timerStates) {
      let action = '';
      for (const phase of ctx.scheduleModes[ctx.mode]) {
        for (const op of phase.operations) {
          if ('id' in op && op.id === opId) {
            action = op.action;
          }
        }
      }
      pills.push({ opId, remaining: timer.remaining, action });
    }
    return pills;
  }

  private _getActiveView(): 'overview' | 'cooking' {
    return this._ctrl?.matches({ view: 'cooking' }) ? 'cooking' : 'overview';
  }

  // -- Render --------------------------------------------------------------

  override render() {
    if (!this._ctrl?.snapshot || !this.recipe) {
      return html`<div class="loading-placeholder">Loading recipe...</div>`;
    }

    const ctx = this._ctrl.snapshot.context;
    const activeView = this._getActiveView();
    const phases = ctx.scheduleModes[ctx.mode];

    return html`
      <recipe-header
        .title=${ctx.recipe.meta.title}
        .difficulty=${ctx.recipe.meta.difficulty}
        .totalTime=${ctx.recipe.meta.totalTime}
        .mode=${ctx.mode}
        .tags=${ctx.recipe.meta.tags}
        .servings=${ctx.servings}
      ></recipe-header>

      <servings-adjuster
        .servings=${ctx.servings}
        .label=${this.i18n.servings ?? 'Servings'}
        @adjust-servings=${this._onAdjustServings}
      ></servings-adjuster>

      <div style="text-align: center; padding: 0 var(--space-md);">
        <hob-atproto-publish .recipe=${ctx.recipe}></hob-atproto-publish>
      </div>

      <view-tabs
        .activeView=${activeView}
        .overviewLabel=${this.i18n.overview ?? 'Overview'}
        .cookingLabel=${this.i18n.cooking ?? 'Cooking'}
        @switch-view=${this._onSwitchView}
      ></view-tabs>

      ${cache(when(
        activeView === 'overview',
        () => html`
            <overview-view
              .phases=${phases}
              .equipment=${ctx.recipe.equipment}
              .mode=${ctx.mode}
              .i18n=${this.i18n}
              @set-mode=${this._onSetMode}
            ></overview-view>
          `,
        () => html`
            <cooking-view
              .phases=${phases}
              .currentStep=${ctx.currentStep}
              .recipe=${ctx.recipe}
              .i18n=${this.i18n}
              .activeTimers=${this._buildTimerPills(ctx)}
              @next-step=${this._onNextStep}
              @prev-step=${this._onPrevStep}
              @start-timer=${this._onStartTimer}
              @cancel-timer=${this._onCancelTimer}
            ></cooking-view>
          `,
      ))}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'recipe-page': RecipePage;
  }
}
