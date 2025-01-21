import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// has to be a class. hooks can't catch a render error, getDerivedStateFromError is
// the only api react offers for it.
//
// without one of these, a throw anywhere in the tree unmounts the whole app and
// leaves a blank page with the reason in a console nobody has open.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // TODO: ship this somewhere once there's an error reporter
    console.error('Unhandled render error', error, info.componentStack);
  }

  private readonly retry = (): void => {
    this.setState({ error: null });
  };

  private readonly reload = (): void => {
    window.location.assign('/');
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.wrapper} role="alert">
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>
          The page ran into an unexpected problem. Trying again often works, and if it doesn&apos;t,
          starting from the home page will.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={this.retry}>
            Try again
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={this.reload}
          >
            Go to home page
          </button>
        </div>
      </div>
    );
  }
}
