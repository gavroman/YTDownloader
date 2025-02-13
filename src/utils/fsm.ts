export type Transitions<TState extends string, TTransitionName extends string> = Record<
    TTransitionName,
    {
        from: TState;
        to: TState;
    }
>;

export class FSM<TState extends string, TTransitionName extends string> {
    private stateChangeHandlers: Array<(state: TState) => void> = [];
    private __initialState: TState;

    public makeTransition(transitionName: TTransitionName) {
        const transition = this.transitions[transitionName];
        if (this.state === transition.from) {
            this.__state = transition.to;
            // this.stateChangeHandlers.forEach((handler) => handler(this.state));
        }
    }

    public reset() {
        this.__state = this.__initialState;
    }

    constructor(
        private __state: TState,
        private transitions: Transitions<TState, TTransitionName>
    ) {
        this.__initialState = this.__state;
    }

    get state(): TState {
        return this.__state;
    }

    public onStateChange(handler: (state: TState) => void) {
        this.stateChangeHandlers.push(handler);
    }
}
