import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor(
    private http: HttpClient,
  ) { }

  getAllPortfolios(){
    return this.http.get(`${environment.baseUrl}/api/portfolio`)
  }

  uploadTransFiles(portfolioId, stockId, file){
    const formData = new FormData();
    formData.append("file", file, file.name)
    return this.http.post(`${environment.baseUrl}/api/portfolio/${portfolioId}/${stockId}`, formData)
  }

  getPortfolioTrendById(portfolioId){
    return this.http.get(`${environment.baseUrl}/api/portfolio`, {
      params: {
        'pid': portfolioId,
        'invTrend': "1"
      }
    })
  }

  getPortfolioById(portfolioId){
    return this.http.get(`${environment.baseUrl}/api/portfolio`, {
      params: {
        'pid': portfolioId
      }
    })
  }

  removeInvestmentFromPF(investmentId){
    return this.http.delete(`${environment.baseUrl}/api/portfolio`, {
      params: {
        isStock: '1',
        iid: investmentId
      }
    })
  }

  removePortfolioById(portfolioId){

    return this.http.delete(`${environment.baseUrl}/api/portfolio`, {
      params: {
        isStock: '0',
        pid: portfolioId
      }
    })
  }

  addNewInvestment(portfolioId, newInvestment){
    return this.http.put(`${environment.baseUrl}/api/portfolio`, {
      'isStock': 1,
      'date': newInvestment.inv_date,
      'sid': newInvestment.inv_stock_id,
      'qty': newInvestment.inv_stock_qty,
      'cost_per_share': newInvestment.inv_stock_cost_per_share,
      'pid': portfolioId,
      'remarks': newInvestment.inv_remarks
    })
  }

  addNewPortfolio(portfolioName){
    return this.http.put(`${environment.baseUrl}/api/portfolio`, {
      'name': portfolioName
    })
  }

  sellInvestment(investmentId){
    return this.http.delete(`${environment.baseUrl}/api/portfolio`, {
      params: {
        'isStock': '1',
        'action': 'sell',
        'investmentId': investmentId
      }
    })
  }

  removeInvestment(investmentId){
    return this.http.delete(`${environment.baseUrl}/api/portfolio`, {
      params: {
        'isStock': '1',
        'action': 'remove',
        'investmentId': investmentId
      }
    })
  }

  getPriceHistoryForPortfolio(portfolioId, lookBack=120){
    return this.http.get(`${environment.baseUrl}/api/portfolio/trend`, {
      params: {
        'pid': portfolioId,
        'lb': lookBack.toString()
      }
    })
  }

}
