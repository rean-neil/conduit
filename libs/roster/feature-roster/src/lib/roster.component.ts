import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  articleListInitialState,
  articleListQuery,
  articleListActions,
  ListType,
} from '@realworld/articles/data-access';
import { selectLoggedIn } from '@realworld/auth/data-access';
import { CommonModule } from '@angular/common';
import { ArticleListComponent } from '@realworld/articles/feature-articles-list/src';
import { RosterStoreService } from './roster.store';
import { provideComponentStore } from '@ngrx/component-store';
import { Store } from '@ngrx/store';
import { RosterService } from './roster.service';

@UntilDestroy()
@Component({
  selector: 'cdt-roster',
  standalone: true,
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.css'],
  imports: [CommonModule, ArticleListComponent],
  providers: [provideComponentStore(RosterStoreService)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RosterComponent implements OnInit {
  listConfig$ = this.store.select(articleListQuery.selectListConfig);
  isAuthenticated = false;
  users = this.store.select(articleListQuery.selectArticleEntities);

  constructor(private readonly store: Store, private apiService: RosterService) {}

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.apiService.getRoster().subscribe((response: any) => {
      this.users = response;
    });
  }
}
