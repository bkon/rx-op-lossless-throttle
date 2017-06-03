import { Observable, Scheduler, Subscription } from "rxjs";
import { IScheduler } from "rxjs/Scheduler";

function throttleOp<T>(
  delay: number,
  scheduler: IScheduler
) {
  scheduler = scheduler || Scheduler.async;

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

    const group = new Subscription();

    group.add(this.subscribe(
      (value: T) => {
        const delta = scheduler.now() - lastEmissionAt;

        if (lastEmissionAt == null ||
           delta > delay) {
          emit(value);
          return;
        }

        buffered ++;
        scheduler.schedule(
          () => { buffered--; emit(value); },
          lastEmissionAt + delay * buffered - scheduler.now()
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
  delay: number,
  scheduler: IScheduler
) => (
  source: Observable<T>
): Observable<T> => {
  return throttleOp.call(source, delay, scheduler);
};

export { throttleOp, throttleLet };
