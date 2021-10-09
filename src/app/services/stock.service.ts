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

  getAllIndices(){
    return this.http.get(`${environment.baseUrl}/api/index`, {
      params: {
        'all': '1'
      }
    })
  }

  getIndexPriceHistory(ind, lookBack=90){
    return this.http.get(`${environment.baseUrl}/api/index`, {
      params: {
        'index_id': ind.ind_id.toString(),
        'history': lookBack.toString()
      }
    })
  }

  fetchCommonData(){
    return this.http.get(`${environment.baseUrl}/api/common`)
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

  async asyncGetPriceHistory(stock_id, lookBack=90){
    let data = await this.getPriceHistory(stock_id, lookBack).toPromise()
    return data
  }

  getPriceHistory(stock_id, lookBack=90){
    return this.http.get(`${environment.baseUrl}/api/stock`, {
      params: {
        'stock_id': stock_id,
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

  getNewsforStocks(stocks = []){
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
        'type': 'news',
        'window': '30'
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

  getBrokerRatings(){

    return this.http.get(`${environment.baseUrl}/api/analytics`, {
      params: {
        'stockIds': '-1',
        'type': 'brokerrating',
      }
    })
  }

  getTopMFHoldings(stocks=[], n=50){
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
    return this.http.get(`${environment.baseUrl}/api/analytics`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'topmfholdings',
        'n': n.toString()
      }
    })
  }

  getTopChangers(window=60, detail='toplosers'){
    let stocks = [{
      'stock_id': -1
    }]
 
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/analytics`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': detail,
        'window': window.toString(),
        'n': '1000'
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

  updateBrokresValidity(brokres_id: String){
    return this.http.get(`${environment.baseUrl}/api/analytics`, {
      params: {
        'Ids': brokres_id.toString(),
        'action': 'update',
        'type': 'brokres_validity_update'
      }
    })
  }

  checkBrokres(brokres_id: String){
    return this.http.get(`${environment.baseUrl}/api/analytics`, {
      params: {
        'Ids': brokres_id.toString(),
        'action': 'update',
        'type': 'brokres_stock_check_update'
      }
    })
  }

  updateStockDetails(stocks, updateList){
    if(updateList.length == 0)
      updateList = ['insider-transaction',
      'income-statement',
      'income-statement',
      'balance-sheet',
      'ratios',
      'cash-flow',
      'price-history',
      'dividends',
      'board-meetings',
      'annoucements',
      'agm-egm',
      'broker-research',
      'block-deals',
      'bulk-deals',
      'quarterly-results',
      'shareholding',
      'news']

    // console.table(stocks)
    let stockIds = []
    stocks.forEach(stock => {
      if(stockIds.indexOf(stock.stock_id) == -1)
        stockIds.push(stock.stock_id)
    });
    return this.http.get(`${environment.baseUrl}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'action': 'update',
        'updateList': updateList.join(',')
      }
    })
  }

  
}
