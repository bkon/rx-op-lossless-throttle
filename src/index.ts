import { Observable, Scheduler, Subscription } from "rxjs";
import { IScheduler } from "rxjs/Scheduler";

export interface IConfig {
  bufferSize?: number;
  raiseOnOverflow?: boolean;
  windowSize: number;
}

const normalizeConfig = (delayOrConfig: number | IConfig): IConfig => {
  if (typeof delayOrConfig === "number") {
    return {
      bufferSize: null,
      raiseOnOverflow: false,
      windowSize: delayOrConfig
    };
  }

  return Object.assign(
    {},
    { bufferSize: null, raiseOnOverflow: false },
    delayOrConfig
  );
};

function throttleOp<T>(
  delayOrConfig: number | IConfig,
  scheduler: IScheduler = Scheduler.async
) {
  const config: IConfig = normalizeConfig(delayOrConfig);

  return new Observable((observer) => {
    let done: boolean = false;
    let buffered: number = 0;
    let lastEmissionAt: number = null;

    const emit = (value: T) => {
      observer.next(value);
      lastEmissionAt = scheduler.now();

      if (done && buffered === 0) {
        observer.complete();
      }
    };

    const raise = () => observer.error({
      data: {
        config
      },
      message: "Buffer overflow",
      source: "rx-op-lossless-throttle"
    });

    const group = new Subscription();

    group.add(this.subscribe(
      (value: T) => {
        const delta = scheduler.now() - lastEmissionAt;

        if (lastEmissionAt == null ||
           delta > config.windowSize) {
          emit(value);
          return;
        }

        if (config.bufferSize !== null &&
            buffered >= config.bufferSize) {
          if (config.raiseOnOverflow) {
            raise();
          }

          return;
        }

        buffered ++;
        scheduler.schedule(
          () => { buffered--; emit(value); },
          lastEmissionAt + config.windowSize * buffered - scheduler.now()
        );
      },
      observer.error.bind(observer),
      () => {
        done = true;
        if (buffered === 0) {
          observer.complete();
        }
      }
    ));

    return group;
  });
}

const throttleLet = <T>(
  delay: number | IConfig,
  scheduler?: IScheduler
) => (
  source: Observable<T>
): Observable<T> => {
  return throttleOp.call(source, delay, scheduler);
};

export { throttleOp, throttleLet };
