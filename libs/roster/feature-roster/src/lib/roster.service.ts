import { ApiService } from '@realworld/core/http-client';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RosterService {
  constructor(private http: HttpClient) {}

  getRoster(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/user-roster`);
  }
}
