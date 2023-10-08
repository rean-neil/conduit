import { Injectable } from '@angular/core';
import { ComponentStore, OnStateInit, tapResponse } from '@ngrx/component-store';
import { pipe } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RosterService } from './roster.service';

export interface RosterState {
  tags: string[];
}

@Injectable()
export class RosterStoreService extends ComponentStore<RosterState> implements OnStateInit {
  constructor(private readonly rosterService: RosterService) {
    super({ tags: [] });
  }

  ngrxOnStateInit() {
    // this.getTags();
  }

  // SELECTORS
  tags$ = this.select((store) => store.tags);


}
