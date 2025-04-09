import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Alert } from '../models/Alert';
import { Todo } from '../models/Todo';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  
  baseURL = localStorage.getItem('ESBaseURL');

  constructor(
    private http: HttpClient
  ) {}

  getStockByName(stockName){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'name': stockName
      }
    })
  }

  getLiveNews(lastId=-1){
    return this.http.get(`${this.baseURL}/api/live`, {
      params: {
        'live-type': 'live-news',
        'live-last-id': lastId.toString()
      }
    })
  }

  getAllLiveIndex(window=30){

    return this.http.get(`${this.baseURL}/api/live`, {
      params: {
        'live-type': 'live-index'
      }
    })
  }

  getAllIndices(){
    return this.http.get(`${this.baseURL}/api/index`, {
      params: {
        'all': '1'
      }
    })
  }

  getIndexPriceHistory(ind, lookBack=90){
    return this.http.get(`${this.baseURL}/api/index`, {
      params: {
        'index_id': ind.ind_id.toString(),
        'history': lookBack.toString()
      }
    })
  }

  addOption({stockId, expiryDate, strikePrice, optionType}){
    return this.http.put(`${this.baseURL}/api/options`, {
      stockId,
      expiryDate,
      strikePrice,
      optionType
    })
  }

  addOptionInvestment(optionId, buyDate, buyPrice, portfolioId){
    return this.http.put(`${this.baseURL}/api/options/investments`, {
      optionId,
      buyDate,
      buyPrice,
      portfolioId
    })
  }

  getAllOptionsInvestments(portfolioId=0){
    return this.http.get(`${this.baseURL}/api/options/investments`, {
      params: {
        'action': 'fetch_all',
        'portfolioId': portfolioId.toString()
      }
    })
  }

  

  deleteInvestment(invId) {
    return this.http.delete(`${this.baseURL}/api/options/investments`, {
      params: {
        'invId': invId.toString()
      }
    })
  }

  deleteOption(optionId) {
    return this.http.delete(`${this.baseURL}/api/options`, {
      params: {
        'optionId': optionId.toString()
      }
    })
  }

  fetchAllOptions() {
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'action': 'fetch_all'
      }
    })
  }

  getOptionsBet(){
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'action': 'fetch_bet'
      }
    })
  }

  sellOptionInv(invId, sellPrice, sellDate){
    console.log(sellDate)
    const formData: any = {};
    formData["invId"] = invId
    formData['sellPrice'] = sellPrice
    formData['sellDate'] = sellDate
    return this.http.post(`${this.baseURL}/api/options/investments`, formData)
  }


  fetchLive(optionIds:String[]) {
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'action': 'fetch_live',
        'optionId': optionIds.join(',')
      }
    })
  }

  fetchAllLive(optionIds) {
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'action': 'fetch_all_live',
        'optionId': optionIds
      }
    })
  }

  getExpiryStrikePriceForStock(stock_id){
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'stockId': stock_id.toString()
      }
    })
  }

  getOptionHistory(optionId){
    return this.http.get(`${this.baseURL}/api/options`, {
      params: {
        'action': "history",
        'optionId': optionId.toString()
      }
    })
  }

  fetchCommonData(){
    return this.http.get(`${this.baseURL}/api/common`)
  }

  getStocksBySector(sector){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'sector': sector
      }
    })
  }

  getAllSectors(){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'sector': '1'
      }
    })
  }

  async asyncGetPriceHistory(stock_id, lookBack=90){
    let data = await this.getPriceHistory(stock_id, lookBack).toPromise()
    return data
  }

  getPriceHistory(stock_ids: Array<any>, lookBack=90){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'stockIds': stock_ids.join(','),
        'history': lookBack.toString()
      }
    })
  }

  getPriceHistoryFromDB(stock_ids: Array<any>, lookBack=90, fromSOD=0){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'stockIds': stock_ids.join(','),
        'history': lookBack.toString(),
        'db': "1",
        'fromSOD': fromSOD.toString()
      }
    })
  }

  getAllStocksDetails(){
    return this.http.get(`${this.baseURL}/api/stock`, {
      params: {
        'all': '1'
      }
    })
  }

  getNewsforStocks(stockIds = []){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'news',
        'window': '30'
      }
    })
  }

  getAGMforStocks(stockIds = []){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'agm',
        'window': '120'
      }
    })
  }
  
  getInsforStocks(stockIds=[]){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'insider',
        'window': '180'
      }
    })
  }

  getBrokResforStocks(stockIds=[], window=100){
    if(stockIds.length == 0)
      stockIds = [-1]

    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'broker-research',
        'window': window.toString()
      }
    })
  }

  getBrokerRatings(skipCache=0){

    return this.http.get(`${this.baseURL}/api/analytics`, {
      params: {
        'stockIds': '-1',
        'type': 'brokerrating',
        'skipCache': skipCache.toString()
      }
    })
  }

  getTopMFHoldings(stocks=[], n=60, skipCache=0){
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
    return this.http.get(`${this.baseURL}/api/analytics`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'topmfholdings',
        'n': n.toString(),
        'skipCache': skipCache.toString()
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
    return this.http.get(`${this.baseURL}/api/analytics`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': detail,
        'window': window.toString(),
        // 'skipCache': "1",
        'n': '1000'
      }
    })
  }


  getDealsforStocks(stockIds=[]){
    if(stockIds.length == 0)
      stockIds = [-1]
    
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'deals'
      }
    })
  }

  getBMforStocks(stockIds=[]){
    if(stockIds.length == 0)
      stockIds = [-1]

    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'bm',
        'window': '60'
      }
    })
  }
  
  getCompetitionForStocks(stockIds=[]){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'competition',
      }
    })
  }

  removeAlertById(alertId: number){
    return this.http.delete(`${this.baseURL}/api/alerts`, {
      params: {
        'alertId': alertId.toString()
      }
    })
  }

  removeTodoById(todoId: number){
    return this.http.delete(`${this.baseURL}/api/todo`, {
      params: {
        'todoId': todoId.toString()
      }
    })
  }


  addNewAlert(portfolio: number, alert: Alert){
    return this.http.put(`${this.baseURL}/api/alerts`, {

      'alertPortfolioId': portfolio.toString(),
      'alertStockId': alert.alert_stock_id,
      'alertType': alert.alert_type,
      'alertValue': alert.alert_value,

    })
  }

  updateTodo(todoId: number, status: string, reason: string){
    return this.http.put(`${this.baseURL}/api/todo`, {

      'todoId': todoId,
      'status': status,
      'reason': reason

    })
  }

  addNewTodo(portfolio: number, todo: Todo){
    return this.http.put(`${this.baseURL}/api/todo`, {

      'portfolioId': portfolio.toString(),
      'stockId': todo.stockId,
      'action': todo.action,
      'startPrice': todo.startPrice,
      'reason': todo.reason

    })
  }


  getAlertForPorfolio(portfolioId: number){
    return this.http.get(`${this.baseURL}/api/alerts`, {
      params: {
        'portfolioId': portfolioId.toString(),
      }
    })
  }

  getTodoForPorfolio(portfolioId: number){
    return this.http.get(`${this.baseURL}/api/todo`, {
      params: {
        'portfolioId': portfolioId.toString(),
      }
    })
  }

  getAlertHistoryForDate(){
    return this.http.get(`${this.baseURL}/api/alert_history`)
  }

  getQuaterlyForStocks(stockIds=[], window=1000, frequency=3){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'quarterly',
        'window': window.toString(),
        'frequency': frequency.toString()
      }
    })
  }

  getEPSForStocks(stockIds=[], window=1000, frequency=3){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'eps',
        'window': window.toString(),
        'frequency': frequency.toString()
      }
    })
  }

  getAllLiveNews(window=30){

    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': '',
        'type': 'live-news',
        'window': window.toString()
      }
    })
  }

  

  getDividendForStocks(stockIds=[], window=30){
    if(stockIds.length == 0)
      stockIds = [-1]
    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'type': 'dividends',
        'window': window.toString()
      }
    })
  }

  updateBrokresValidity(brokres_id: String){
    return this.http.get(`${this.baseURL}/api/analytics`, {
      params: {
        'Ids': brokres_id.toString(),
        'action': 'update',
        'type': 'brokres_validity_update'
      }
    })
  }

  checkBrokres(brokres_id: String){
    return this.http.get(`${this.baseURL}/api/analytics`, {
      params: {
        'Ids': brokres_id.toString(),
        'action': 'update',
        'type': 'brokres_stock_check_update'
      }
    })
  }

  updateStockDetails(stockIds, updateList, lookBack=60){
    if(updateList.length == 0)
      updateList = [
      'insider-transaction',
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
      'news',
      'eps'
    ]


    return this.http.get(`${this.baseURL}/api/stock/details`, {
      params: {
        'stockIds': stockIds.join(','),
        'action': 'update',
        'updateList': updateList.join(','),
        'lookback': lookBack.toString(),
        
      }
    })
  }

  
}
