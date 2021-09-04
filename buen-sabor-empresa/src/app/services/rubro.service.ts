import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Rubro } from '../models/rubro';

@Injectable({
  providedIn: 'root'
})
export class RubroService {

  private rubroUrl = environment.rubroUrl;
  private header: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) { }

  // Obtener todos los rubros
  getAllRubros(): Observable<Rubro[]> {
    return this.http.get<Rubro[]>(this.rubroUrl + "/todos", { headers: this.header });
  }

  // Obtener todos los rubros activos
  getAllRubrosActivos(): Observable<Rubro[]> {
    return this.http.get<Rubro[]>(this.rubroUrl + "/todosActivo", { headers: this.header });
  }

  // Obtener un rubro por id
  getRubroById(id: any): Observable<Rubro> {
    return this.http.get<Rubro>(this.rubroUrl + '/' + id, { headers: this.header });
  }

  // Guardar-actualizar rubro
  saveRubro(rubro: Rubro): Observable<Rubro> {
    return this.http.post<Rubro>(this.rubroUrl, rubro, { headers: this.header });
  }

  // Eliminar un rubro por id
  deleteRubroById(id: any) {
    return this.http.delete(this.rubroUrl + '/' + id, { responseType: 'text' });
  }

}
