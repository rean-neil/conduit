import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { ApiService } from '@realworld/core/http-client';
import { MockProvider } from 'ng-mocks';
import { RosterService } from './roster.service';

describe('RosterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RosterService, MockProvider(ApiService)],
    });
  });

  it('should be created', inject([RosterService], (service: RosterService) => {
    expect(service).toBeTruthy();
  }));
});
