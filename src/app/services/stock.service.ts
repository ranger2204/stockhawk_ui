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

  getStocksBySector(sector){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'sector': sector
      }
    })
  }

  getAllSectors(){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'sector': '1'
      }
    })
  }

  getPriceHistory(stock, lookBack=90){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'stock_id': stock.stock_id,
        'history': lookBack.toString()
      }
    })
  }

  getAllStocksDetails(){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'all': '1'
      }
    })
  }

  getAGMforStocks(stocks = []){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'agm',
        'window': '120'
      }
    })
  }
  
  getInsforStocks(stocks=[]){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'insider'
      }
    })
  }

  getBrokResforStocks(stocks=[], window=100){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'broker-research',
        'window': window.toString()
      }
    })
  }

  getDealsforStocks(stocks=[]){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'deals'
      }
    })
  }

  getBMforStocks(stocks=[]){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'bm',
        'window': '60'
      }
    })
  }
  getCompetitionForStocks(stocks){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'competition',
      }
    })
  }

  getQuaterlyForStocks(stocks=[], window=1000){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'quarterly',
        'window': window.toString()
      }
    })
  }

  getDividendForStocks(stocks=[], window=30){
    if(stocks.length == 0){
      stocks = [{
        'stock_id': -1
      }]
    }
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'dividends',
        'window': window.toString()
      }
    })
  }

  updateStockDetails(stocks){
    // console.table(stocks)
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'action': 'update'
      }
    })
  }

  
}
