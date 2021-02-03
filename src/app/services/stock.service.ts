import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(
    private http: HttpClient,
  ) { }

  getStockByName(stockName){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'name': stockName
      }
    })
  }
}
