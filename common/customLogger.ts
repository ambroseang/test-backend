import {
  Injectable,
  Scope,
  ConsoleLogger,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  success(data?: any) {
    if (typeof data !== 'undefined') {
      this.log({
        response: '200',
        results: 'No problems',
        ...data,
      });
    }
    else {
      this.log({
        response: '200',
        results: 'No problems',
      });
    }
  }

  successCreate(data?: any) {
    if (typeof data !== 'undefined') {
      this.log({
        response: '201',
        results: 'Successfully created',
        ...data,
      });
    }
    else {
      this.log({
        response: '201',
        results: 'Successfully created',
      });
    }
  }
}